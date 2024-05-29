const nodeService = require('../services/nodeService');

const registerNode = (req, res) => {

    const nodeId = req.body.nodeId;
    const nodeURL = req.body.nodeURL;

    try {

        if (nodeId) {
    
            if (!nodeService.isNodeExists(nodeId, nodeURL)){
    
                nodeService.addNode({ nodeId, nodeURL });
                console.log(`Node ${nodeId} registered.`);

                console.log("Node List - registerNode")
                console.log(nodeService.getNodeList());
        
                res.status(200).send({ message: 'Node registered.' });
            } 
            else {
                res.status(400).send({ error: 'Duplicate Node' });
            }
        }
        else {
            res.status(400).send({ error: 'Node ID is required.' });
        }
    } 
    catch (error) {

        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

const unregisterNode = (req, res) => {

    const nodeId = req.body.nodeId;
    const nodeURL = req.body.nodeURL;

    try {

        if (nodeId && nodeService.isNodeExists(nodeId, nodeURL)) {
    
            nodeService.removeNode(nodeId, nodeURL);
            console.log(`Node ${nodeId} unregistered.`);

            console.log("Node List - unregisterNode");
            console.log(nodeService.getNodeList());
            
            res.status(200).send({ message: 'Node deregistered.' });
        } 
        else {
            res.status(400).send({ error: 'Node not found or invalid ID.' });
        }
    } 
    catch (error) {
        
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

const getNodes = (req, res) => {
    
    try {
        res.status(200).send({ nodes: nodeService.getNodeList() });
    } 
    catch (error) {
        
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

module.exports = {
    registerNode,
    unregisterNode,
    getNodes
}
