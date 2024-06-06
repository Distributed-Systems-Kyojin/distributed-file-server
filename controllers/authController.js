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

        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.status(201).send({ accessToken });

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

        const refreshTokenUpdateResult = await authService.updateRefreshToken(user.userId, refreshToken);
        if (!refreshTokenUpdateResult) throw createError.InternalServerError();

        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.send({ accessToken });
    } catch (error) {
        if (error.isJoi === true) return next(createError.BadRequest("Invalid username or password"));
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        const cookies = req.cookies;
        if (!cookies) throw createError.BadRequest();

        const refreshToken = cookies.jwt;
        if (!refreshToken) throw createError.BadRequest();
        
        const userId = await verifyRefreshToken(refreshToken);
        const user = await authService.findUser(userId);
        if (!user) {
            res.clearCookie('jwt', { httpOnly: true });
            throw createError.Unauthorized("Invalid user");
        }
        
        const result = await authService.updateRefreshToken(userId);
        if (!result) throw createError.InternalServerError("Failed to logout");

        res.clearCookie('jwt', { httpOnly: true });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

const refreshToken = async (req, res, next) => {
    try {
        const cookies = req.cookies;
        if (!cookies) throw createError.Forbidden();

        const refreshToken = cookies.jwt;
        if (!refreshToken) throw createError.Forbidden();

        const userId = await verifyRefreshToken(refreshToken);

        // check the refresh token with the one stored in the database
        const refreshTokenDB = await authService.getRefreshToken(userId);
        if (refreshToken !== refreshTokenDB) throw createError.Forbidden("Refresh token mismatch");

        const accessToken = await signAccessToken(userId);
        const newRefreshToken = await signRefreshToken(userId);
        const result = await authService.updateRefreshToken(userId, newRefreshToken);
        if (!result) throw createError.Forbidden();

        res.cookie('jwt', newRefreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.status(200).send({ accessToken });

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