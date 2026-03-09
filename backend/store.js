const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadTasks() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading tasks:', err.message);
  }
  return [];
}

function saveTasks(tasks) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving tasks:', err.message);
  }
}

let memoryStore = loadTasks();
let nextId = Math.max(1, ...memoryStore.map(t => t.id || 0)) + 1;

const memoryDb = {
  async getAll() {
    return [...memoryStore];
  },

  async getById(id) {
    return memoryStore.find(t => t.id === parseInt(id, 10)) || null;
  },

  async create(task) {
    const newTask = {
      id: nextId++,
      title: task.title,
      completed: task.completed || false,
      created_at: new Date().toISOString(),
    };
    memoryStore.push(newTask);
    saveTasks(memoryStore);
    return newTask;
  },

  async update(id, updates) {
    const idx = memoryStore.findIndex(t => t.id === parseInt(id, 10));
    if (idx === -1) return null;
    memoryStore[idx] = { ...memoryStore[idx], ...updates };
    saveTasks(memoryStore);
    return memoryStore[idx];
  },

  async delete(id) {
    const idx = memoryStore.findIndex(t => t.id === parseInt(id, 10));
    if (idx === -1) return false;
    memoryStore.splice(idx, 1);
    saveTasks(memoryStore);
    return true;
  },

  async replaceAll(tasks) {
    nextId = Math.max(1, ...tasks.map(t => t.id || 0)) + 1;
    memoryStore = tasks.map((t, i) => ({
      id: t.id || i + 1,
      title: t.title || '',
      completed: Boolean(t.completed),
      created_at: t.created_at || new Date().toISOString(),
    }));
    saveTasks(memoryStore);
    return memoryStore;
  },
};

module.exports = memoryDb;
