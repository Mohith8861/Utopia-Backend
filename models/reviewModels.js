const mongoose = require('mongoose');
const Tour = require('./tourModels');

const review = new mongoose.Schema(
  {
    title: { type: String },
    reviewText: { type: String },
    createdAt: { type: Date, default: Date.now },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      validator: function (value) {
        return value >= 0 && value <= 5;
      },
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Review = mongoose.model('Review', review);

module.exports = Review;
