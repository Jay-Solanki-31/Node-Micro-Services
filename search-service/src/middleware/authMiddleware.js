const logger = require('../utils/logger');


const authenticatedRequest = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];

        if (!userId) {
            logger.warn(`Access Attempt without x-user-id header`);
            return res.status(401).json({ success: false, message: 'Authorization is required. Please log in.' });
        }
        
        req.user = { userId }; 
        logger.info(`Authenticated request with User ID: ${userId}`);
        next();
    } catch (error) {        
        logger.error(error);
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports = { authenticatedRequest };
