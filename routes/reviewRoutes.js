const express = require('express');

const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// Create a new router instance and merge parameters from parent routes
const router = express.Router({ mergeParams: true });

/*
The line const router = express.Router({ mergeParams: true }); in reviewRoutes.js file 
is important because it ensures that the tourId parameter from the parent route is available 
in the nested routes. 
This setup is necessary for accessing the tourId parameter in the review routes.
*/

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
