require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./db/db');
connectDB();
const logger = require('./utils/logger');
const routes = require('./routes/identity-services');
const helmet = require('helmet');
const { RateLimiterRedis } = require('rate-limiter-flexible')
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis')
const PORT = process.env.PORT || 3001


const redisClient = new Redis(process.env.REDIS_URI);
// middleware
app.use(helmet());
app.use(express.json());
app.use(cors());

app.use((req,res,next) => {
    logger.info(`Received ${req.method} request to  ${req.url}`);
    logger.info(`Request body ${req.body}`);
    next();
})

// Ddos protection and ratelimiter
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix : 'middleware',
    points: 10,
    duration: 1
})
    
// set rate limiter
app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => {
        next();
    }).catch(() => {
        logger.warn(`Rate limit exceeded for ip ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Rate limit exceeded'
        });
    })
});

// ip based rate limiter for end point

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
app.use('/api/auth/register', sensitiveEndPointRateLimiter)


// routes
app.use('/api/auth', routes)

// error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);    
});

// unhandled promise rejection
process.on('unhandledRejection',(reason, promise) => {
    logger.error('unhandledRejection at', promise , "Reason", reason);
})