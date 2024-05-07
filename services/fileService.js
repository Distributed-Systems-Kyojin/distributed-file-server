const db = require('../db_connection').openDatabase();

const saveChunkData = async (chunkData) => {

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO ChunkData (chunkID, fileName, chunkIndex, chunkNodeID, chunkNodeURL, chunkHash) VALUES (?, ?, ?, ?, ?, ?)`,
            [chunkData.chunkId, chunkData.fileName, chunkData.chunkIndex, chunkData.nodeId, chunkData.nodeURL, chunkData.chunkHash],
            (err) => {
                if (err) {
                    console.error('Could not save chunk data', err);
                    return reject(err);
                }
                else {
                    console.log(`Chunk ${chunkData.chunkIndex}  data saved successfully`);
                    resolve();
                }
            }
        );
    });
}

const saveChunkDataList = async (chunkDataList) => {

    for (const chunkData of chunkDataList) {

        try {
            await saveChunkData(chunkData);
        } 
        catch (error) {
            console.error(`Error saving chunk data for chunk ${chunkData.chunkIndex}`);
            return false;
        }
    }
    return true;
}

const saveMetadata = async (metadata) => {

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO Metadata (fileName, chunkCount, firstChunkNodeID, firstChunkNodeURL, merkleRootHash) VALUES (?, ?, ?, ?, ?)`,
            [metadata.fileName, metadata.chunkCount, metadata.chunkCount, metadata.firstChunkNodeURL, metadata.merkleRootHash],
            (err) => {
                if (err) {
                    console.error('Could not save metadata', err);
                    return reject(err);
                } 
                else {
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
