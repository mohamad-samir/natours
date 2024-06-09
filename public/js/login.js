/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
// Importing axios for making HTTP requests and showAlert for displaying messages to the user.

export const login = async (email, password) => {
  try {
    // Start a try block to handle potential errors in the login process.
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    });
    // Sending a POST request to the login endpoint with email and password as payload.

    if (res.data.status === 'success') {
      // Check if the response status is 'success'.
      showAlert('success', 'Logged in successfully!');
      // Show a success alert to the user.

      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
      // Redirect to the homepage after 1.5 seconds.
    }
  } catch (err) {
    // Catch any errors that occur during the login process.
    showAlert('error', err.response.data.message);
    // Show an error alert with the message from the server's response.
  }
};

export const logout = async () => {
  try {
    // Start a try block to handle potential errors in the logout process.
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout'
    });
    // Sending a GET request to the logout endpoint.

    if (res.data.status === 'success') location.reload(true);
    // If the response status is 'success', reload the page to update the UI.
  } catch (err) {
    // Catch any errors that occur during the logout process.
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
    // Show an error alert indicating that the logout failed.
  }
};

// Explanation:
// Client-Side Function (login):
// - Collects user input (email and password).
// - Sends a POST request to the server with the user input.
// - Handles the server response, displaying success or error messages and redirecting as needed.

// Server-Side Function (login):
// - The server receives the email and password, validates the credentials,
//   and responds with a status, token, and user data.
// - If the credentials are valid, it sends back a success status and an authentication token.
