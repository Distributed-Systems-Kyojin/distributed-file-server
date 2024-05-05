class MerkleTree {

    constructor(chunks) {
        this.chunks = chunks;
        this.tree = this.buildTree(chunks);
    }

    buildTree(chunks) {

        if (chunks.length === 1) {
            return chunks[0];
        }

        const nextLevel = [];
        for (let i = 0; i < chunks.length; i += 2) {
            
            const chunk1 = chunks[i];
            const chunk2 = chunks[i + 1] || chunk1; // Duplicate last chunk if odd number of chunks

            const combinedHash = this.combineHashes(chunk1, chunk2);
            nextLevel.push(combinedHash);
        }

        return this.buildTree(nextLevel);
    }

    getRootHash() {
        return this.tree;
    }
}

// Usage example
// const chunks = ['chunk1', 'chunk2', 'chunk3', 'chunk4'];
// const merkleTree = new MerkleTree(chunks);
// const rootHash = merkleTree.getRootHash();
// console.log('Root Hash:', rootHash);

module.exports = MerkleTree;
