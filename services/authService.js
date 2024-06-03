const db = require('../db_connection_pg');
const hash = require('../utils/hash');

var pool = null;
const getPool = async () => {

    if (pool === null) {
        pool = await db.getDB();
    }
}
getPool();

const findUser = async (email) => {
    const query = {
        text: 'SELECT * FROM "Users" WHERE "email" = $1',
        values: [email]
    }

    const result = await pool.query(query);
    return result.rows[0];
}

const saveUser = async (registerSchema) => {
    const userId = hash.generateUniqueId();
    const hashedPassword = await hash.hashPassword(registerSchema.password);

    const query = {
        text: 'INSERT INTO "Users" ("userId", "username", "email", "password", "verified") VALUES($1, $2, $3, $4, $5) RETURNING *',
        values: [userId, registerSchema.username, registerSchema.email, hashedPassword, false]
    }

    try {
        const result = await pool.query(query);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

module.exports = {
    findUser,
    saveUser,
}