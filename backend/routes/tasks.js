const express = require('express');
const router = express.Router();
const { getPool, initDb } = require('../db');
const memoryStore = require('../store');

async function getDb() {
  const pool = getPool();
  if (pool) {
    return {
      async getAll() {
        const result = await pool.query('SELECT id, title, completed, created_at FROM tasks ORDER BY id');
        return result.rows.map(r => ({
          id: r.id,
          title: r.title,
          completed: r.completed,
          created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
        }));
      },
      async getById(id) {
        const result = await pool.query('SELECT id, title, completed, created_at FROM tasks WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;
        const r = result.rows[0];
        return { id: r.id, title: r.title, completed: r.completed, created_at: r.created_at ? new Date(r.created_at).toISOString() : null };
      },
      async create(task) {
        const result = await pool.query(
          'INSERT INTO tasks (title, completed) VALUES ($1, $2) RETURNING id, title, completed, created_at',
          [task.title, task.completed || false]
        );
        const r = result.rows[0];
        return { id: r.id, title: r.title, completed: r.completed, created_at: r.created_at ? new Date(r.created_at).toISOString() : null };
      },
      async update(id, updates) {
        const result = await pool.query(
          'UPDATE tasks SET title = COALESCE($2, title), completed = COALESCE($3, completed) WHERE id = $1 RETURNING id, title, completed, created_at',
          [id, updates.title, updates.completed]
        );
        if (result.rows.length === 0) return null;
        const r = result.rows[0];
        return { id: r.id, title: r.title, completed: r.completed, created_at: r.created_at ? new Date(r.created_at).toISOString() : null };
      },
      async delete(id) {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        return result.rowCount > 0;
      },
      async replaceAll(tasks) {
        await pool.query('DELETE FROM tasks');
        const inserted = [];
        for (const t of tasks) {
          const r = await pool.query(
            'INSERT INTO tasks (title, completed) VALUES ($1, $2) RETURNING id, title, completed, created_at',
            [t.title || '', t.completed || false]
          );
          inserted.push({
            id: r.rows[0].id,
            title: r.rows[0].title,
            completed: r.rows[0].completed,
            created_at: r.rows[0].created_at ? new Date(r.rows[0].created_at).toISOString() : null,
          });
        }
        return inserted;
      },
    };
  }
  return memoryStore;
}

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const tasks = await db.getAll();
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const task = await db.getById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const db = await getDb();
    const task = await db.create({ title: title.trim(), completed: false });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const task = await db.update(req.params.id, req.body);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const ok = await db.delete(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'tasks array is required' });
    }
    const db = await getDb();
    const normalized = tasks.map(t => ({
      title: String(t.title || t.Task || '').trim(),
      completed: Boolean(t.completed ?? t.Completed ?? t.Done ?? false),
    })).filter(t => t.title);
    const result = await db.replaceAll(normalized.map((t, i) => ({ ...t, id: i + 1 })));
    res.json({ imported: result.length, tasks: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to import tasks' });
  }
});

module.exports = router;
