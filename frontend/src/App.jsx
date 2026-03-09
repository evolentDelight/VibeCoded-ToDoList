import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import TaskList from './components/TaskList';
import TaskInput from './components/TaskInput';
import ExportImport from './components/ExportImport';
import { fetchTasks, createTask, updateTask, deleteTask, importTasks } from './api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAdd = async (title) => {
    try {
      const task = await createTask(title);
      setTasks((prev) => [...prev, task]);
    } catch (err) {
      setError(err.message || 'Failed to add task');
    }
  };

  const handleToggle = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      const updated = await updateTask(id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err.message || 'Failed to update task');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    }
  };

  const handleImport = async (importedTasks) => {
    try {
      const result = await importTasks(importedTasks);
      setTasks(result.tasks);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to import tasks');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>To-Do</h1>
        <p className="subtitle">Stay organized, get things done</p>
      </header>

      <main className="main">
        <TaskInput onAdd={handleAdd} disabled={loading} />
        <ExportImport tasks={tasks} onImport={handleImport} disabled={loading} />

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading tasks…</div>
        ) : (
          <TaskList
            tasks={tasks}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
