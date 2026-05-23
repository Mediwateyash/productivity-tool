const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'local_db');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getFilePath = (collection) => {
  return path.join(DATA_DIR, `${collection}.json`);
};

const readData = (collection) => {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error(`Error reading collection ${collection}:`, err);
    return [];
  }
};

const writeData = (collection, data) => {
  const filePath = getFilePath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing collection ${collection}:`, err);
  }
};

// Simple helper to generate MongoDB-like ObjectIDs for mock mode
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const localDB = {
  find: async (collection, query = {}) => {
    const list = readData(collection);
    return list.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  },

  findOne: async (collection, query = {}) => {
    const list = readData(collection);
    return list.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    }) || null;
  },

  findById: async (collection, id) => {
    const list = readData(collection);
    return list.find(item => item._id === id || item.id === id) || null;
  },

  create: async (collection, doc) => {
    const list = readData(collection);
    const newDoc = {
      _id: generateId(),
      createdAt: new Date().toISOString(),
      ...doc
    };
    list.push(newDoc);
    writeData(collection, list);
    return newDoc;
  },

  findByIdAndUpdate: async (collection, id, updates) => {
    const list = readData(collection);
    const index = list.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    
    // Merge updates
    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeData(collection, list);
    return list[index];
  },

  findByIdAndDelete: async (collection, id) => {
    const list = readData(collection);
    const index = list.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    
    const deleted = list[index];
    list.splice(index, 1);
    writeData(collection, list);
    return deleted;
  },

  // Specialized operations
  updateMany: async (collection, query, updates) => {
    let list = readData(collection);
    let count = 0;
    list = list.map(item => {
      let match = true;
      for (let key in query) {
        if (item[key] !== query[key]) {
          match = false;
          break;
        }
      }
      if (match) {
        count++;
        return { ...item, ...updates, updatedAt: new Date().toISOString() };
      }
      return item;
    });
    writeData(collection, list);
    return { modifiedCount: count };
  }
};

module.exports = localDB;
