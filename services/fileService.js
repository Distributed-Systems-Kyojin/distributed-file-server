const axios = require('axios');

const retrieveFile = async(fileName) => {
    try {
        // Retrieve metadata for the file
        const metadata = await getMetadata(fileName);
        if (!metadata) {
            return null;
        }

        // Retrieve chunks from nodes
        const chunks = await getChunks(metadata.locationOfFirstChunk, fileName);

        // Verify Merkle Root hash
        const isAuthentic = verifyMerkleRoot(metadata.merkleRootHash, chunks);
        if (!isAuthentic) {
            console.error('File is tampered');
            return { tampered: true };
        }

        // Merge chunks
        const fileData = mergeChunks(chunks);
        console.log('File retrieved successfully');
        return fileData;
    } catch (error) {
        console.error('Error retrieving file:', error);
        return null;
    }
};

const getMetadata = async(fileName) => {
    // Implement logic to retrieve metadata for the file
};

const getChunks = async(firstChunkUrl, fileName) => {
    const chunks = [];
    let nodeUrl = firstChunkUrl;
    let chunkId = 0;

    try {
        while (nodeUrl !== 'null') {
            const response = await axios.post(`${nodeUrl}/api/node/retrieve`, {
                fileName: fileName,
                chunkId: chunkId
            });

            if (response.status === 200) {
                const retrieveResponse = response.data;

                chunks.push(retrieveResponse.chunk);
                nodeUrl = retrieveResponse.nextNode;
                chunkId++;

                console.log(`Chunk ${chunkId} retrieved from node ${nodeUrl}`);
            } else {
                throw new Error(`Failed to retrieve chunk ${chunkId} from node ${nodeUrl}`);
            }
        }

        return chunks;
    } catch (error) {
        console.error(`Error retrieving chunks: ${error}`);
        throw error;
    }
};

module.exports = {
    getChunks,
};

const verifyMerkleRoot = (merkleRootHash, chunks) => {
    // Implement logic to verify the Merkle Root hash
};

const mergeChunks = (fileChunks) => {
    const mergedOutput = Buffer.concat(fileChunks);
    return mergedOutput;
};

module.exports = {
    retrieveFile,
};
const db = require('../db_connection').openDatabase();

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

module.exports = {
    saveChunkData,
    saveChunkDataList,
    saveMetadata
};