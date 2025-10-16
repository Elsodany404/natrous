import mongoose from 'mongoose';
import slugify from 'slugify';
// import User from './userModel.js';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have name'],
      maxlength: [40, 'Name must be at most 40 character'],
      minlength: [10, 'Name must be at least 10 character']
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be at least 1 star'],
      max: [5, 'rating must be at most 5 stars']
    },
    ratingsQuantity: Number,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration']
    },
    maxGroupSize: {
      type: Number,
      default: 5
    },
    difficulty: {
      type: String,
      trim: true,
      default: 'medium',
      enum: {
        message: 'difficulty must be easy, medium and difficult',
        values: ['easy', 'medium', 'difficult']
      }
    },
    slug: String,
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have description']
    },
    summary: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have cover photo']
    },
    images: [String],
    createdAt: {
      type: Date,
      select: false,
      default: Date.now()
    },
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        discription: String,
        day: Number
      }
    ],
    startDates: [Date],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
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
tourSchema.index({
  price: 1,
  ratingAverage: -1
});
tourSchema.index({
  startLocation: '2dsphere'
});
tourSchema.virtual('durationInWeeks').get(function () {
  return this.duration / 7;
});
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true
  });
  next();
});
// appling embedding guides
// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(
//         async (id) => await User.findById(id)
//     );
//     this.guides = await Promise.all(guidesPromises);
// });
tourSchema.pre(/^find/, function (next) {
  this.populate('guides');
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: {
      $ne: true
    }
  });
  next();
});
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });
const Tour = mongoose.model('Tour', tourSchema);
export default Tour;
