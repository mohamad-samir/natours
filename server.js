// To resolve this issue, you need to remove useCreateIndex and useFindAndModify from your MongoDB
// connection options. These options are now unnecessary because MongoDB Node.js driver versions
// starting from 3.6 onward have default behaviors that align with the best practices for indexing and modification.

// The warnings you are seeing indicate that the useNewUrlParser and useUnifiedTopology options in your MongoDB connection setup
// are deprecated and will be removed in future major versions of the MongoDB Node.js driver (version 4.0.0 and onwards).

// As MongoDB Node.js driver versions progress to 4.0.0 and beyond, you should plan to remove useNewUrlParser
// and useUnifiedTopology from your mongoose.connect() options. The current setup is still compatible,
// but future versions will no longer support these options.

const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    //useCreateIndex: true,
    //useFindAndModify: false,
    useNewUrlParser: true
    //useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'))
  .catch(err => console.log('DB connection error:', err));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
