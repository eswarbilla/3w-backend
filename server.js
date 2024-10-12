// index.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import the Submission model
const Submission = require('./models/submissionModel'); // This line imports the model

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection using Mongoose
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Multer storage setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// API route to submit data and upload images
app.post('/api/submit', upload.array('images'), async (req, res) => {
  const { name, socialHandle } = req.body;
  const images = req.files.map((file) => `/uploads/${file.filename}`);

  try {
    const newSubmission = new Submission({ name, socialHandle, images }); // Using the Submission model
    await newSubmission.save();
    res.status(201).json({ message: 'Submission successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit data' });
  }
});

// API route to fetch all submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find(); // Using the Submission model
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
