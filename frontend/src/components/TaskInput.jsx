import React, { useState } from 'react';

function TaskInput({ onAdd, disabled }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onAdd(trimmed);
      setValue('');
    }
  };

  return (
    <form className="task-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What needs to be done?"
        disabled={disabled}
        aria-label="New task title"
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Add
      </button>
    </form>
  );
}

export default TaskInput;
