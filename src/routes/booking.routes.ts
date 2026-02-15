import { Router } from 'express';
import { createBooking, triggerMatching } from '../controllers/booking.controller';

const router = Router();

router.post('/bookings', createBooking);
router.post('/trigger-matching', triggerMatching);

export default router;
