  
const { uploadMediaToCloudinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');
const Media = require('../model/Media');


const uploadMedia = async (req, res) => { 
    try { 
        logger.info('Starting Media upload');
        if (!req.file) {
            logger.error('No file uploaded , Please upload a file');
            return res.status(400).json({ success: false, message: 'No file uploaded , Please upload a file' });
        }

        const { originalname, buffer, mimetype } = req.file;
        const userId = req.user.userId;
        
        logger.info(`File Details ${originalname} ${mimetype} ${buffer.length} bytes`);
        logger.info('Uploading file to Cloudinary.....');

        const CloudinaryUploadResponse = await uploadMediaToCloudinary(req.file);
        logger.info(`Cloudinary Upload Successfully . PublicID ${CloudinaryUploadResponse.public_id}`);

        const newlyCreatedMedia = await Media({
            publicId: CloudinaryUploadResponse.public_id,
            originalName: originalname,
            mimeType: CloudinaryUploadResponse.secure_url,
            url: CloudinaryUploadResponse.secure_url,
            mime_type: mimetype,
            userId,
        });

        await newlyCreatedMedia.save();
        res.status(201).json({
            success: true,
            message: 'Media uploaded successfully',
            MediaId: newlyCreatedMedia._id,
            url: newlyCreatedMedia.url,
            message: 'Media uploaded successfully'
        })
    } catch (error) { 
        logger.error('Error uploading file', error); 
        res.status(500).json({ success: false, message: 'Error uploading file', error: error.message }); 
    } 
}


module.exports = { uploadMedia }