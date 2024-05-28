const db = require('../db_connection').openDatabase();
const merkleTree = require('../utils/merkleTree');
const nodeService = require('./nodeService');

const retrieveFile = async(fileId) => {
    try {
        // Retrieve metadata for the file
        const metadata = await getMetadata(fileId);
        if (!metadata) {
            console.log("No Metadata found");
            return null;
        }
        
        // Retrieve chunks from nodes
        const chunks = await getChunks(metadata.fileId);

        // Verify Merkle Root hash
        const isAuthentic = merkleTree.verifyMerkleRoot(chunks, metadata.merkleRootHash);
        if (!isAuthentic) {
            console.error('File is tampered');
            return { tampered: true };
        }

        // Merge chunks
        const fileBuffer = mergeChunks(chunks);
        console.log('File retrieved successfully');
        return {metadata, fileBuffer};

    } catch (error) {
        console.error('Error retrieving file (fileService):', error);
        return null;
    }
};

const retrieveAllFilesMetadata = async() => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT fileId, fileName, fileType, fileSize, createdAt, lastAccessed, lastModified FROM Metadata`,
            (err, rows) => {
                if (err) {
                    console.error('Error retrieving metadata:', err);
                    return reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
};

const getChunks = async(fileId) => {
    
    let chunkDataList = await getChunkData(fileId);
    
    const chunkList = [];
    let nodeURL;

    try {
        for (let nodeIndex = 0; nodeIndex < chunkDataList.length; nodeIndex++) {

            nodeURL = chunkDataList[nodeIndex].chunkNodeURL;
            const response = await nodeService.retrieveChunk(nodeURL, fileId, nodeIndex);

            if (response.status === 200) {

                const retrieveResponse = response.data;
                chunkList.push(...retrieveResponse);

                console.log(`Chunks retrieved from node ${nodeURL}`);
            } 
            else {
                throw new Error(`Failed to retrieve chunks from node ${nodeURL}`);
            }
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

const saveChunkData = async(chunkData) => {

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO ChunkData (chunkID, fileId, fileName, chunkIndex, chunkNodeID, chunkNodeURL, chunkHash) VALUES (?, ?, ?, ?, ?, ?, ?)`, [chunkData.chunkId, chunkData.fileId, chunkData.fileName, chunkData.chunkIndex, chunkData.chunkNodeID, chunkData.chunkNodeURL, chunkData.chunkHash],
            (err) => {
                if (err) {
                    console.error('Could not save chunk data', err);
                    return reject(err);
                } else {
                    console.log(`Chunk ${chunkData.chunkIndex}  data saved successfully`);
                    resolve();
                }
            }
        );
    });
}

const saveChunkDataList = async(chunkDataList) => {

    for (const chunkData of chunkDataList) {

        try {
            await saveChunkData(chunkData);
        } catch (error) {
            console.error(`Error saving chunk data for chunk ${chunkData.chunkIndex}`);
            return false;
        }
    }
    return true;
}

const saveMetadata = async(metadata) => {

    return new Promise((resolve, reject) => {
        const { fileId, fileName, fileType, chunkCount, firstChunkNodeID, firstChunkNodeURL, merkleRootHash, fileSize, createdAt, lastModified, lastAccessed } = metadata;
        db.run(
            `INSERT INTO Metadata (fileId, fileName, fileType, chunkCount, firstChunkNodeID, firstChunkNodeURL, merkleRootHash, fileSize, createdAt, lastModified, lastAccessed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [fileId, fileName, fileType, chunkCount, firstChunkNodeID, firstChunkNodeURL, merkleRootHash, fileSize, createdAt, lastModified, lastAccessed],
            (err) => {
                if (err) {
                    console.error('Could not save metadata', err);
                    return reject(err);
                } else {
                    console.log('Metadata saved successfully');
                    resolve();
                }
            }
        );
    });
}

const getMetadata = async (fileId) => {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM Metadata WHERE fileId = ?`, [fileId],
            (err, row) => {
                if (err) {
                    console.error('Error retrieving metadata:', err);
                    return reject(err);
                } else {
                    if (!row) {
                        // If no metadata is found for the given fileId
                        return resolve(null);
                    }
                    // Construct the metadata object
                    const metadata = {
                        fileId: row.fileId,
                        fileName: row.fileName,
                        chunkCount: row.chunkCount,
                        firstChunkNodeID: row.firstChunkNodeID,
                        firstChunkNodeURL: row.firstChunkNodeURL,
                        merkleRootHash: row.merkleRootHash
                    };
                    resolve(metadata);
                }
            }
        );
    });
};

const getChunkData = async (fileId) => {

    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM ChunkData WHERE fileId = ? GROUP BY chunkNodeID`, [fileId],
            (err, rows) => {
                if (err) {
                    console.error('Error retrieving metadata:', err);
                    return reject(err);
                } else {
                    if (!rows.length === 0) {
                        // If no metadata is found for the given fileId
                        return resolve(null);
                    }
                    resolve(rows);
                }
            }
        );
    });
}

module.exports = {
    retrieveFile,
    getChunks,
    saveChunkData,
    saveChunkDataList,
    saveMetadata,
    getMetadata,
    retrieveAllFilesMetadata,
    getChunkData
};