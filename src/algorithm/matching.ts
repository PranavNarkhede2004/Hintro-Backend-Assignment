import { helperCalculateDistance } from '../utils/distance';

export interface RideRequest {
    id: string;
    userId: string;
    pickup: { lat: number; lng: number };
    dropoff: { lat: number; lng: number };
    pickupTime: Date;
    passengers: number;
}

export interface MatchedGroup {
    requests: RideRequest[];
    totalDistance: number;
}

export class MatchingService {
    private static MAX_DETOUR_KM = 2.0; // Max detour allowed in km
    private static MAX_WAIT_TIME_MIN = 15; // Max wait time in minutes
    private static VEHICLE_CAPACITY = 3;

    /**
     * Matches pending ride requests into shared rides.
     * Simple Greedy approach:
     * 1. Sort requests by pickup time.
     * 2. Iterate and try to group with existing pending groups or create new ones.
     */
    public matchRequests(pendingRequests: RideRequest[]): MatchedGroup[] {
        const groups: MatchedGroup[] = [];

        // Sort by pickup time to prioritize earlier requests
        const sortedRequests = [...pendingRequests].sort(
            (a, b) => a.pickupTime.getTime() - b.pickupTime.getTime()
        );

        for (const req of sortedRequests) {
            let addedToGroup = false;

            // Try to fit into an existing group
            for (const group of groups) {
                if (this.canAddToGroup(group, req)) {
                    group.requests.push(req);
                    // Recalculate group metrics if needed (e.g., total distance)
                    addedToGroup = true;
                    break;
                }
            }

            // If not added, start a new group
            if (!addedToGroup) {
                groups.push({
                    requests: [req],
                    totalDistance: helperCalculateDistance(
                        req.pickup.lat,
                        req.pickup.lng,
                        req.dropoff.lat,
                        req.dropoff.lng
                    ),
                });
            }
        }

        return groups;
    }

    private canAddToGroup(group: MatchedGroup, req: RideRequest): boolean {
        // 1. Capacity check
        const currentPassengers = group.requests.reduce((sum, r) => sum + r.passengers, 0);
        if (currentPassengers + req.passengers > MatchingService.VEHICLE_CAPACITY) {
            return false;
        }

        // 2. Time window check (simplified)
        // Ensure the new request's pickup time is within reasonable range of the group's first pickup
        const firstPickup = group.requests[0].pickupTime.getTime();
        const reqPickup = req.pickupTime.getTime();
        if (Math.abs(reqPickup - firstPickup) > MatchingService.MAX_WAIT_TIME_MIN * 60 * 1000) {
            return false;
        }

        // 3. Detour / Direction check
        // Check strict proximity to ANY existing request in the group for pickup AND dropoff

        const isClosePickup = group.requests.some(
            (r) => helperCalculateDistance(r.pickup.lat, r.pickup.lng, req.pickup.lat, req.pickup.lng) < 3.0 // 3km radius for pickup
        );

        const isCloseDropoff = group.requests.some(
            (r) => helperCalculateDistance(r.dropoff.lat, r.dropoff.lng, req.dropoff.lat, req.dropoff.lng) < 5.0 // 5km radius for dropoff
        );

        if (!isClosePickup || !isCloseDropoff) return false;

        return true;
    }
}
