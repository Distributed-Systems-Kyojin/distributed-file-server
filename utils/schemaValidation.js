const joi = require('@hapi/joi');

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

const registerSchema = joi.object({
    username: joi.string().pattern(USERNAME_REGEX).required(),
    email: joi.string().lowercase().pattern(EMAIL_REGEX).required(),
    password: joi.string().pattern(PWD_REGEX).required()
});

const loginSchema = joi.object({
    email: joi.string().lowercase().pattern(EMAIL_REGEX).required(),
    password: joi.string().pattern(PWD_REGEX).required()
});

module.exports = {
    registerSchema,
    loginSchema
}