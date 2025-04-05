const express = require('express');
const { registerUser , LoginUser ,refreshTokenUser , logoutUser } = require('../controller/identity');
const router = express.Router();

router.post('/register', registerUser); 
router.post('/login', LoginUser); 
router.post('/refresh-token', refreshTokenUser); 
router.post('/logout', logoutUser);

module.exports = router;