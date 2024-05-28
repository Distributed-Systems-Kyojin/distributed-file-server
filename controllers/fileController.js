const fs = require('fs');
const path = require('path');

const nodeService = require('../services/nodeService');
const fileService = require('../services/fileService');

const merkleTree = require('../utils/merkleTree');
const hash = require('../utils/hash');

const CHUNK_SIZE = 1024 * 1024; // 1MB

const uploadFile = async(req, res) => {
    try {
        if (req.file != undefined) {

            let fileName = req.file.originalname;
            let chunkInfoList = [];

            let chunks = [];
            let nodes = nodeService.getRandomizedNodeList();

            const fileBuffer = fs.readFileSync(req.file.path);
            const fileSize = fileBuffer.length;

            const numChunks = Math.ceil(fileSize / CHUNK_SIZE);

            for (let i = 0; i < numChunks; i++) {

                const start = i * CHUNK_SIZE; // Start index
                const end = (i + 1) * CHUNK_SIZE; // End index
                const chunk = fileBuffer.slice(start, end); // Slice the buffer

                chunks.push(chunk); // Keep track of chunk paths
            }

            // create a Merkle Tree
            let mt = new merkleTree(chunks);
            let rootHash = mt.getRootHash();

            let chunkCount = 0;

            while (chunkCount < chunks.length) {

                let node = nodes[chunkCount % nodes.length];
                let nodeID = node.nodeId;
                let nodeURL = node.nodeURL;

                let chunk = chunks[chunkCount];
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

                let nodeResponse = await nodeService.sendFileChunk(node.nodeURL, chunkData);

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

                    console.log(`${chunkCount} chunks uploaded`);
                } else {
                    console.error(`Error uploading Chunk ${chunkCount} to Node ${nodeID}`);
                    throw new Error(`Error uploading Chunk ${chunkCount} to Node ${nodeID}`);
                }
            }

            if (await fileService.saveChunkDataList(chunkInfoList)) {

                console.log('Chunk info saved successfully');

                let metaData = {
                    fileId: hash.generateUniqueId(fileName),
                    fileName: fileName,
                    fileType: req.file.mimetype,
                    chunkCount: chunks.length,
                    firstChunkNodeID: nodes[0].nodeId,
                    firstChunkNodeURL: nodes[0].nodeURL,
                    merkleRootHash: rootHash,
                    fileSize: fileSize,
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    lastAccessed: new Date().toISOString(),
                }

                try {

                    await fileService.saveMetadata(metaData);
                    deleteTemporyFiles();

                    res.status(200).send({
                        message: "file uploaded successfully: " + req.file.originalname,
                    });
                } catch (error) {
                    throw new Error(`Error saving file metadata in the file server`);
                }
            } else {
                throw new Error(`Error saving chunk meta data in the file server`);
            }
        } else {
            return res.status(400).send("Please upload a file!");
        }
    } catch (err) {

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

const retrieveFile = async(req, res) => {
    
    const fileName = req.params.fileName;

    try {
        // Retrieve file data
        const fileData = await fileService.retrieveFile(fileName);

        if (!fileData) {
            return res.status(404).send({ error: 'File not found' });
        }

        // Check if file is tampered
        if (fileData.tampered) {
            console.warn('File is tampered');
            return res.status(400).json({ error: 'File is tampered' });
        }
        // Send the file to the client
        res.set('Content-Disposition', `attachment; filename=${fileName}`);
        res.set('Content-Type', 'application/octet-stream');
        res.status(200).send(fileData);
    } catch (error) {
        console.error('Error retrieving file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const retrieveAllFilesMetadata = async(req, res) => {
    try {
        const files = await fileService.retrieveAllFilesMetadata();
        console.log(files);
        res.status(200).send(files);
    } catch (error) {
        console.error('Error retrieving files:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    uploadFile,
    retrieveFile,
    retrieveAllFilesMetadata,
}