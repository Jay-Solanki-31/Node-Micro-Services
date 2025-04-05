require('dotenv').config();
const express = require('express');
const connectDB = require('./db/db');
connectDB();
const logger = require('./utils/logger');
const app = express();
const PORT = process.env.PORT || 3004;
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis')
const Redis = require('ioredis');
const redisClient = new Redis(process.env.REDIS_URI);
const searchRoutes = require('./routes/search-routes');
const errorHandler = require('./middleware/errorHandler');
const { rabbitConnect, consumeEvent } = require('./utils/rebbitmq');
const {handlePostCreated ,handelDeletePost} = require('./eventHandlers/search-events-handler');
// middleware
app.use(express.json());
app.use(cors());
app.use(helmet());


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
  

app.use('/api/search', sensitiveEndPointRateLimiter, searchRoutes);
app.use(errorHandler);

async function startServer() {
    try {
        await rabbitConnect();

        await consumeEvent('post.created', handlePostCreated);
        await consumeEvent('post-deleted', handelDeletePost);

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);    
        });
        
    } catch (error) {
        logger.error('Error connecting to RabbitMQ', error);
        process.exit(1);
    }
}


startServer();