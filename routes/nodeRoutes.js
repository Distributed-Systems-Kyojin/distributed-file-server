const express = require('express');

const nodeController = require('../controllers/nodeController');

const router = express.Router();

router.post('/register', nodeController.registerNode);
router.post('/unregister', nodeController.unregisterNode);
router.get('/allnodes', nodeController.getNodes);

module.exports = router;