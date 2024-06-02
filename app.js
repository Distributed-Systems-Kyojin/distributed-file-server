const express = require('express');
const cors = require('cors');
const createError = require('http-errors');
const morgan = require('morgan');

// environmental variables
require('dotenv').config();

const nodeRoutes = require('./routes/nodeRoutes');
const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes');

const makeApp = () => {
    // express app
    const app = express();
    app.use(morgan('dev'));

    app.options('*', cors())
    app.use(
        cors({
            exposedHeaders: ["x-refresh-token", "x-access-token"],
        })
    );
    app.use(express.json());

    // middleware & static files
    app.use(express.urlencoded({ extended: true }));

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    });

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
    app.use('/node', nodeRoutes);
    app.use('/file', fileRoutes);
    app.use('/auth', authRoutes);

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
