const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const craftsFilePath = './crafts.json';

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/mydatabase');

// Craft schema
const craftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  supplies: {
    type: [String],
    required: true
  }
});

const Craft = mongoose.model('Craft', craftSchema);

// Read crafts data from MongoDB
async function getCraftsData() {
  try {
    return await Craft.find();
  } catch (error) {
    console.error('Error reading crafts data:', error);
    return [];
  }
}

// Write crafts data to MongoDB
async function saveCraftsData(crafts) {
  try {
    await Craft.insertMany(crafts);
    console.log('Crafts data saved successfully.');
  } catch (error) {
    console.error('Error saving crafts data:', error);
  }
}

// Serve the index.html file for the root directory
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Get all crafts
app.get('/crafts', async (req, res) => {
  const crafts = await getCraftsData();
  res.json(crafts);
});

// Add a new craft
app.post('/crafts', upload.single('image'), async (req, res) => {
  try {
    const { name, description, supplies } = req.body;
    const image = req.file ? req.file.path : '';
    const newCraft = { name, image, description, supplies };

    // Validate the new craft object
    const { error } = craftSchema.validate(newCraft);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Save the new craft to MongoDB
    const craft = new Craft(newCraft);
    await craft.save();

    res.status(201).json(newCraft);
  } catch (error) {
    console.error('Error adding craft:', error);
    res.status(500).send('Error adding craft');
  }
});

// Delete a craft
app.delete('/crafts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Remove craft from MongoDB
    await Craft.findByIdAndDelete(id);

    res.status(200).send('Craft deleted successfully');
  } catch (error) {
    console.error('Error deleting craft:', error);
    res.status(500).send('Error deleting craft');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
