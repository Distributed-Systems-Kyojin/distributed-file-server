// environmental variables
require('dotenv').config();

//express app
const appMaker = require('./app');
const app = appMaker.makeApp();

// db connection methods
const db_conn = require('./db_connection');
const db = db_conn.openDatabase();
db_conn.initDatabase(db);

const port = 3000;

app.listen(port, () => {
    console.log(`Running on port ${port}`);
});