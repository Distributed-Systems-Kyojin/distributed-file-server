const JWT = require('jsonwebtoken');
const createError = require('http-errors');

const signAccessToken = (userId) => {
    return new Promise((resolve, reject) => {
        const payload = {};
        const secret = process.env.ACCESS_TOKEN_SECRET;
        const options = {
            expiresIn: '1h',
            issuer: 'dfs_file_server',
            audience: userId
        }

        JWT.sign(payload, secret, options, (err, token) => {
            if (err) {
                console.log(err.message);
                reject(createError.InternalServerError());
            }
            resolve(token);
        });
    });
}

const verifyAccessToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next(createError.Unauthorized());

    const token = authHeader.split(' ')[1];
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) {
            // if the err.name is not JsonWebTokenError, then it is either 'TokenExpiredError' or 'NotBeforeError', thus not a security issue to send the actual error.message to the client
            const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
            return next(createError.Unauthorized(message));
        }
        req.payload = payload;
        next();
    });
}

const signRefreshToken = (userId) => {
    return new Promise((resolve, reject) => {
        const payload = {};
        const secret = process.env.REFRESH_TOKEN_SECRET;
        const options = {
            expiresIn: '1y',
            issuer: 'dfs_file_server',
            audience: userId
        }

        JWT.sign(payload, secret, options, (err, token) => {
            if (err) {
                console.log(err.message);
                reject(createError.InternalServerError());
            }
            resolve(token);
        });
    });
}

const verifyRefreshToken = async (refreshToken) => {
    return new Promise((resolve, reject) => {
        JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
            if (err) return reject(createError.Unauthorized());
            const userId = payload.aud;
            resolve(userId);
        });
    });

}

module.exports = {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken
}