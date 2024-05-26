const mongoose = require('mongoose');
const slugify = require('slugify');
//const { promises } = require('nodemailer/lib/xoauth2');
//const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 //or set: val => Number(val.toFixed(1))
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: { type: String, default: 'Point', enum: ['Point'] },
      coordinates: [Number],
      adress: String,
      description: String
    },
    locations: [
      {
        //GeoJSON
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        adress: String,
        description: String,
        day: Number
      }
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// Create a 2dsphere index on the startLocation field
tourSchema.index({ startLocation: '2dsphere' });
/**This line creates a 2dsphere index on the startLocation field 
 * in the Mongoose schema. This index enables MongoDB to perform 
 * geospatial queries like finding documents within a certain distance from a point.

 */

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// Define a virtual field 'reviews' in the Tour schema
tourSchema.virtual('reviews', {
  ref: 'Review', // Reference the 'Review' model
  foreignField: 'tour', // The field in the 'Review' model that refers to the 'Tour' model
  localField: '_id' // The field in the 'Tour' model that the 'Review' model's 'tour' field refers to
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

/* // Define the pre-save middleware for the tourSchema
tourSchema.pre('save', async function(next) {
  // Map over the guides array, which contains user IDs, and create an array of promises.
  // Each promise resolves to a User document found by its ID.
  const guidesPromises = this.guides.map(async id => await User.findById(id));

  // Wait for all the promises to resolve. Once resolved, the guidesPromises array
  // will contain the full User documents instead of just their IDs.
  this.guides = await Promise.all(guidesPromises);

  // Call next() to proceed with the save operation. This signals Mongoose to
  // move to the next middleware (if any) or to complete the save operation.
  next();
});
 */
// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// Pre-query middleware for the 'Tour' schema
tourSchema.pre(/^find/, function(next) {
  // 'this' points to the current query being executed

  // Populate the 'guides' field in the query result with full User documents
  // Select only the necessary fields: exclude '__v' and 'passwordChangedAt'
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  // Check if the first stage is $geoNear
  if (this.pipeline()[0] && this.pipeline()[0].$geoNear) {
    return next();
  }

  // If the first stage is not $geoNear, add the $match stage
  // to filter out secret tours from the aggregation.
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

/**The reason aggregation pipeline was failing with the $geoNear error is
 * because the middleware is adding a $match stage at the beginning of every aggregation,
 * which means $geoNear is no longer the first stage.
 * To fix this while still applying the $match stage in other cases, modify
 * aggregation middleware to check if the first stage is $geoNear and only add the $match
 * stage if it is not. */

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
