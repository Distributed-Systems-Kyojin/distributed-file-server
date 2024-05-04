const nodeService = require('../services/nodeService');

var CHUNK_SIZE = 1024 * 1024; // 1MB

const uploadFile = async (req, res) => {

    try {

        if (req.file != undefined) {

            let chunks = [];
            let nodes = nodeService.getRandomizedNodeList();
            
            // split the file into chunks
            for (let i = 0; i < req.file.buffer.length; i += CHUNK_SIZE) {
                chunks.push(req.file.buffer.slice(i, i + CHUNK_SIZE));
            }

            res.status(200).send({
                message: "Uploaded the file successfully: " + req.file.originalname,
            });
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

module.exports = {
    uploadFile,
}
