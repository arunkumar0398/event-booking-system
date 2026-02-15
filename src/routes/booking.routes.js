const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getEventBookings,
  cancelBooking
} = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('customer'), createBooking);
router.get('/my', protect, authorize('customer'), getMyBookings);
router.get('/event/:eventId', protect, authorize('organizer'), getEventBookings);
router.patch('/:id/cancel', protect, authorize('customer'), cancelBooking);

module.exports = router;
