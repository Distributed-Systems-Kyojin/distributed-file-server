const { MerkleTree } = require('merkletreejs')
const SHA256 = require('crypto-js/sha256')

const buildMerkleTree = (chunks) => {
    const leaves = chunks.map(chunk => SHA256(chunk))
    return new MerkleTree(leaves, SHA256)
}

const getRootHash = (chunks) => {
    const mt = buildMerkleTree(chunks)
    return mt.getRoot().toString('hex')
}

const verifyMerkleRoot = (chunks, merkleRootHash) => {
    const mt = buildMerkleTree(chunks)
    return mt.getRoot().toString('hex') === merkleRootHash
}

module.exports = {
    buildMerkleTree,
    getRootHash,
    verifyMerkleRoot
}
