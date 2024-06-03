const authService = require('../services/authService');
const { registerSchema, loginSchema } = require('../utils/schemaValidation');
const hash = require('../utils/hash');
const createError = require('http-errors');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwtHelper');

const register = async (req, res, next) => {
    try {
        // validate and sanitize the input
        const validationResult = await registerSchema.validateAsync(req.body);

        // check if user already exists
        const user = await authService.findUser(validationResult.email);
        if (user) throw createError.Conflict("User already exists");

        const userId = hash.generateUniqueId();

        const accessToken = await signAccessToken(userId);
        const refreshToken = await signRefreshToken(userId);

        validationResult.userId = userId;
        validationResult.refreshToken = refreshToken;
        
        const savedUser = await authService.saveUser(validationResult);
        if (!savedUser) throw createError.InternalServerError("Failed to register user");

        res.status(201).send({ accessToken, refreshToken });

    } catch (error) {
        if (error.isJoi === true) error.status = 422;
        next(error);
    }
}

const login = async (req, res, next) => {
    try {
        const result = await loginSchema.validateAsync(req.body);

        const user = await authService.findUser(result.email);
        if (!user) throw createError.NotFound("User not registered");

        const isMatch = await hash.comparePassword(result.password, user.password);
        if (!isMatch) throw createError.Unauthorized("Invalid username or password");

        const accessToken = await signAccessToken(user.userId);
        const refreshToken = await signRefreshToken(user.userId);

        res.send({ accessToken, refreshToken });
    } catch (error) {
        if (error.isJoi === true) return next(createError.BadRequest("Invalid username or password"));
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw createError.BadRequest();
        const userId = await verifyRefreshToken(refreshToken);
        // remove the refresh token from the database
        // or blacklist it
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw createError.BadRequest();
        const userId = await verifyRefreshToken(refreshToken);

        const accessToken = await signAccessToken(userId);
        const newRefreshToken = await signRefreshToken(userId);

        res.send({ accessToken, refreshToken: newRefreshToken });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    login,
    register,
    logout,
    refreshToken
}