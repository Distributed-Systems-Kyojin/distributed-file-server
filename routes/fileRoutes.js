const express = require('express');
const multer = require('multer');

const upload = multer({ dest: 'data/' });

const fileController = require('../controllers/fileController');

const router = express.Router();

router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/retrieve/:filename', fileController.retrieveFile);

module.exports = router;