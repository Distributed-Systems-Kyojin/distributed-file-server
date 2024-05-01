const express = require('express');

const testController = require('../controllers/testController');

const router = express.Router();

//personal client register
router.get('/test1', testController.test_get);

module.exports = router;