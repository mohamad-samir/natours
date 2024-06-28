/* eslint-disable */

import '@babel/polyfill';
// Import polyfills from Babel to ensure compatibility with older browsers that
// do not support modern JavaScript features.

import { displayMap } from './mapbox';
// Import the displayMap function from the mapbox module. This function is
// likely used to render a map on the webpage.

import { login, logout } from './login';
// Import login and logout functions from the login module.
// These functions handle user authentication.

import { updateSettings } from './updateSettings';
// Import updateSettings function from the updateSettings module.
// This function updates user settings like name, email, or password.

import { bookTour } from './stripe';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
// Select the HTML element with the id 'map'. This is where the map will be rendered.

const loginForm = document.querySelector('.form--login');
// Select the HTML element with the class 'form--login'. This form is used for user login.
// Note: The original Pug file used ".login-form" instead of ".login-form.form--login" which caused an error
// Ensure that the correct class name is used in the Pug file and here to avoid selection errors.

const logOutBtn = document.querySelector('.nav__el--logout');
// Select the HTML element with the class 'nav__el--logout'. This button is used to log out the user.

const userDataForm = document.querySelector('.form-user-data');
// Select the HTML element with the class 'form-user-data'.
// This form is used to update user data like name and email.

const userPasswordForm = document.querySelector('.form-user-password');
// Select the HTML element with the class 'form-user-password'.
// This form is used to update the user's password.

const bookBtn = document.getElementById('book-tour');

// DELEGATION

if (mapBox) {
  // Check if the mapBox element exists on the page.
  const locations = JSON.parse(mapBox.dataset.locations);
  // Parse the locations data from the data-locations attribute of the mapBox element.
  // The location data is expected to be in JSON format,
  // so the JSON.parse() function is used to convert it into a JavaScript object
  displayMap(locations);
  // Call the displayMap function with the parsed locations to render the map.
}

if (loginForm) {
  // Check if the loginForm element exists on the page.
  loginForm.addEventListener('submit', e => {
    // Add an event listener to handle the form submission.
    e.preventDefault();
    // Prevent the default form submission behavior to handle it via JavaScript.
    const email = document.getElementById('email').value;
    // Get the value of the email input field.
    const password = document.getElementById('password').value;
    // Get the value of the password input field.
    login(email, password);
    // Call the login function with the email and password.
  });
}

if (logOutBtn) {
  // Check if the logOutBtn element exists on the page.
  logOutBtn.addEventListener('click', logout);
  // Add an event listener to handle the click event and call the logout function.
}

// Check if userDataForm exists (is not null or undefined)
if (userDataForm) {
  // Add an event listener to the form for the 'submit' event
  userDataForm.addEventListener('submit', e => {
    // Prevent the default form submission behavior
    e.preventDefault();

    // Create a new FormData object to hold the form data
    const form = new FormData();

    // Append the 'name' field value to the FormData object
    form.append('name', document.getElementById('name').value);

    // Append the 'email' field value to the FormData object
    form.append('email', document.getElementById('email').value);

    // Append the 'photo' file input (as a file list) to the FormData object
    // By using [0], you are accessing the first selected file in the list.
    form.append('photo', document.getElementById('photo').files[0]);

    // Uncomment these lines if you want to use plain object instead of FormData
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // updateSettings({ name, email }, 'data');

    // Call the updateSettings function, passing the FormData object and the 'data' string
    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  // Check if the userPasswordForm element exists on the page.
  userPasswordForm.addEventListener('submit', async e => {
    // Add an event listener to handle the form submission.
    e.preventDefault();
    // Prevent the default form submission behavior to handle it via JavaScript.
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    // Change the button text to 'Updating...' to indicate that the update is in progress.

    const passwordCurrent = document.getElementById('password-current').value;
    // Get the value of the current password input field.
    const password = document.getElementById('password').value;
    // Get the value of the new password input field.
    const passwordConfirm = document.getElementById('password-confirm').value;
    // Get the value of the confirm password input field.

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    // Call the updateSettings function with the current password, new password,
    // and confirm password, specifying the type of update as 'password'.

    document.querySelector('.btn--save-password').textContent = 'Save password';
    // Change the button text back to 'Save password' after the update is complete.

    document.getElementById('password-current').value = '';
    // Clear the current password input field.
    document.getElementById('password').value = '';
    // Clear the new password input field.
    document.getElementById('password-confirm').value = '';
    // Clear the confirm password input field.
  });
}

if (bookBtn)
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...';
    //data-tour-id from e.target.dataset will be converted to tourId in js
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

// const alertMessage = document.querySelector('body').dataset.alert;
// if (alertMessage) showAlert('success', alertMessage, 20);
