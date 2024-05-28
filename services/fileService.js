const db = require('../db_connection').openDatabase();
const merkleTree = require('../utils/merkleTree');
const nodeService = require('./nodeService');

const retrieveFile = async(fileName) => {
    try {
        // Retrieve metadata for the file
        const metadata = await getMetadata(fileName);
        if (!metadata) {
            return null;
        }
        // Retrieve chunks from nodes
        const chunks = await getChunks(metadata.firstChunkNodeURL, metadata.fileName);

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
        console.error('Error retrieving file:', error);
        return null;
    }
};

const retrieveAllFilesMetadata = async() => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT fileName FROM Metadata GROUP BY fileName`,
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

const getChunks = async(firstChunkNodeURL, fileName) => {
    const chunks = [];
    let nodeUrl = firstChunkNodeURL;
    let chunkIndex = 0; // how to get the first chunkID

    try {
        while (nodeUrl !== '') {
            const response = await nodeService.retrieveChunk(nodeUrl, fileName, chunkIndex);

            if (response.status === 200) {
                const retrieveResponse = response.data;

                chunks.push(retrieveResponse.chunk);
                nodeUrl = retrieveResponse.nextChunkNodeURL;
                chunkIndex++;

                console.log(`Chunk ${chunkIndex} retrieved from node ${nodeUrl}`);
            } else {
                throw new Error(`Failed to retrieve chunk ${chunkIndex} from node ${nodeUrl}`);
            }
        }

        return chunks;
    } catch (error) {
        console.error(`Error retrieving chunks: ${error}`);
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
            `INSERT INTO ChunkData (chunkID, fileName, chunkIndex, chunkNodeID, chunkNodeURL, chunkHash) VALUES (?, ?, ?, ?, ?, ?)`, [chunkData.chunkId, chunkData.fileName, chunkData.chunkIndex, chunkData.nodeId, chunkData.nodeURL, chunkData.chunkHash],
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
const getMetadata = async(fileName) => {
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

module.exports = {
    retrieveFile,
    getChunks,
    saveChunkData,
    saveChunkDataList,
    saveMetadata,
    getMetadata,
    retrieveAllFilesMetadata
};