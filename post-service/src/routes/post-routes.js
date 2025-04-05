const express = require('express');
const { createPost, GetAllPost,getPost, DeletePost } = require('../controller/post-controller');
const router = express.Router();
const { authenticatedRequest } = require('../middleware/authMiddleware')

router.use(authenticatedRequest)

router.post('/create-post',  createPost);
router.get('/get-all-post', GetAllPost);
router.get('/:id', getPost);
router.delete('/:id', DeletePost);     


module.exports = router;