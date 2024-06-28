/* eslint-disable */
// Disable ESLint for this file to avoid linting errors

import axios from 'axios';
// Import axios for making HTTP requests

import { showAlert } from './alerts';
// Import a function to show alerts to the user

import { STRIPE_PUBLIC_KEY } from './env';
// Import the Stripe public key from environment variables

import { loadStripe } from '@stripe/stripe-js';
// Import loadStripe function from @stripe/stripe-js

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
// Load Stripe with your public key and assign it to stripePromise

export const bookTour = async tourId => {
  // Define an asynchronous function bookTour that takes tourId as a parameter from data set
  try {
    // Try to execute the following code

    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // Make a GET request to the API endpoint to get the checkout session for the given tourId
    // The response is stored in the session variable

    // 2) Create checkout form + charge credit card
    const stripe = await stripePromise;
    // Ensure Stripe is loaded before using it by waiting for the promise to resolve

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
    // Use Stripe's redirectToCheckout method to redirect the user to the Stripe checkout page
    // Pass the session ID obtained from the API response by axios
  } catch (err) {
    // If an error occurs in the try block, catch it here
    console.log(err);
    // Log the error to the console

    showAlert('error', err);
    // Show an alert to the user with the error message
  }
};

/**Purpose and Flow
Creating a Checkout Session: The server creates a checkout session and returns
its details (including the session ID) to the client.
Fetching the Session: The client requests the checkout session details using the tour ID.
Redirecting to Checkout: Once the session details are fetched and Stripe is loaded,
the client uses redirectToCheckout to navigate the user to the Stripe-hosted payment page. */
