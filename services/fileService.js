const db = require('../db_connection').openDatabase();
const merkleTree = require('../utils/merkleTree');
const nodeService = require('./nodeService');

const retrieveFile = async(fileName) => {
    try {
        // Retrieve metadata for the file
        const metadata = await getMetadata(fileName);
        if (!metadata) {
            console.log("No Metadata found");
            return null;
        }
        
        // Retrieve chunks from nodes
        const chunks = await getChunks(metadata.fileName);

        // Verify Merkle Root hash
        const isAuthentic = verifyMerkleRoot(metadata.merkleRootHash, chunks);
        if (!isAuthentic) {
            console.error('File is tampered');
            return { tampered: true };
        }

        // Merge chunks
        const fileBuffer = mergeChunks(chunks);
        console.log('File retrieved successfully');
        return fileBuffer;

    } catch (error) {
        console.error('Error retrieving file (fileService):', error);
        return null;
    }
};

const getChunks = async(fileName) => {
    
    let chunkDataList = await getChunkData(fileName);
    const chunks = [];
    let nodeURL;

    try {
        for (let chunkIndex = 0; chunkIndex < chunkDataList.length; chunkIndex++) {

            nodeURL = chunkDataList[chunkIndex].chunkNodeURL;
            const response = await nodeService.retrieveChunk(nodeURL, fileName, chunkIndex);

            if (response.status === 200) {

                const retrieveResponse = response.data;
                chunks.push(retrieveResponse.chunkData);

                console.log(`Chunk ${chunkIndex} retrieved from node ${nodeURL}`);
            } 
            else {
                throw new Error(`Failed to retrieve chunk ${chunkIndex} from node ${nodeURL}`);
            }
        }

        return chunks;
    } 
    catch (error) {
        console.error(`Error retrieving chunks (getChunks): ${error}`);
        throw error;
    }
};

const verifyMerkleRoot = (merkleRootHash, chunks) => {
    // Implement logic to verify the Merkle Root hash
    const mt = new merkleTree(chunks);
    const calculatedRootHash = mt.getRootHash();
    
    return calculatedRootHash === merkleRootHash;
};


const mergeChunks = (fileChunks) => {
    const mergedOutput = Buffer.concat(fileChunks);
    return mergedOutput;
};


const saveChunkData = async(chunkData) => {

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO ChunkData (chunkID, fileName, chunkIndex, chunkNodeID, chunkNodeURL, chunkHash) VALUES (?, ?, ?, ?, ?, ?)`, [chunkData.chunkId, chunkData.fileName, chunkData.chunkIndex, chunkData.chunkNodeID, chunkData.chunkNodeURL, chunkData.chunkHash],
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
        db.run(
            `INSERT INTO Metadata (fileName, chunkCount, firstChunkNodeID, firstChunkNodeURL, merkleRootHash) VALUES (?, ?, ?, ?, ?)`, [metadata.fileName, metadata.chunkCount, metadata.chunkCount, metadata.firstChunkNodeURL, metadata.merkleRootHash],
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
const getMetadata = async (fileName) => {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM Metadata WHERE fileName = ?`, [fileName],
            (err, row) => {
                if (err) {
                    console.error('Error retrieving metadata:', err);
                    return reject(err);
                } else {
                    if (!row) {
                        // If no metadata is found for the given fileName
                        return resolve(null);
                    }
                    // Construct the metadata object
                    const metadata = {
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

const getChunkData = async (fileName) => {

    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM ChunkData WHERE fileName = ? ORDER BY chunkIndex`, [fileName],
            (err, rows) => {
                if (err) {
                    console.error('Error retrieving metadata:', err);
                    return reject(err);
                } else {
                    if (!rows.length === 0) {
                        // If no metadata is found for the given fileName
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
    getChunkData
};