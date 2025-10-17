import mongoose from 'mongoose';
import Tour from './tourModel.js';

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      required: [true, 'review Cant be empty']
    },
    rating: {
      type: Number,
      min: [1, 'rating must be at least 1 star'],
      max: [5, 'rating must be at most 5 stars'],
      set: (val) => Math.round(val * 10) / 10
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to user']
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to tour']
    }
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);
reviewSchema.post('save', async function () {
  await this.constructor.calcRatingOnReviews(this.tour);
});
reviewSchema.statics.calcRatingOnReviews = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId
      } // give me all review of certain tour
    },
    {
      $group: {
        _id: '$tour',
        countReviews: {
          $sum: 1
        },
        countAverage: {
          $avg: '$rating'
        }
      }
    }
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingAverage: stats[0].countAverage,
      ratingQuantity: stats[0].countReviews
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingAverage: 4.5,
      ratingQuantity: 0
    });
  }
};

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcRatingOnReviews(this.r.tour);
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
