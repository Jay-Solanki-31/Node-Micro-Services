const express = require('express');
const { searchPost } = require('../controller/search-controller');
const router = express.Router();
const { authenticatedRequest } = require('../middleware/authMiddleware');

router.use(authenticatedRequest);

router.get('/posts', searchPost);

module.exports = router; 