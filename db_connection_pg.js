const { Client, Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_PORT = process.env.DB_PORT || 5432;

var DB_NAME = 'dfs_file_server';
var DB_pool = null;

const createDB = async () => {

    const client = new Client({
        user: DB_USER,
        host: DB_HOST,
        password: DB_PASSWORD,
        port: 5432,
    });

    await client.connect();

    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${DB_NAME}'`);

    if (res.rowCount === 0) {
        console.log(`${DB_NAME} database not found, creating it.`);
        await client.query(`CREATE DATABASE "${DB_NAME}";`);
        console.log(`created database ${DB_NAME}`);
    } else {
        console.log(`${DB_NAME} database exists.`);
    }

    await client.end();
    await createPool(true);
}


const createPool = async (createTable=false) => {

    DB_pool = new Pool({
        user: DB_USER,
        host: DB_HOST,
        database: DB_NAME,
        password: DB_PASSWORD,
        port: DB_PORT,
    });

    await DB_pool.connect(async (err, client, done) => {

        if (err) {
            console.error('Could not connect to the database', err);
        }
        else {
            console.log('Connected to the PostgreSQL database');
            if(createTable){
                await createTables(client);
            }
        }
    });
};

const getDB = async () => {

    if (DB_pool === null) {
        await createDB();
    }

    DB_pool = new Pool({
        user: DB_USER,
        host: DB_HOST,
        database: DB_NAME,
        password: DB_PASSWORD,
        port: DB_PORT,
    });

    const client = await DB_pool.connect();

    return client;
};

const createTables = async (client) => {

    const createMetaDataTable = `
        CREATE TABLE IF NOT EXISTS "MetaData" (
            "fileId" TEXT PRIMARY KEY, 
            "fileName" TEXT, 
            "fileType" TEXT, 
            "chunkCount" INTEGER, 
            "firstChunkNodeID" TEXT, 
            "firstChunkNodeURL" TEXT, 
            "merkleRootHash" TEXT, 
            "fileSize" INTEGER, 
            "createdAt" TEXT, 
            "lastModified" TEXT, 
            "lastAccessed" TEXT
        );
    `;

    const createChunkDataTable = `
        CREATE TABLE IF NOT EXISTS "ChunkData" (
            "chunkID" TEXT PRIMARY KEY, 
            "fileId" TEXT, 
            "fileName" TEXT, 
            "chunkIndex" INTEGER, 
            "chunkNodeID" TEXT, 
            "chunkNodeURL" TEXT, 
            "chunkHash" TEXT
        );
    `;

    await client.query(createMetaDataTable, (err) => {

        if (err) {
            console.error('Could not create MetaData table', err);
        }
        else {
            console.log('Created MetaData table');
        }
    });

    await client.query(createChunkDataTable, (err) => {

        if (err) {
            console.error('Could not create ChunkData table', err);
        }
        else {
            console.log('Created ChunkData table');
        }
        client.end();
    });
};

module.exports = {
    createDB,
    createPool,
    getDB,
};
