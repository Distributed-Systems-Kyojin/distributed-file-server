const crypto = require('crypto');

class MerkleTree {
  constructor(chunks) {
    this.chunks = chunks.map(chunk => this.hashChunk(chunk)); // Hash the initial chunks
    this.tree = this.buildTree(this.chunks);
  }

  hashChunk(chunk) {
    if (typeof chunk !== 'string' && !Buffer.isBuffer(chunk)) {
      throw new Error('Expected chunk to be a string or buffer');
    }
    // Assuming chunk is a string or buffer, we use SHA-256 for hashing
    return crypto.createHash('sha256').update(chunk).digest(); // Returns a Buffer
  }

  combineHashes(hash1, hash2) {
    // Combine two hashes, hash the combination, and return the result
    const combined = Buffer.concat([hash1, hash2]);
    return crypto.createHash('sha256').update(combined).digest(); // Returns a Buffer
  }

  buildTree(chunks) {
    if (chunks.length === 1) {
      return chunks[0]; // Return the root hash
    }

    const nextLevel = [];
    for (let i = 0; i < chunks.length; i += 2) {
      const hash1 = chunks[i];
      const hash2 = chunks[i + 1] || hash1; // Duplicate last chunk if odd number of chunks
      const combinedHash = this.combineHashes(hash1, hash2);
      nextLevel.push(combinedHash);
    }

    return this.buildTree(nextLevel); // Recursively build the tree
  }

  getRootHash() {
    return this.tree.toString('hex'); // Convert the root hash to a hexadecimal string
  }
}

// Example usage
// const chunks = ['chunk1', 'chunk2', 'chunk3', 'chunk4']; // Some data chunks
// const merkleTree = new MerkleTree(chunks);

// console.log('Merkle Tree Root Hash:', merkleTree.getRootHash()); // Output the root hash as a string


module.exports = MerkleTree;
