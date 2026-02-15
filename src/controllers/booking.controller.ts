import { Request, Response } from 'express';
import { prisma } from '../db';
import { PricingService } from '../pricing/pricing.service';
import { helperCalculateDistance } from '../utils/distance';
import { MatchingService } from '../algorithm/matching';
import { Booking, Prisma } from '@prisma/client';

export const createBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, pickup, dropoff, pickupTime, passengers } = req.body;

        if (!userId || !pickup || !dropoff || !pickupTime || !passengers) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // validate coordinates
        if (typeof pickup.lat !== 'number' || typeof pickup.lng !== 'number') {
            res.status(400).json({ error: 'Invalid pickup coordinates' });
            return;
        }

        // Calculate initial price estimate
        const distance_km = helperCalculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

        // Mock demand data for MVP (In a real system, query active requests count from Redis/DB)
        const activeRequests = await prisma.booking.count({ where: { status: 'PENDING' } });
        const availableVehicles = await prisma.vehicle.count({ where: { isAvailable: true } });

        const estimatedPrice = PricingService.calculatePrice(distance_km, activeRequests, availableVehicles || 1); // Avoid div by zero

        // Create booking in DB
        const booking = await prisma.booking.create({
            data: {
                userId,
                pickupLat: pickup.lat,
                pickupLng: pickup.lng,
                dropoffLat: dropoff.lat,
                dropoffLng: dropoff.lng,
                status: 'PENDING',
                fare: estimatedPrice,
            },
        });

        res.status(201).json({
            message: 'Booking created successfully',
            bookingId: booking.id,
            estimatedPrice,
            status: 'PENDING',
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const triggerMatching = async (_req: Request, res: Response): Promise<void> => {
    try {
        const pendingBookings = await prisma.booking.findMany({
            where: { status: 'PENDING' },
        });

        if (pendingBookings.length === 0) {
            res.status(200).json({ message: 'No pending bookings to match' });
            return;
        }

        // Convert DB bookings to Algorithm Input
        const requests = pendingBookings.map((b: Booking) => ({
            id: b.id,
            userId: b.userId,
            pickup: { lat: b.pickupLat, lng: b.pickupLng },
            dropoff: { lat: b.dropoffLat, lng: b.dropoffLng },
            pickupTime: b.createdAt,
            passengers: 1,
        }));

        const matcher = new MatchingService();
        const matches = matcher.matchRequests(requests);

        interface MatchResult {
            rideId: string;
            bookings: string[];
        }
        const results: MatchResult[] = [];

        // Note: In a real high-concurrency scenario, processing matches in a loop sequentially is safe for *this* instance,
        // but multiple server instances could race.
        // We use optimistic locking (checking count on update) inside transaction to handle this.

        for (const match of matches) {
            if (match.requests.length > 0) {
                try {
                    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                        // 1. Find a candidate vehicle
                        const vehicle = await tx.vehicle.findFirst({ where: { isAvailable: true } });

                        if (!vehicle) {
                            throw new Error('No available vehicle found for this match.');
                        }

                        // 2. Optimistic Lock: Update ONLY if still available
                        const updated = await tx.vehicle.updateMany({
                            where: { id: vehicle.id, isAvailable: true },
                            data: { isAvailable: false }
                        });

                        if (updated.count === 0) {
                            throw new Error('Vehicle was taken by another request.');
                        }

                        // 3. Create Ride
                        const ride = await tx.ride.create({
                            data: {
                                vehicleId: vehicle.id,
                                status: 'MATCHED',
                                totalDistance: match.totalDistance
                            }
                        });

                        // 4. Update Bookings
                        const bookingIds = match.requests.map((r) => r.id);
                        await tx.booking.updateMany({
                            where: { id: { in: bookingIds } },
                            data: {
                                status: 'CONFIRMED',
                                rideId: ride.id
                            }
                        });

                        results.push({ rideId: ride.id, bookings: bookingIds });
                    });
                } catch (err) {
                    console.warn(`Match failed due to concurrency or availability: ${err}`);
                    // Continue to next match
                }
            }
        }

        res.status(200).json({
            message: 'Matching completed',
            matchesFound: results.length,
            details: results
        });

    } catch (error) {
        console.error('Error in matching:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
