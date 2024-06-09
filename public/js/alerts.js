/* eslint-disable */

// Function to hide an alert
export const hideAlert = () => {
  // Select the first element with the class '.alert'
  const el = document.querySelector('.alert');

  // Check if such an element exists
  if (el) {
    // If an element is found, remove it from its parent
    el.parentElement.removeChild(el);
  }
};

// Function to show an alert
export const showAlert = (type, msg) => {
  // Ensure any existing alert is hidden before showing a new one
  hideAlert();

  // Construct HTML markup for the alert using a template string
  // type .alert--success #20bf6b or .alert--error #eb4d4b
  const markup = `<div class="alert alert--${type}">${msg}</div>`;

  // Insert the constructed markup at the beginning of the <body> element
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  // Set a timeout to hide the alert after 5 seconds (5000 milliseconds)
  window.setTimeout(hideAlert, 5000);
};
