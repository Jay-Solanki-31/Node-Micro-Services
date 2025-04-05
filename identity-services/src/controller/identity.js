const generateTokens = require('../utils/generateToken');

const User = require('../model/User');
const logger = require('../utils/logger');
const { validateRegistration , validateLogin } = require('../utils/validation');
const RefreshToken = require('../model/refreshToken');
const registerUser = async (req, res) => {
    logger.info('register user');
    try {
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn('Validation Error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { username, email, password } = req.body;

        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            logger.warn('register user');
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        user = new User({ username, email, password });
        await user.save();
        logger.warn('user registered successfully', user._id);

        const { accessToken, refreshToken } = await generateTokens(user);
        res.status(200).json({
            success: true,
            message: 'User registered successfully',
            accessToken,
            refreshToken
        });

    } catch (error) {
        logger.error("register user error", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
}

const LoginUser = async (req, res) => { 
    logger.info('Login user');
    try {
        const { error } = validateLogin(req.body);
        if (error) {
            logger.warn('Validation Error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            logger.warn('User not found');
            return res.status(400).json({
                success: false,
                message: 'invalid credentials'
            });
        }
        
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn('User not found');
            return res.status(400).json({
                success: false,
                message: 'invalid credentials'
            });
        }

        const { accessToken, refreshToken } = await generateTokens(user);
        res.json({
            accessToken,
            refreshToken,
            userId : user._id

        })
        
        
    } catch (error) {
        logger.error("Login user error", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}


const refreshTokenUser = async (req, res) => {
    logger.info('refresh token');
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn('refresh token not found');
            return res.status(400).json({
                success: false,
                message: 'refresh token not found'
            });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });
        if (!storedToken || storedToken.expiresAt < Date.now()) {
            logger.warn('refresh token not found');
            return res.status(400).json({
                success: false,
                message: 'refresh token not found'
            });
        }

        const user = await User.findById(storedToken.user);
        if (!user) {
            logger.warn('user  not found');
            return res.status(400).json({
                success: false,
                message: ' user  not found'
            });
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokens(user);

        // delete old refresh token
        await RefreshToken.deleteOne({ _id : storedToken._id });
        res.json({
            accessToken : newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        logger.error("refresh token error", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}


const logoutUser = async (req, res) => {
    logger.info('logout user');
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn('refresh token not found');
            return res.status(400).json({
                success: false,
                message: 'refresh token not found'
            });
        }

        await RefreshToken.deleteOne({ token: refreshToken });
        logger.info('User logged out successfully');
        res.json({
            success: true,
            message: 'User logged out successfully'
        }); 
    } catch (error) {
        logger.error("logout user error", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}

module.exports = {
    registerUser,
    LoginUser,
    refreshTokenUser,
    logoutUser
}