const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function (value) {
        return value > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [1, 'Total seats must be at least 1'],
    max: [100000, 'Total seats cannot exceed 100,000']
  },
  availableSeats: {
    type: Number,
    required: true,
    min: [0, 'Available seats cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Ticket price is required'],
    min: [0, 'Price cannot be negative']
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer ID is required']
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'cancelled'],
      message: 'Status must be either active or cancelled'
    },
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ organizerId: 1 });

// Virtual: check if sold out
eventSchema.virtual('isSoldOut').get(function () {
  return this.availableSeats === 0;
});

// Check seat availability
eventSchema.methods.hasAvailableSeats = function (requestedSeats) {
  return this.availableSeats >= requestedSeats;
};

module.exports = mongoose.model('Event', eventSchema);
