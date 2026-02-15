import { MatchingService, RideRequest } from '../algorithm/matching';

const runTests = () => {
    console.log('Running Matching Algorithm Tests...\n');

    const matcher = new MatchingService();

    // Test Case 1: Simple matching of 2 close requests
    console.log('Test 1: Matching 2 close requests');
    const req1: RideRequest = {
        id: '1',
        userId: 'u1',
        pickup: { lat: 12.9716, lng: 77.5946 }, // Bangalore Center
        dropoff: { lat: 12.2958, lng: 76.6394 }, // Mysore
        pickupTime: new Date('2023-10-27T10:00:00Z'),
        passengers: 1,
    };

    const req2: RideRequest = {
        id: '2',
        userId: 'u2',
        pickup: { lat: 12.9720, lng: 77.5950 }, // Very close to u1
        dropoff: { lat: 12.2960, lng: 76.6400 }, // Very close to u1 dropoff
        pickupTime: new Date('2023-10-27T10:05:00Z'),
        passengers: 1,
    };

    const matches1 = matcher.matchRequests([req1, req2]);
    if (matches1.length === 1 && matches1[0].requests.length === 2) {
        console.log('✅ PASS: Requests matched together');
    } else {
        console.error('❌ FAIL: Expected 1 group with 2 requests, got:', matches1.length, 'groups');
    }

    // Test Case 2: Far apart requests (should not match)
    console.log('\nTest 2: Requests too far apart');
    const req3: RideRequest = {
        id: '3',
        userId: 'u3',
        pickup: { lat: 13.0, lng: 77.0 }, // Far away
        dropoff: { lat: 12.0, lng: 76.0 },
        pickupTime: new Date('2023-10-27T10:00:00Z'),
        passengers: 1,
    };

    const matches2 = matcher.matchRequests([req1, req3]);
    if (matches2.length === 2) {
        console.log('✅ PASS: Requests correctly kept separate');
    } else {
        console.error('❌ FAIL: Expected 2 separate groups, got:', matches2.length);
    }

    // Test Case 3: Capacity constraint
    console.log('\nTest 3: Capacity overflow (Max 3)');
    const req4: RideRequest = { ...req1, id: '4', passengers: 2 };
    const req5: RideRequest = { ...req2, id: '5', passengers: 2 }; // Total 4 passengers

    const matches3 = matcher.matchRequests([req4, req5]);
    if (matches3.length === 2) {
        console.log('✅ PASS: Requests separated due to capacity');
    } else {
        console.error('❌ FAIL: Expected separation due to capacity, got merged group');
    }

    console.log('\nTests Completed.');
};

runTests();
