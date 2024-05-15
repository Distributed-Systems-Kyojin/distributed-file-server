const express = require('express');
const multer = require('multer');

const upload = multer({ dest: 'data/' });

const fileController = require('../controllers/fileController');

const router = express.Router();

router.post('/upload', upload.single('file'), fileController.uploadFile);

module.exports = router;