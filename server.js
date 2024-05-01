// environmental variables
require('dotenv').config();
const dbURI = process.env.DB_URI;

//express app
const appMaker = require('./app');
const app = appMaker.makeApp();

// db connection methods
const db_conn = require('./db_connection');
const db = db_conn.openDatabase();
db_conn.initDatabase(db);

const port = process.env.PORT || 5000;

// connect to mongodb and listen
app.listen(port, () => {
    console.log(`Running on port ${port}`);
});