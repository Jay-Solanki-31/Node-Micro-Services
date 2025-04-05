const express = require('express');
const multer = require('multer');
const { uploadMedia } = require('../controller/media-controller'); 
const { authenticatedRequest } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const router = express.Router();


// configure multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits : {
        fileSize : 5 * 1024 * 1024
    }
}).single('file'); 


router.post('/upload', authenticatedRequest, (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            logger.error('error occurred in multer while uploading file', err);
            return res.status(400).json({
                success: false,
                message: err.message,
                stack: err.stack
            });  
        }else if (err) {
            logger.error('Known error occurred in multer while uploading file', err);
            return res.status(500).json({
                success: false,
                message: 'Known error occurred in multer while uploading file',
                stack: err.stack
            });  
        }
        if (!req.file) {
            logger.error('No file uploaded , Please upload a file');
            return res.status(400).json({ success: false, message: 'No file uploaded , Please upload a file' });
        }
        next();
    })
}, uploadMedia);


module.exports = router