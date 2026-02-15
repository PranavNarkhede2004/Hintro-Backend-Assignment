import { prisma } from './src/db';
import * as fs from 'fs';

async function main() {
    try {
        const users = await prisma.user.findMany();
        fs.writeFileSync('valid_users.txt', JSON.stringify(users, null, 2));
        console.log('Users exported to valid_users.txt');
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
