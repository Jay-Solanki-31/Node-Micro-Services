require('dotenv').config();
const express = require('express');
const connectDB = require('./db/db');
connectDB();
const logger = require('./utils/logger');
const app = express();
const PORT = process.env.PORT || 3003;
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis')
const Redis = require('ioredis');
const redisClient = new Redis(process.env.REDIS_URI);
const mediaRoutes = require('./routes/media-routes');
const errorHandler = require('./middleware/errorHandler');
const { rabbitConnect, consumeEvent } = require('./utils/rebbitmq');
const { handlePostDeleted } = require('./eventsHandler/media-events-handler');

// middleware
app.use(express.json());
app.use(cors()); 

app.use((req,res,next) => {
    logger.info(`Received ${req.method} request to  ${req.url}`);
    logger.info(`Request body ${req.body}`);
    next();
})


const sensitiveEndPointRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for ip ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Sensitive endpoint rate limit exceeded'})
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});
  

// apply this sensitiveEndPointRateLimiter to routes
app.use('/api/media/', sensitiveEndPointRateLimiter);


// routes
app.use('/api/media', mediaRoutes)

// error handler
app.use(errorHandler);


async function startServer() {
    try {
        await rabbitConnect();

        // consume events
        await consumeEvent('post-deleted',handlePostDeleted)
        app.listen(PORT, () => {
            logger.info(`Media service is running on port ${PORT}`);    
        });
    } catch (error) {
        logger.error('Error connecting to RabbitMQ', error);
        process.exit(1);
    }
}

startServer();

// unhandled promise rejection
process.on('unhandledRejection',(reason, promise) => {
    logger.error('unhandledRejection at', promise , "Reason", reason);
})
