require("dotenv").config();

const db_conn = require('../db_connection');
const db = db_conn.openDatabase();

//register a personal client
const test_get = async (req, res) => {

    try {

        const { name, email } = { name: "test", email: "example@gmail.com" };
        db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function (err) {

            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            console.log("A row has been inserted with rowid " + this.lastID);
        });

        db.all('SELECT * FROM users', [], (err, rows) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                status: "ok",
                data: rows
            });
        });
    }
    catch (err) {

        console.log(err);

        res.status(400).json({
            status: "error",
        });
    }
};



module.exports = {
    test_get,
};
