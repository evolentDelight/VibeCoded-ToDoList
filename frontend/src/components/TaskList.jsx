import React from 'react';

function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="task-list empty">
        <p>No tasks yet. Add one above.</p>
      </div>
    );
  }

  return (
    <ul className="task-list" role="list">
      {tasks.map((task) => (
        <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
          <label className="task-label">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggle(task.id)}
              aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
            />
            <span className="task-title">{task.title}</span>
          </label>
          <button
            type="button"
            className="task-delete"
            onClick={() => onDelete(task.id)}
            aria-label={`Delete "${task.title}"`}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

export default TaskList;
