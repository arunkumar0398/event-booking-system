const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  numberOfTickets: {
    type: Number,
    required: [true, 'Number of tickets is required'],
    min: [1, 'Must book at least 1 ticket'],
    max: [10, 'Cannot book more than 10 tickets at once']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['confirmed', 'cancelled'],
      message: 'Status must be either confirmed or cancelled'
    },
    default: 'confirmed'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ eventId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
