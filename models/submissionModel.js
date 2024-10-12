const mongoose = require('mongoose');

// Define the submission schema
const submissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  socialHandle: {
    type: String,
    required: true,
  },
  images: {
    type: [String], // Array of image URLs
    required: true,
  },
}, { timestamps: true }); // Automatically manage createdAt and updatedAt fields

// Create the Submission model based on the schema
const Submission = mongoose.model('Submission', submissionSchema);

// Export the model for use in other parts of the application
module.exports = Submission;
