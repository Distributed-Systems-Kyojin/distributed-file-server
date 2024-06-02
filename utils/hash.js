const crypto = require('crypto');

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

const hash = (string) => {
    return crypto.createHash('sha256').update(string).digest('hex');
}

module.exports = {
    generateHash,
    compareHash,
    generateUniqueId,
    hash
};