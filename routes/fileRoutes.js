const express = require('express');
const multer = require('multer');
const { verifyAccessToken } = require('../utils/jwtHelper');

const upload = multer({ dest: 'data/' });

const fileController = require('../controllers/fileController');

const router = express.Router();

router.post('/upload', verifyAccessToken, upload.single('file'), fileController.uploadFile);
router.get('/retrieve/:fileId', verifyAccessToken, fileController.retrieveFile);
router.get('/getFileList', verifyAccessToken, fileController.retrieveAllFilesMetadata);
router.delete('/deleteFile/:fileId', verifyAccessToken, fileController.deleteFile);

module.exports = router;