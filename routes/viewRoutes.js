const express = require('express');
const viewsController = require('../controllers/viewsController');
// Create a new router
const router = express.Router();

// Define a GET route to render the 'overview' template at the URL '/overview'
router.get('/', viewsController.getOverview);

// Define a GET route to render the 'tour' template at the URL '/tour'
router.get('/tour/:slug', viewsController.getTour);

// Export the router to be used elsewhere in the application
module.exports = router;
