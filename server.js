// environmental variables
require('dotenv').config();

//express app
const appMaker = require('./app');
const app = appMaker.makeApp();

// db connection methods
const db_conn = require('./db_connection_pg');
const connect_db = async (db_conn) => {
    await db_conn.createDB();
}
connect_db(db_conn);

const port = 3000;

app.listen(port, () => {
    console.log(`Running on port ${port}`);
});