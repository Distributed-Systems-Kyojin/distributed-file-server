const crypto = require('crypto');
const bcrypt = require('bcrypt');

const generateHash = (obj) => {
    const objString = JSON.stringify(obj);
    const hash = crypto.createHash('sha256').update(objString).digest('hex');
    return hash;
}

const compareHash = (obj, hash) => {
    const generatedHash = generateHash(obj);
    return generatedHash === hash;
}

const generateUniqueId = () => {
    const id = crypto.randomBytes(16).toString('hex');
    return id;
}

const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw error;
    }
}

const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        throw error;
    }
}

const generateKey = () => {
    console.log(crypto.randomBytes(32).toString('hex'));
}

module.exports = {
    generateHash,
    compareHash,
    generateUniqueId,
    hashPassword,
    comparePassword,
    generateKey
};