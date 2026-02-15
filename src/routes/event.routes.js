const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/event.controller');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getAllEvents)
  .post(protect, authorize('organizer'), createEvent);

router.route('/:id')
  .get(getEvent)
  .put(protect, authorize('organizer'), updateEvent)
  .delete(protect, authorize('organizer'), deleteEvent);

module.exports = router;
