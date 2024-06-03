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

const saveUser = async (user) => {
    const hashedPassword = await hash.hashPassword(user.password);

    const query = {
        text: 'INSERT INTO "Users" ("userId", "username", "email", "password", "refreshToken", "verified") VALUES($1, $2, $3, $4, $5, $6)',
        values: [user.userId, user.username, user.email, hashedPassword, user.refreshToken, false]
    }

    try {
        const result = await pool.query(query);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    findUser,
    saveUser,
}