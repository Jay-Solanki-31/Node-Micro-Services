const logger = require('../utils/logger');
const Post = require('../model/Post');
const { validatePost } = require('../utils/validation');
const { publishEvent } = require('../utils/rebbitmq');


async function invalidPostCache(req, input) {

    const cacheKey = `post : ${input}`
    await req.redisClient.del(cacheKey);

    const keys =  await req.redisClient.keys('post:*'); 
    if (keys.length > 0) { 
        await req.redisClient.del(keys);
    }
}

const createPost = async (req, res) => {
    try {
        const { error } = validatePost(req.body);
        if (error) {
            logger.warn('Validation Error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { content, mediaIds } = req.body;
        const newlyCratedPost = new Post({
            users: req.user.userId, 
            content,
            mediaIds: mediaIds || []
        });

        await newlyCratedPost.save();

        await publishEvent('post.created', {
            postId: newlyCratedPost._id.toString(),
            userId: newlyCratedPost.users.toString(),
            content: newlyCratedPost.content,
            createdAt: newlyCratedPost.createdAt
        });

        await invalidPostCache(req , newlyCratedPost._id.toString());
        logger.info("Post created successfully", newlyCratedPost);
        res.status(201).json({
            success: true,   
            message: 'Post created successfully',
            data: newlyCratedPost
        });

    } catch (error) {
        logger.error("Create post error", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

const GetAllPost = async (req, res) => {
    // logger.info('GetAllPost is called ....');
    try {
        const page = parseInt(req.query.page) || 1;
        // console.log('page',page);
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey =  `post : ${page} : ${limit}`
        const cachePost = await  req.redisClient.get(cacheKey);

        if (cachePost) {
            return res.json(JSON.parse(cachePost))
        }

        const posts = await Post.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit);
        // console.log('posts',posts);
        
        const TotalOfAllPost = await Post.countDocuments();
        
        const result = {
            posts,
            currentPage: page,
            totalPages: Math.ceil(TotalOfAllPost / limit),
            totalPosts: TotalOfAllPost
        }
        // save posts in redis client 
        await req.redisClient.setex(cacheKey, 200, JSON.stringify(result));
        res.json(result);
    } catch (error) {
        logger.error(" error while getting all post", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}


const getPost = async (req, res) => {
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;
    const cachePost = await  req.redisClient.get(cacheKey);

    if (cachePost) {
        return res.json(JSON.parse(cachePost))
    }

    const singlePostWithDetails = await Post.findById(postId)
    if(!singlePostWithDetails) {
        return res.status(404).json({
            success: false,
            message: 'Post not found'
        });
    }
    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePostWithDetails));

    res.json(singlePostWithDetails);
 }

const DeletePost = async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({
            _id: req.params.id,
            users: req.user.userId
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // publish post deleted method
        await publishEvent('post-deleted', {
            postId: post._id.toString(),
            userId: req.user.userId,
            mediaIds : post.mediaIds
        });

        await invalidPostCache(req, req.params.id);
        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        logger.error(" error while deleting a post", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}


module.exports = {
    createPost,
    GetAllPost,
    getPost,
    DeletePost
}