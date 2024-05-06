const fs = require('fs');

const nodeService = require('../services/nodeService');
const fileService = require('../services/fileService');

const merkleTree = require('../utils/merkleTree');
const hash = require('../utils/hash');

var CHUNK_SIZE = 1024 * 1024; // 1MB

const uploadFile = async (req, res) => {
    try {

        if (req.file != undefined) {

            let fileName = req.file.originalname;
            let chunkInfoList = [];

            let chunks = [];
            let nodes = nodeService.getRandomizedNodeList();
            
            // split the file into chunks
            for (let i = 0; i < req.file.buffer.length; i += CHUNK_SIZE) {
                chunks.push(req.file.buffer.slice(i, i + CHUNK_SIZE));
            }

            // create a Merkle Tree
            let mt = new merkleTree(chunks);
            let rootHash = mt.getRootHash();

            let chunkCount = 0;

            while (chunkCount < chunks.length) {

                let node = nodes[chunkCount % nodes.length];
                let nodeID = node.nodeId;
                let nodeURL = node.nodeURL;

                let chunk = chunks[i];
                let chunkHash = hash.generateHash(chunk);

                let chunkId = hash.generateUniqueId(chunkHash);
                let nextChunkNodeID = chunkCount < chunks.length - 1 ? nodes[(chunkCount + 1) % nodes.length].nodeId : '';
                let nextChunkNodeURL = chunkCount < chunks.length - 1 ? nodes[(chunkCount + 1) % nodes.length].nodeURL : '';
                let chunnkIndex = chunkCount;

                let chunkData = {
                    chunkId: chunkId,
                    chunk: chunk,
                    fileName: fileName,
                    merkleRootHash: rootHash,
                    nextChunkNodeID: nextChunkNodeID,
                    nextChunkNodeURL: nextChunkNodeURL,
                    chunkIndex: chunnkIndex,
                };

                let nodeResponse = nodeService.sendFileChunk(node.nodeURL, chunkData);
                console.log(nodeResponse);

                // TODO: Handle the response from the node
                if (nodeResponse.status === 200) {

                    console.log(`Chunk ${chunkCount} uploaded to Node ${nodeID}`);

                    let chunkInfo = {
                        chunkId: chunkId,
                        fileName: fileName,
                        chunkIndex: chunkCount,
                        chunkNodeID: nodeID,
                        chunkNodeURL: nodeURL,
                        chunkHash: chunkHash,
                    };

                    chunkInfoList.push(chunkInfo);
                    chunkCount += 1;
                }
                else {
                    console.error(`Error uploading Chunk ${chunkCount} to Node ${nodeID}`);
                    throw new Error(`Error uploading Chunk ${chunkCount} to Node ${nodeID}`);
                }
            }

            if (await fileService.saveChunkDataList(chunkInfoList)) {

                let metaData = {
                    fileName: fileName,
                    chunkCount: chunks.length,
                    firstChunkNodeID: nodes[0].nodeID,
                    firstChunkNodeURL: nodes[0].nodeURL,
                    merkleRootHash: rootHash
                }

                if (await fileService.saveMetadata(metaData)){

                    // TODO: Empty the data folder
                    deleteTemporyFiles();

                    res.status(200).send({
                        message: "Uploaded the file successfully: " + req.file.originalname,
                    });
                }
                else {
                    throw new Error(`Error saving file metadata in the file server`);
                }
            } 
            else {
                throw new Error(`Error saving chunk meta data in the file server`);
            }
        }
        else {
            return res.status(400).send("Please upload a file!");
        }
    } 
    catch (err) {

        res.status(500).send({
            message: `Internal Server Error: Could not upload the file: ${req.file.originalname}. ${err}`,
        });
    }
}

const deleteTemporyFiles = () => {

    let folderPath = './data';
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(`Error reading folder: ${folderPath}`, err);
            throw err;
        }

        files.forEach(file => {
            const filePath = `${folderPath}/${file}`;

            fs.unlink(filePath, err => {
                if (err) {
                    console.error(`Error deleting file: ${filePath}`, err);
                    throw err;
                }

                console.log(`Deleted file: ${filePath}`);
            });
        });
    });
}

module.exports = {
    uploadFile,
}
