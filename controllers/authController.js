const authService = require('../services/authService');
const { registerSchema } = require('../utils/schemaValidation');
const createError = require('http-errors');

const register = async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) throw createError.BadRequest("Please provide all the required fields");

        // validate and sanitize the input
        const validationResult = await registerSchema.validateAsync({ username, email, password });

        const userExists = await authService.userExists(validationResult.email);
        if (userExists) throw createError.Conflict("User already exists");

        const result = await authService.saveUser(validationResult);
        if (!result) throw createError.InternalServerError("Failed to register user");

        res.status(201).send("User registered successfully");

    } catch (error) {
        if (error.isJoi === true) error.status = 422;
        next(error);
    }
}

const login = async (req, res, next) => {
    res.status(200).send("inside auth controller login");
}

const logout = async (req, res) => {
    res.status(200).send("inside auth controller logout");
}

const refreshToken = async (req, res) => {
    res.status(200).send("inside auth controller refreshToken");
}

module.exports = {
    login,
    register,
    logout,
    refreshToken
}