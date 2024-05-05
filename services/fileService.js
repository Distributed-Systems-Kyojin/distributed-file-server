const db = require('../db_connection').openDatabase();

const saveChunkData = async (chunkData) => {

    db.run(
        `INSERT INTO ChunkData (chunkID, fileName, chunkIndex, chunkNodeID, chunkNodeURL, chunkHash) VALUES (?, ?, ?, ?, ?, ?)`,
        [chunkData.chunkId, chunkData.fileName, chunkData.chunkIndex, chunkData.nodeId, chunkData.nodeURL, chunkData.chunkHash],
        (err) => {
            if (err) {
                console.error('Could not save chunk data', err);
                return false;
            }
            else {
                console.log(`Chunk ${chunkIndex}  data saved successfully`);
                return true;
            }
        }
    );
}

const saveChunkDataList = async (chunkDataList) => {

    for (const chunkData of chunkDataList) {

        let response = await saveChunkData(chunkData);
        if (!response){
            return false;
        }
    }
    return true;
}

const saveMetadata = async (metadata) => {

    db.run(
        `INSERT INTO Metadata (fileName, chunkCount, firstChunkNodeID, firstChunkNodeURL, merkleRootHash) VALUES (?, ?, ?, ?, ?)`,
        [metadata.fileName, metadata.chunkCount, metadata.chunkCount, metadata.firstChunkNodeURL, metadata.merkleRootHash],
        (err) => {
            if (err) {
                console.error('Could not save metadata', err);
                return false;
            } else {
                console.log('Metadata saved successfully');
                return true;
            }
        }
    );
}

module.exports = {
    saveChunkData,
    saveChunkDataList,
    saveMetadata
};
