const db = require('../db_connection_pg');
const hash = require('../utils/hash');

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

var pool = null;
const getPool = async () => {

    if (pool === null) {
        pool = await db.getDB();
    }
}
getPool();

const userExists = async (email) => {
    const query = {
        text: 'SELECT * FROM "Users" WHERE "email" = $1',
        values: [email]
    }

    const result = await pool.query(query);
    return result.rows.length > 0;
}

const saveUser = async (registerSchema) => {
    const userId = hash.generateUniqueId();
    const hashedPassword = hash.hash(registerSchema.password);
    const query = {
        text: 'INSERT INTO "Users" ("userId", "username", "email", "password", "verified") VALUES($1, $2, $3, $4, $5)',
        values: [userId, registerSchema.username, registerSchema.email, hashedPassword, false]
    }

    try {
        const result = await pool.query(query);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    userExists,
    saveUser,
}