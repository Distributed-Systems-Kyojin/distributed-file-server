const express = require('express');
const cors = require('cors');
const createError = require('http-errors');
const morgan = require('morgan');
const { verifyAccessToken } = require('./utils/jwtHelper');
const allowedOrigins = require('./allowedOrigins');
const cookieParser = require('cookie-parser');

// environmental variables
require('dotenv').config();

const nodeRoutes = require('./routes/nodeRoutes');
const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes');

const makeApp = () => {
    // express app
    const app = express();
    app.use(morgan('dev'));

    const corsOpts = {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'DELETE'],
        exposedHeaders: ['x-refresh-token', 'x-access-token']
    };

    app.use(cors(corsOpts));
    app.use(express.json());
    app.use(cookieParser());

    // middleware & static files
    app.use(express.urlencoded({ extended: true }));

    // set static file path for production build
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static('client/build'));
    }

    app.use((req, res, next) => {
        res.locals.path = req.path;
        next();
    });

    //root path
    app.get('/', (req, res) => {
        res.send("Welcome...!");
    });

    //routes
    app.use('/node', nodeRoutes); // doesn't require authentication
    app.use('/file', fileRoutes); // requires authentication
    app.use('/auth', authRoutes); // doesn't require authentication

    // handle all other routes
    app.use(async (req, res, next) => {
        next(createError.NotFound());
    });

    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.send({
            error: {
                status: err.status || 500,
                message: err.message,
            },
        });
    });

    return app;
}

module.exports = {
    makeApp
}
