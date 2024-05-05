const sqlite3 = require('sqlite3').verbose();
var db = null;

// Create or open the SQLite in-memory database
const openDatabase = () => {

    if (db === null) {

        let db_file = 'file_server_db.sqlite';
        
        db = new sqlite3.Database(db_file, (err) => {
        
            if (err) {
                console.error('Could not connect to the database', err);
            }
            else {
                console.log('Connected to the SQLite in-memory database');
            }
        });
    }

    return db;
}

// Check if the tables exists and create it if it doesn't
const initDatabase = () => {

    db.serialize(() => {

        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('MetaData', 'ChunkHashes')", [], (err, row) => {

            if (err) {
                console.error('Error checking for table', err);
                return;
            } 
            else if (!row) {

                db.run(
                    'CREATE TABLE MetaData (fileName TEXT PRIMARY KEY, chunkCount INTEGER, firstChunkNodeID TEXT, firstChunkNodeURL TEXT, merkleRootHash TEXT)',
                    (err) => {
                        if (err) {
                            console.error('Could not create MetaData table', err);
                        } 
                        else {
                            console.log('Created MetaData table');
                        }
                    }
                );

                db.run(
                    'CREATE TABLE ChunkData (chunkID TEXT PRIMARY KEY, fileName TEXT, chunkIndex INTEGER, chunkNodeID TEXT, chunkNodeURL TEXT, chunkHash TEXT)',
                    (err) => {
                        if (err) {
                            console.error('Could not create ChunkData table', err);
                        } 
                        else {
                            console.log('Created ChunkData table');
                        }
                    }
                );

                return;
            } 
            else {
                console.log('Tables already exists');
                return row;
            }
        });
    });
};

module.exports = { openDatabase, initDatabase };