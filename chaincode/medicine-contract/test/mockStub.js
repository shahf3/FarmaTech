'use strict';

class MockStub {
  constructor() {
    this.state = new Map();
    this.privateData = new Map();
    this.compositeKeys = new Map();
    this.args = [];
    this.txId = 'mock-tx-id';
    this.txTimestamp = {
      seconds: { low: Math.floor(Date.now() / 1000) },
      nanos: (Date.now() % 1000) * 1000000
    };
    this.mspId = 'MockMSP';
    this.creator = {
      mspid: this.mspId,
      id_bytes: Buffer.from('mock-user')
    };
  }

  async getState(key) {
    return this.state.get(key) || Buffer.from('');
  }

  async putState(key, value) {
    this.state.set(key, Buffer.from(value));
    return Promise.resolve();
  }

  async deleteState(key) {
    this.state.delete(key);
    return Promise.resolve();
  }

  async getPrivateData(collection, key) {
    const collData = this.privateData.get(collection) || new Map();
    return collData.get(key) || Buffer.from('');
  }

  async putPrivateData(collection, key, value) {
    if (!this.privateData.has(collection)) {
      this.privateData.set(collection, new Map());
    }
    this.privateData.get(collection).set(key, Buffer.from(value));
    return Promise.resolve();
  }

  // Range query operations
  async getStateByRange(startKey, endKey) {
    const keys = Array.from(this.state.keys()).filter(function(key) {
      return key >= startKey && (endKey === '' || key <= endKey);
    }).sort();

    return this._generateIterator(keys);
  }

  // Rich query operations
  async getQueryResult(queryString) {
    try {
      const query = JSON.parse(queryString);
      const selector = query.selector || {};
      
      const results = [];
      const that = this;
      
      this.state.forEach(function(value, key) {
        try {
          const obj = JSON.parse(value.toString());
          let match = true;
          
          // Simple selector matching
          for (const prop in selector) {
            if (obj[prop] !== selector[prop]) {
              match = false;
              break;
            }
          }
          
          if (match) {
            results.push(key);
          }
        } catch (err) {
          // Skip non-JSON values
        }
      });
      
      return this._generateIterator(results);
    } catch (err) {
      throw new Error('Invalid query: ' + err.message);
    }
  }

  // Composite key operations
  createCompositeKey(objectType, attributes) {
    return objectType + ':' + attributes.join(':');
  }

  async getStateByPartialCompositeKey(objectType, attributes) {
    const partialKey = this.createCompositeKey(objectType, attributes);
    const keys = Array.from(this.state.keys()).filter(function(key) {
      return key.startsWith(partialKey);
    });
    return this._generateIterator(keys);
  }

  _generateIterator(keys) {
    let currentIndex = 0;
    const that = this;
    
    const iterator = {
      async next() {
        if (currentIndex < keys.length) {
          const key = keys[currentIndex++];
          return {
            done: false,
            value: {
              key: key,
              value: that.state.get(key)
            }
          };
        } else {
          return {
            done: true
          };
        }
      },
      
      async close() {
        return Promise.resolve();
      }
    };
    
    return Promise.resolve(iterator);
  }

  // Transaction context
  getTxID() {
    return this.txId;
  }

  getTxTimestamp() {
    return this.txTimestamp;
  }

  setTxTimestamp(seconds, nanos) {
    this.txTimestamp = {
      seconds: { low: seconds },
      nanos: nanos || 0
    };
  }

  // Args and parameters
  setArgs(args) {
    this.args = args.map(function(arg) {
      return Buffer.isBuffer(arg) ? arg : Buffer.from(arg);
    });
  }

  getArgs() {
    return this.args;
  }

  // Identity and MSP
  setMSPID(mspId) {
    this.mspId = mspId;
    this.creator.mspid = mspId;
  }
}

// Mock ClientIdentity
class MockClientIdentity {
  constructor(stub) {
    this.stub = stub;
  }
  
  getMSPID() {
    return this.stub.mspId;
  }
  
  getID() {
    return 'x509::/OU=client/CN=mock-user:';
  }
  
  getAttributeValue(attr) {
    return null;
  }
  
  assertAttributeValue(attr, value) {
    return false;
  }
}

// Mock Context
class MockContext {
  constructor() {
    this.stub = new MockStub();
    this.clientIdentity = new MockClientIdentity(this.stub);
  }
}

module.exports = {
  MockStub,
  MockClientIdentity,
  MockContext
};