import axios from 'axios';
import { prisma } from '../db';

const BASE_URL = 'http://127.0.0.1:3000/api';

async function runIntegrationTest() {
    console.log('Starting Integration Test...');

    try {
        // 1. Fetch created users (from seed)
        const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
        const bob = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });

        if (!alice || !bob) {
            throw new Error('Seed data missing. Run "npx ts-node prisma/seed.ts" first.');
        }

        console.log('Found users:', alice.id, bob.id);

        // 2. Create Booking for Alice (Central Bangalore to Airport)
        console.log('Creating booking for Alice...');
        const booking1 = await axios.post(`${BASE_URL}/bookings`, {
            userId: alice.id,
            pickup: { lat: 12.9716, lng: 77.5946 },
            dropoff: { lat: 13.1986, lng: 77.7066 },
            pickupTime: new Date().toISOString(),
            passengers: 1
        });
        console.log('Alice Booking Created:', booking1.data.bookingId, 'Price:', booking1.data.estimatedPrice);

        // 3. Create Booking for Bob (Nearby, same destination)
        console.log('Creating booking for Bob...');
        const booking2 = await axios.post(`${BASE_URL}/bookings`, {
            userId: bob.id,
            pickup: { lat: 12.9720, lng: 77.5950 }, // Close to Alice
            dropoff: { lat: 13.1990, lng: 77.7070 }, // Close to Alice's dropoff
            pickupTime: new Date().toISOString(),
            passengers: 1
        });
        console.log('Bob Booking Created:', booking2.data.bookingId);

        // 4. Trigger Matching
        console.log('Triggering Matching Engine...');
        const matchResponse = await axios.post(`${BASE_URL}/trigger-matching`);
        console.log('Match Response:', JSON.stringify(matchResponse.data, null, 2));

        if (matchResponse.data.matchesFound > 0) {
            console.log('✅ SUCCESS: Matches found and processed.');
        } else {
            console.error('❌ FAILURE: No matches found (Expected 1 match group).');
        }

    } catch (error: any) {
        console.error('Integration Test Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

runIntegrationTest();
