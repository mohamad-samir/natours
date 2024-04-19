const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour must have less than or equal 40 characters'],
      minLength: [10, 'A tour must have more than or equal 10 characters']
      // validate: [validator.isAlpha, 'tour name must be in characters']
    },
    slug: String,
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a diffculity'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: "must be 'easy', 'medium' or 'difficult'"
      }
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be more than or equal 1'],
      max: [5, 'rating must be less than or equal 5']
    },
    ratingsQuantity: { type: Number, default: 0 },

    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          //this works only with new doc cereation not update
          return val < this.price;
        },
        message: 'Discount must be less than the price'
      }
    },
    summary: { type: String, trim: true },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image']
    },
    images: [String],
    cereatedAt: { type: Date, default: Date.now() },
    startDates: [Date],
    secretTour: { type: Boolean, default: false }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//Docoment middleware runs before .save() and .cereate()
// tourSchema.pre('save', function(next) {
//   this.slug = slugify(this.name, { lower: true });
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//Query middleware
//all commands starts with find including find one
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} ms`);
  console.log(docs);
  next();
});

//Aggregation middleware
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
