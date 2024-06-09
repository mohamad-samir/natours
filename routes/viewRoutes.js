const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

// Create a new router
const router = express.Router();

// Define a GET route to render the 'overview' template at the URL '/overview'
router.get('/', authController.isLoggedIn, viewsController.getOverview);

// Define a GET route to render the 'tour' template at the URL '/tour'
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

router.get('/me', authController.protect, viewsController.getAccount);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

// Export the router to be used elsewhere in the application
module.exports = router;
