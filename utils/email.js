const nodemailer = require('nodemailer'); // Importing nodemailer to handle email sending
const pug = require('pug'); // Importing pug to render HTML templates
const htmlToText = require('html-to-text'); // Importing html-to-text to convert HTML to plain text

// Exporting the Email class
module.exports = class Email {
  // Constructor to initialize email attributes
  constructor(user, url) {
    this.to = user.email; // Email recipient
    this.firstName = user.name.split(' ')[0]; // Extracting the first name from the full name
    this.url = url; // URL to be included in the email (e.g., for verification or reset password)
    this.from = `mohamed samir <${process.env.EMAIL_FROM}>`; // Sender email address
  }

  // Method to handle email transport configurations based on the environment
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // If in production, use MailGun
      return nodemailer.createTransport({
        host: process.env.MAILGUN_SMTP_SERVER,
        port: process.env.MAILGUN_SMTP_PORT,
        auth: {
          user: process.env.MAILGUN_USERNAME, // Full email address
          pass: process.env.MAILGUN_PASSWORD // Mailgun SMTP password
        }
      });
    }

    // If not in production, use a development email service
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // Email host from environment variables
      port: process.env.EMAIL_PORT, // Email port from environment variables
      auth: {
        user: process.env.EMAIL_USERNAME, // Email username from environment variables
        pass: process.env.EMAIL_PASSWORD // Email password from environment variables
      }
    });
  }
  //Once you have created the transport object, you can use its methods, such as sendMail(),
  //to send emails through the configured email service or SMTP server.

  // Method to send an actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template (e.g., 'welcome' or 'passwordReset')
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName, // Passing the first name to the pug template
      url: this.url, // Passing the URL to the pug template
      subject // Passing the email subject to the pug template
    });
    /* { firstName: this.firstName, url: this.url, subject }: This is an object that contains the data that will be 
        passed to the Pug template. In this case, you are passing the firstName, url, and subject variables to the template. 
        These variables will be available for use within the template.

        For example, if you have a Pug template file named "welcome.pug" in the "views/email" directory, 
        and you call pug.renderFile with template set to "welcome", Pug will render the "welcome.pug" template 
        and replace any placeholders (such as #firstName#) with the corresponding values from the data object.

        So, this line of code is essentially rendering an HTML email template by passing the necessary data (first name, URL, and subject) 
        to the Pug template engine, and storing the generated HTML in the html variable. 
*/
    // 2) Define email options
    const mailOptions = {
      from: this.from, // Sender address
      to: this.to, // Recipient address
      subject, // Subject line
      html, // HTML body content
      text: htmlToText.fromString(html) // Plain text body content converted from HTML
    };

    // 3) Create a transport and send email
    //The sendMail function of the nodemailer library is asynchronous.
    await this.newTransport().sendMail(mailOptions); // Creates a transport and sends the email using the specified options
    //creates a transport object, waits for it to be resolved, and then sends an email using the specified options.
    //the sendMail method is called on the transporter object, passing the mailOptions object as the first argument.
    //The second argument is a callback function that handles the success or failure of sending the email.
  }

  // Method to send a welcome email
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
    // Using the send method to send a welcome email with a specific template and subject
  }

  // Method to send a password reset email
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
      // Using the send method to send a password reset email with a specific template and subject
    );
  }
};
