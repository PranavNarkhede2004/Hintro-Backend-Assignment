import axios from 'axios';
import { prisma } from '../db';

const BASE_URL = 'http://127.0.0.1:3000/api';
const CONCURRENT_REQUESTS = 50;

async function runLoadTest() {
    console.log(`Starting Load Test with ${CONCURRENT_REQUESTS} concurrent requests...`);

    // 1. Setup: Ensure we have enough users or reuse seed users
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('No users found. Run seed script.');
        return;
    }

    // 2. Fire generic booking requests
    const promises = [];
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        const p = axios.post(`${BASE_URL}/bookings`, {
            userId: user.id,
            pickup: { lat: 12.9716 + (Math.random() * 0.01), lng: 77.5946 + (Math.random() * 0.01) },
            dropoff: { lat: 13.1986, lng: 77.7066 },
            pickupTime: new Date().toISOString(),
            passengers: 1
        }).then(res => ({ status: 'fulfilled', data: res.data }))
            .catch(err => ({ status: 'rejected', error: err.message }));

        promises.push(p);
    }

    console.log('Sending requests...');
    const results = await Promise.all(promises);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    console.log(`Load Test Completed.`);
    console.log(`✅ Successful Bookings: ${successCount}`);
    console.log(`❌ Failed Bookings: ${failCount}`);

    // 3. Trigger Matching
    try {
        console.log('Triggering matching...');
        const matchRes = await axios.post(`${BASE_URL}/trigger-matching`);
        console.log('Matching Results:', matchRes.data);
    } catch (err: any) {
        console.error('Matching trigger failed:', err.message);
    }
}

runLoadTest();
