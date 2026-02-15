import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding database...');

    // Create Users
    const user1 = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            name: 'Alice Johnson',
            email: 'alice@example.com',
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: {
            name: 'Bob Smith',
            email: 'bob@example.com',
        },
    });

    const user3 = await prisma.user.upsert({
        where: { email: 'charlie@example.com' },
        update: {},
        create: {
            name: 'Charlie Brown',
            email: 'charlie@example.com',
        },
    });

    console.log('Created Users:', { user1, user2, user3 });

    // Create Vehicles
    // Vehicle 1: Central Bangalore
    const vehicle1 = await prisma.vehicle.create({
        data: {
            capacity: 3,
            currentLat: 12.9716,
            currentLng: 77.5946,
            isAvailable: true,
        }
    });

    // Vehicle 2: Airport
    const vehicle2 = await prisma.vehicle.create({
        data: {
            capacity: 3,
            currentLat: 13.1986,
            currentLng: 77.7066,
            isAvailable: true,
        }
    });

    console.log('Created Vehicles:', { vehicle1, vehicle2 });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
