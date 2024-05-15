const fileService = require('../services/fileService');

const retrieveFile = async(req, res) => {
    const fileName = req.query.fileName;

    try {
        // Retrieve file data
        const fileData = await fileService.retrieveFile(fileName);

        if (!fileData) {
            return res.status(204).send(); // No Content
        }

        // Check if file is tampered
        if (fileData.tampered) {
            console.warn('File is tampered');
            return res.status(400).json({ message: 'File is tampered' });
        }

        // Send the merged file data as response
        res.status(200).send(fileData);
    } catch (error) {
        console.error('Error retrieving file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    retrieveFile,
};