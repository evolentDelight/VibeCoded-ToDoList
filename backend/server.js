const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/tasks', tasksRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

async function start() {
  if (process.env.DATABASE_URL) {
    try {
      await initDb();
      console.log('PostgreSQL connected');
    } catch (err) {
      console.error('PostgreSQL init failed:', err.message);
    }
  } else {
    console.log('Using file-based storage (set DATABASE_URL for PostgreSQL)');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(console.error);
