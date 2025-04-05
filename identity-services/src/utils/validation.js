const joi = require('joi');

const validateRegistration = (data) => {
    const Schema = joi.object({
        username: joi.string().min(3).max(30).required(),
        email: joi.string().email().required(),
        password: joi.string().min(6).required(),
    });

    return Schema.validate(data);
}


const validateLogin = (data) => {
    const Schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(6).required(),
    });

    return Schema.validate(data);
}
module.exports = { validateRegistration ,validateLogin };