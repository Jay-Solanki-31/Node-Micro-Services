require('dotenv').config();
const express = require('express');
const connectDB = require('./db/db');
connectDB();
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis')
const cors = require('cors');
const helmet = require('helmet');
const postRoutes = require('./routes/post-routes')
const errorHandler =  require('./middleware/errorHandler')
const logger = require('./utils/logger');
const { rabbitConnect } = require('./utils/rebbitmq');

const app = express();
const PORT = process.env.PORT || 3002;

const redisClient = new Redis(process.env.REDIS_URI);
app.use(helmet());
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
app.use('/api/posts/create-post', sensitiveEndPointRateLimiter);

app.use('/api/posts', (req, res ,next) => {
    req.redisClient = redisClient;
    next();
}, postRoutes)

app.use(errorHandler)

async function startServer() {
    try {
        await rabbitConnect();
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);    
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
