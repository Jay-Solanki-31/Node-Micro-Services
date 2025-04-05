const logger = require("../utils/logger");
const Search = require("../model/Search");
const mongoose = require("mongoose");


async function handlePostCreated(event) {
    try {

        const newSearchPost = new Search({
            postId: event.postId,
            userId: event.userId,
            content: event.content,
            createdAt: event.createdAt 

        });
        await newSearchPost.save();
        logger.info(`new search post created ${newSearchPost._id.toString()} , post id :${event.postId}` );
    } catch (error) {
        logger.error(" error while creating a post", error);

    }
}
async function handelDeletePost(event) {
    try {
        if (!event.postId) {
            logger.error("Received post-deleted event without postId");
            return;
        }

        console.log('this  is a post id  getting form the event ',event.postId);
        
        const result = await Search.findOneAndDelete({ postId: event.postId });
        if (result) {
            logger.info(`Search post deleted successfully: ${event.postId}`);
        } else {
            logger.warn(`Post not found in Search collection: ${event.postId}`);
        }

    } catch (error) {
        logger.error("Error while deleting search post", error);
    }
}


module.exports = {handlePostCreated  , handelDeletePost};