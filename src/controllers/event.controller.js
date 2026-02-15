const Event = require('../models/Event');
const Booking = require('../models/Booking');
const jobQueue = require('../jobs/queue');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getAllEvents = async (req, res, next) => {
  try {
    const { status, date, search } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (date) {
      filter.date = { $gte: new Date(date) };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(filter)
      .populate('organizerId', 'name email')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Organizer only)
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, date, location, totalSeats, price } = req.body;

    if (!title || !description || !date || !location || !totalSeats || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      totalSeats,
      availableSeats: totalSeats,
      price,
      organizerId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Organizer only - own events)
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the organizer of this event
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    // Track which fields are being updated
    const updatedFields = Object.keys(req.body).filter(
      key => String(req.body[key]) !== String(event[key])
    );

    // Prevent updating protected fields
    delete req.body.organizerId;
    delete req.body.totalSeats;
    delete req.body.availableSeats;

    event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // If event has bookings, notify customers about changes
    if (updatedFields.length > 0) {
      const bookings = await Booking.find({
        eventId: event._id,
        status: 'confirmed'
      }).populate('customerId', 'name email');

      if (bookings.length > 0) {
        const customers = bookings.map(booking => ({
          name: booking.customerId.name,
          email: booking.customerId.email
        }));

        jobQueue.add('event-update-notification', {
          eventId: event._id,
          eventTitle: event.title,
          updatedFields,
          customers
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer only - own events)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    // Check for active bookings
    const bookingsCount = await Booking.countDocuments({
      eventId: event._id,
      status: 'confirmed'
    });

    if (bookingsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete event with ${bookingsCount} active booking(s). Cancel the event instead.`
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
