const joi = require('@hapi/joi');

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

const registerSchema = joi.object({
    username: joi.string().pattern(USERNAME_REGEX).required(),
    email: joi.string().lowercase().pattern(EMAIL_REGEX).required(),
    password: joi.string().required()
});

module.exports = {
    registerSchema
}