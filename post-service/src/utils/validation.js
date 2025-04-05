const joi = require('joi');

const validatePost = (data) => {
    const Schema = joi.object({
        content: joi.string().min(3).max(30).required(),
        mediaIds: joi.array().items(joi.string()),
    });

    return Schema.validate(data);
}


module.exports = { validatePost };