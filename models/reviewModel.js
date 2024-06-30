const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review cannot be empty'],
    },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
    /*  user: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'review must belong to a user']
      }
    ],
    tour: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'review must belong to a tour']
      }
    ]
  } */
    /**
The schema initially had the user field as an array of references. 
When trieing to populate user data, it may not have worked correctly because of this structure.
With the array structure, the populated data might not have been in the expected format, 
or it might not have populated at all.

the Pug template attempted to access review.user.photo. If the user field was not populated correctly, 
review.user would be undefined, making review.user.photo also undefined.

When review.user.photo is undefined, the template generates an image tag like this:

<img class="reviews__avatar-img" src="/img/users/undefined" alt="undefined">
Server Handling

The server does not have a file at /img/users/undefined, so it responds with a 404 error.
 */
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to a tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ user: 1, tour: 1 }, { unique: true });
/** Adding an index to the reviewSchema with the combination of user and tour fields
 * ensures that each user can only write one review per tour. This is useful to prevent
 * duplicate reviews by the same user for the same tour.
 */
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

//Static methods are called on the model itself, not on individual instances of the model.
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //this refers to the model (not an instance), so within the static method,
  //this points to the Review model.
  const stats = await this.aggregate([
    //Filters the documents to only include reviews that belong to the specified tour (tourId).
    { $match: { tour: tourId } },
    {
      $group: {
        //Groups the reviews by the tour field. Since all reviews in this stage are for
        //the same tour (filtered by $match), they are all grouped together.
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].nRating,
      ratingsQuantity: stats[0].avgRating,
      // stats = [{_id:000000000,nRating:1,avgRating:1}]
      // stats[0] = {_id:000000000,nRating:2,avgRating:1}
      // stats[0].nRating = 2
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

/**Assuming the tour with the ID 12345 has three reviews with
 * ratings 4, 5, and 3, the aggregation result might look like this: 
 * [
  {
    _id: '12345',
    nRating: 3,
    avgRating: 4
  }
]*/
// instance methods are useful when you need to perform actions specific to a single document.
// However, they are not suitable for operations like calculating averages across many documents.

reviewSchema.post('save', function () {
  // this.constructor refers to the model that corresponds
  // to the document being saved (in this case, the Review model).
  this.constructor.calcAverageRatings(this.tour);
  /**Inside the middleware function, this.constructor refers to
   *  the model associated with the document being saved (i.e., Review).
   * It's used to call the calcAverageRatings method on the model. */
});

// Executes before a 'findOneAnd...' query is executed (e.g., findOneAndUpdate, findOneAndDelete, etc.).
// 'this' refers to the query middleware context.
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Stores the document found by the query in the 'r' property of the query middleware context.
  // This is done to access the document in the subsequent middleware.
  // this refers to the query middleware context.
  this.r = await this.findOne();
  // When findOne() is called without any parameters, it fetches the first document that
  // matches the criteria defined by the query it's attached to. This criteria might be
  // set earlier in the code or implicitly based on the context in which the middleware is used.
  // this.findOne() doesn't work with post middleware because query has been already excuted.
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  /*   Calls the 'calcAverageRatings' static method on the constructor of the document stored in 'r'.
  This updates the average ratings for the tour associated with the review being modified.
  this.r refers to the document returned by the findOne() method in the pre-middleware.
  not the query middleware context. */
  await this.r.constructor.calcAverageRatings(this.r.tour);
  /**if you were to use await constructor.calcAverageRatings(this.r.tour);
   * JavaScript would attempt to find constructor as a standalone variable within the current scope,
   * which is unlikely to exist. By using this.r.constructor, you explicitly refer to the constructor
   * property of the document, which is guaranteed to exist and refers to the model
   * associated with the document. */
});
/**this.r is a custom property (r) attached to the this context, which 
 * represents the current query middleware context. Within Mongoose middleware functions, 
 * you can attach custom properties to the this context to pass data between middleware 
 * functions or to access data in subsequent middleware.

In this specific case, this.r is used to store the document retrieved by the findOne() method.
Storing this document in this.r allows the subsequent post-middleware function to access it. 
This is necessary because the post-middleware function executes after the findOneAnd... query 
has completed, and we need access to the document that was found by that query in order to 
perform further actions, such as updating average ratings.

So, this.r serves as a way to pass the document retrieved by the query from the pre-middleware 
function to the post-middleware function within the same middleware execution context. 
It's a convenient way to share data between middleware functions in Mongoose. */

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
