const sqlite3 = require('sqlite3').verbose();

// Create or open the SQLite in-memory database
const openDatabase = () => {
    let db_file = 'file_server_db.sqlite';
    
    const db = new sqlite3.Database(db_file, (err) => {
    
        if (err) {
            console.error('Could not connect to the database', err);
        }
        else {
            console.log('Connected to the SQLite in-memory database');
        }
    });

    return db;
}

// Check if the "users" table exists and create it if it doesn't
const initDatabase = (db) => {

    db.serialize(() => {

        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", [], (err, row) => {

            if (err) {
                console.error('Error checking for table', err);
                return;
            } 
            else if (!row) {

                // Table doesn't exist, create it
                db.run(
                    'CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)',
                    (err) => {
                        if (err) {
                            console.error('Could not create users table', err);
                        } 
                        else {
                            console.log('Created users table');
                        }
                    }
                );
                return;
            } 
            else {
                console.log('Users table already exists');
                return row;
            }
        });
    });
};

module.exports = { openDatabase, initDatabase };