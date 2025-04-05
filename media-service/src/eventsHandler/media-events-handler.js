const Media = require("../model/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");



const handlePostDeleted = async (event) => {
    // console.log('event', event);
    const { postId, mediaIds } = event
    try {
        const mediaDelete = await Media.find({ _id: { $in: mediaIds } })
        
        for (const media of mediaDelete) {
            await deleteMediaFromCloudinary(media.publicId)
            await Media.findByIdAndDelete(media._id)

            logger.info(`Delete media ${media._id} associated with post ${postId}`);
         }

        logger.info(`Proceeded post-deleted event for post ${postId}`);

    } catch (error) {
        logger.error(" error while deleting a post", error);
    }
    
}

module.exports = { handlePostDeleted }; 