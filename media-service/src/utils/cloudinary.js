const cloudinary = require('cloudinary').v2;
const { UploadStream } = require('cloudinary');
const logger = require('./logger');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const uploadMediaToCloudinary = async (file) => { 
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            resource_type: 'auto',
        },
            (error, result) => {
                if (error) {
                    logger.error('Error uploading file to Cloudinary', error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        )
        
        uploadStream.end(file.buffer); 
    })
}


const deleteMediaFromCloudinary = async (publicId) => {
    try {
        const result = cloudinary.uploader.destroy(publicId);
        logger.info(` Deleted file from Cloudinary: ${publicId}`);
        return result
    } catch (error) {
        logger.error('Error deleting file from Cloudinary', error);
    }
 }



module.exports = {uploadMediaToCloudinary , deleteMediaFromCloudinary}