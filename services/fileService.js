// const db = require('../db_connection').openDatabase();
const db = require('../db_connection_pg');
const merkleTree = require('../utils/merkleTree');
const nodeService = require('./nodeService');

var pool = null;
const getPool = async () => {

    if (pool === null) {
        pool = await db.getDB();
    }
}
getPool();

const retrieveFile = async (fileId) => {
    try {
        // Retrieve metadata for the file
        const metadata = await getMetadata(fileId);

        if (!metadata) {
            console.log("No Metadata found");
            return null;
        }

        // Retrieve chunks from nodes
        const chunks = await getChunks(fileId);

        // Verify Merkle Root hash
        const isAuthentic = merkleTree.verifyMerkleRoot(chunks, metadata.merkleRootHash);
        if (!isAuthentic) {
            console.error('File is tampered');
            return { tampered: true };
        }

        // Merge chunks
        const fileBuffer = mergeChunks(chunks);
        console.log('File retrieved successfully');
        return { metadata, fileBuffer };

    } catch (error) {
        console.error('Error retrieving file (fileService):', error);
        throw error;
    }
};

const retrieveAllFilesMetadata = async () => {
    
    const selectQuery = {
        name: 'retrieve-all-files-metadata',
        text: 'SELECT "fileId", "fileName", "fileType", "fileSize", "createdAt", "lastAccessed", "lastModified" FROM "MetaData"',
    }

    try {
        const res = await pool.query(selectQuery);
        return res.rows;
    }
    catch (err) {
        console.error('Error retrieving metadata:', err);
        throw err;
    }
}

const getChunks = async (fileId) => {

    // chunkDataList is a list of nodes that contain chunks of the file
    let chunkDataList = await getChunkData(fileId);

    const chunkList = [];
    let nodeURL;

    try {
        for (let nodeIndex = 0; nodeIndex < chunkDataList.length; nodeIndex++) {

            nodeURL = chunkDataList[nodeIndex].chunkNodeURL;
            const response = await nodeService.retrieveChunk(nodeURL, fileId, nodeIndex);
            if (!response) throw new Error(`Failed to retrieve chunks from node ${nodeURL}`);

            const retrieveResponse = response.data;
            chunkList.push(...retrieveResponse);

            console.log(`Chunks retrieved from node ${nodeURL}`);
        }

        chunkList.sort((a, b) => a.chunkIndex - b.chunkIndex);
        const chunks = chunkList.map(chunk => chunk.chunkData);

        return chunks;
    }
    catch (error) {
        console.error(`Error retrieving chunks (getChunks): ${error}`);
        throw error;
    }
};

const mergeChunks = (fileChunks) => {

    const bufferChunks = fileChunks.map(chunk => Buffer.from(chunk.data));
    const mergedOutput = Buffer.concat(bufferChunks);

    return mergedOutput;
};

const saveChunkData = async (chunkData) => {

    const insertQuery = {
        name: 'save-chunk-data',
        text: 'INSERT INTO "ChunkData" ("chunkID", "fileId", "fileName", "chunkIndex", "chunkNodeID", "chunkNodeURL", "chunkHash") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        values: [
            chunkData.chunkId,
            chunkData.fileId,
            chunkData.fileName,
            chunkData.chunkIndex,
            chunkData.chunkNodeID,
            chunkData.chunkNodeURL,
            chunkData.chunkHash
        ],
    }

    try {
        const result = await pool.query(insertQuery);
        console.log(`Chunk ${chunkData.chunkIndex} data saved successfully`);
        return result;
    }
    catch (err) {
        console.error('Could not save chunk data', err);
        throw err;
    }
};

const saveChunkDataList = async (chunkDataList) => {

    for (const chunkData of chunkDataList) {
        try {
            const result = await saveChunkData(chunkData);
        } catch (error) {
            console.error(`Error saving chunk data for chunk ${chunkData.chunkIndex}`);
            throw error;
        }
    }
    return true;
}

const saveMetadata = async (metadata) => {
    const insertQuery = {
        name: 'save-meta-data',
        text: 'INSERT INTO "MetaData" ("fileId", "fileName", "fileType", "chunkCount", "firstChunkNodeID", "firstChunkNodeURL", "merkleRootHash", "fileSize", "createdAt", "lastModified", "lastAccessed") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        values: [
            metadata.fileId,
            metadata.fileName,
            metadata.fileType,
            metadata.chunkCount,
            metadata.firstChunkNodeID,
            metadata.firstChunkNodeURL,
            metadata.merkleRootHash,
            metadata.fileSize,
            metadata.createdAt,
            metadata.lastModified,
            metadata.lastAccessed
        ],
    }

    try {
        const result = await pool.query(insertQuery);
        console.log('Metadata saved successfully');
        return result;
    }
    catch (err) {
        console.error('Could not save metadata', err);
        throw err;
    }
};

const getMetadata = async (fileId) => {

    const selectQuery = {
        name: 'get-metadata',
        text: 'SELECT * FROM "MetaData" WHERE "fileId" = $1',
        values: [fileId],
    }

    try {
        const result = await pool.query(selectQuery);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    }
    catch (err) {
        console.error('Error retrieving metadata:', err);
        throw err;
    }
};

const getChunkData = async (fileId) => {

    const selectQuery = {
        name: 'get-chunk-data',
        text: 'SELECT "chunkNodeID", "chunkNodeURL" FROM "ChunkData" WHERE "fileId" = $1 GROUP BY "chunkNodeID", "chunkNodeURL"',
        values: [fileId],
    }

    try {
        const result = await pool.query(selectQuery);
        return result.rows;
    }
    catch (err) {
        console.error('Error retrieving chunk data:', err);
        throw err;
    }
};

const updateLastAccessedDate = async (fileId) => {

    const updateQuery = {
        name: 'update-last-accessed-date',
        text: 'UPDATE "MetaData" SET "lastAccessed" = $1 WHERE "fileId" = $2',
        values: [new Date().toISOString(), fileId],
    }

    try {
        const result = await pool.query(updateQuery);
        console.log('Last accessed date updated successfully');
        return result;
    }
    catch (err) {
        console.error('Error updating last accessed date:', err);
        throw err;
    }
};

const deleteMetadata = async (fileId) => {
    const deleteQuery = {
        name: 'delete-metadata',
        text: 'DELETE FROM "MetaData" WHERE "fileId" = $1',
        values: [fileId],
    }

    try {
        const result = await pool.query(deleteQuery);
        console.log('Metadata deleted successfully');
        return result;
    }
    catch (err) {
        console.error('Error deleting metadata:', err);
        throw err;
    }
}

module.exports = {
    retrieveFile,
    getChunks,
    saveChunkData,
    saveChunkDataList,
    saveMetadata,
    getMetadata,
    retrieveAllFilesMetadata,
    getChunkData,
    updateLastAccessedDate,
    deleteMetadata
};