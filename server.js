const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import the Submission model
const Submission = require('./models/submissionModel');

const app = express();

// Middleware for security
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size to avoid 413 error
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting to prevent function invocation overload
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection using Mongoose
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if MongoDB is not reachable
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process if MongoDB is not connected
  });

// Multer storage setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB to avoid 413 error
});

// API route to submit data and upload images
app.post('/api/submit', upload.array('images'), async (req, res) => {
  const { name, socialHandle } = req.body;
  const images = req.files.map((file) => `/uploads/${file.filename}`);

  try {
    const newSubmission = new Submission({ name, socialHandle, images });
    await newSubmission.save();
    res.status(201).json({ message: 'Submission successful' });
  } catch (error) {
    console.error('Error saving submission:', error);
    res.status(500).json({ error: 'Failed to submit data' });
  }
});

// API route to fetch all submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find();
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle 404 errors for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start the server with a timeout configuration
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Set server timeout to prevent long-running requests
server.setTimeout(30000, () => {
  console.error('Server timeout: Request took too long');
});
