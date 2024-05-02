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

const isNodeExists = (nodeId, nodeURL) => {
    return nodeList.some(node => node.nodeId === nodeId && node.nodeURL === nodeURL);
}

module.exports = {
    addNode,
    removeNode,
    getNodeList,
    isNodeExists,
};
