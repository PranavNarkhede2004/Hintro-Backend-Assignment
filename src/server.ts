import app from './app';
import { prisma } from './db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Connected to Database');

        app.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
