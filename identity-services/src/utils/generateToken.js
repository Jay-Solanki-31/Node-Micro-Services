const JWT = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../model/refreshToken'); 

const generateTokens = async (user) => {
    const accessToken = JWT.sign(
        {
            userid: user._id,
            username: user.username,
        },
        process.env.JWT_SECRET, 
        { expiresIn: '50m' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Alternative way to set expiry

    await RefreshToken.create({ token: refreshToken, user: user._id, expiresAt });

    return { accessToken, refreshToken };
};

module.exports = generateTokens;
