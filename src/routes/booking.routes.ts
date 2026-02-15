import { Router } from 'express';
import { createBooking, triggerMatching, getBookingStatus } from '../controllers/booking.controller';

const router = Router();

router.post('/bookings', createBooking);
router.get('/bookings/:id', getBookingStatus);
router.post('/trigger-matching', triggerMatching);

export default router;
