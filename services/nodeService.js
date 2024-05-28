const axios = require('axios');
const db = require('../db_connection').openDatabase();

var nodeList = [];

const addNode = (node) => {
    nodeList.push(node);
}

const removeNode = (nodeId) => {
    nodeList = nodeList.filter(node => node.nodeId !== nodeId && node.nodeURL !== nodeURL);
}

const getNodeList = () => {
    return nodeList;
}

const getRandomizedNodeList = () => {
    return nodeList.sort(() => Math.random() - 0.5);
}

const isNodeExists = (nodeId, nodeURL) => {
    return nodeList.some(node => node.nodeId === nodeId && node.nodeURL === nodeURL);
}

const sendFileChunk = async(nodeURL, chunkData) => {

    let response = await axios.post(nodeURL + '/file/save-chunk', chunkData);
    return response;
}

const retrieveChunk = async(nodeURL, fileName) => {
    try {
        const response = await axios.get(`${nodeURL}/file/get-chunk`, {
            params: { fileName }
        });
        return response;
    } catch (error) {
        console.error(`(nodeService) Error retrieving chunk ${chunkIndex} from ${nodeURL}: ${error.message}`);
        return null;
    }
};

module.exports = {
    addNode,
    removeNode,
    getNodeList,
    getRandomizedNodeList,
    isNodeExists,
    sendFileChunk,
    retrieveChunk
};