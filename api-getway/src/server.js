require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const logger = require('./utils/logger');
// const routes = require('./routes/api-getway');
const { rateLimit } = require('express-rate-limit'); 
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const helmet = require('helmet');
const proxy = require('express-http-proxy');
const PORT = process.env.PORT || 3000;
const errorHandler = require('./middlewares/errorHandler');
const validatetoken = require('./middlewares/authMiddleware');
// middleware
app.use(cors());
app.use(express.json());
app.use(helmet());

//set redis client
const redisClient = new Redis(process.env.REDIS_URI);

// rate limiter
const ratelimitOptions =  rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
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
app.use(ratelimitOptions);

app.use((req,res,next) => {
    logger.info(`Received ${req.method} request to  ${req.url}`);
    logger.info(`Request body ${req.body}`);
    next();
})


const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api');
    },                                                                       
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({ 
            message:`Internal Server Error`,error: err.message
         });
     }

}

// setting up proxy for our identity services
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICES_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = "application/json";
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Identity Services Proxy Response: ${proxyResData.statusCode}`);

        return proxyResData;
    }
}));


// setting up proxy for our post services
app.use('/v1/posts', validatetoken, proxy(process.env.POST_SERVICES_URL, {
    ...proxyOptions,
    timeout:20000,

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        logger.info(`Forwarding request with User ID: ${srcReq.user.userid}`);
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userid ;
        return proxyReqOpts;
    },
    
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Post Services Proxy Response: ${proxyResData.statusCode}`);
        return proxyResData
    }
}));


// setting up proxy for our media services
app.use('/v1/media', validatetoken, proxy(process.env.MEDIA_SERVICES_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        logger.info(`Forwarding request with User ID: ${srcReq.user.userid}`);
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userid;
        if(!srcReq.headers['content-type'].startsWith('multipart/form-data')) {
            proxyReqOpts.headers['Content-Type'] = "application/json";
        }
        return proxyReqOpts;
    },
    
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Media Services Proxy Response: ${proxyResData.statusCode}`);
        return proxyResData
    },
    parseReqBody: false
}));

// setting up proxy for our search services
app.use('/v1/search', validatetoken, proxy(process.env.SEARCH_SERVICES_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        logger.info(`Forwarding request with User ID: ${srcReq.user.userid}`);
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userid;
        proxyReqOpts.headers['Content-Type'] = "application/json";

        return proxyReqOpts;
    },
    
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Search Services Proxy Response: ${proxyResData.statusCode}`);
        return proxyResData
    },
    parseReqBody: false
}));

app.use(errorHandler);
app.listen(PORT, () => {
    logger.info(`API Getaway is running on port ${PORT}`);    
    logger.info(`Identity Services is running on port ${process.env.IDENTITY_SERVICES_URL}`);    
    logger.info(`post Services is running on port ${process.env.POST_SERVICES_URL}`);    
    logger.info(`Media Services is running on port ${process.env.MEDIA_SERVICES_URL}`);    
    logger.info(`Search Services is running on port ${process.env.SEARCH_SERVICES_URL}`);    
    logger.info(`Redis URL ${process.env.REDIS_URI}`);    
});
