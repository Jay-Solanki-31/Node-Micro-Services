const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('Error connecting to MongoDB', error);
    }
};

module.exports = connectDB;