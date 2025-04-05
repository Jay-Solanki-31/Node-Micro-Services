const logger = require("../utils/logger");
const jwt = require('jsonwebtoken')

const validatetoken = (req,res,next) =>{
    const authHeader = req.headers['authorization'];
    
    const token = authHeader && authHeader.split(" ")[1];
    

    if (!token) {
        logger.warn("Access attempt with out Token");
        return res.status(404).json({
            message: "Authentication Failed",
            success:false
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn("invalid Token");
        return res.status(429).json({
            message: "invalid Token",
            success:false
        })
        }
        req.user = user;
        
        next();
    })
} 


module.exports = validatetoken;