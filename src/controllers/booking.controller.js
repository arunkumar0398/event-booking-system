const Booking = require('../models/Booking');
const Event = require('../models/Event');
const jobQueue = require('../jobs/queue');
const mongoose = require('mongoose');

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private (Customer only)
exports.createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId, numberOfTickets } = req.body;
    const customerId = req.user._id;

    if (!eventId || !numberOfTickets) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId and numberOfTickets'
      });
    }

    // Find event within transaction
    const event = await Event.findById(eventId).session(session);

    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'active') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Event is not active'
      });
    }

    if (new Date(event.date) < new Date()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot book tickets for past events'
      });
    }

    if (event.availableSeats < numberOfTickets) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Only ${event.availableSeats} seats available`
      });
    }

    const totalAmount = event.price * numberOfTickets;

    // Create booking
    const booking = await Booking.create([{
      eventId,
      customerId,
      numberOfTickets,
      totalAmount,
      status: 'confirmed'
    }], { session });

    // Atomic seat decrement
    await Event.findByIdAndUpdate(
      eventId,
      { $inc: { availableSeats: -numberOfTickets } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Populate booking details
    const populatedBooking = await Booking.findById(booking[0]._id)
      .populate('eventId', 'title date location')
      .populate('customerId', 'name email');

    // Queue booking confirmation job (outside transaction)
    jobQueue.add('booking-confirmation', {
      bookingId: populatedBooking._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      eventTitle: event.title,
      numberOfTickets,
      totalAmount,
      bookingDate: populatedBooking.bookingDate
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get customer's bookings
// @route   GET /api/bookings/my
// @access  Private (Customer only)
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customerId: req.user._id })
      .populate('eventId', 'title date location price status')
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for an event
// @route   GET /api/bookings/event/:eventId
// @access  Private (Organizer only)
exports.getEventBookings = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings for this event'
      });
    }

    const bookings = await Booking.find({ eventId })
      .populate('customerId', 'name email')
      .sort({ bookingDate: -1 });

    // Calculate statistics
    const stats = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalTicketsSold: bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + b.numberOfTickets, 0),
      totalRevenue: bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + b.totalAmount, 0)
    };

    res.status(200).json({
      success: true,
      count: bookings.length,
      stats,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (Customer only - own bookings)
exports.cancelBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.customerId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save({ session });

    // Restore available seats
    await Event.findByIdAndUpdate(
      booking.eventId,
      { $inc: { availableSeats: booking.numberOfTickets } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
