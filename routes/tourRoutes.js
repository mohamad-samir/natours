const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

// Nested routes for reviews
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

/* // Define a POST route for creating a review on a specific tour
router
  .route('/:tourId/reviews') // Define the route with a dynamic parameter 'tourId' and append 'reviews'
  .post(
    authController.protect, // Middleware to protect the route (only authenticated users can access)
    authController.restrictTo('user'), // Middleware to restrict access (only 'user' role can access)
    reviewController.createReview // Controller function to handle the review creation
  );
 */

module.exports = router;
