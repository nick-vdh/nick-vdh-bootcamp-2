import React, { useEffect, useState } from 'react';
import './App.css';

const sortItems = (items, sortBy) => [...items].sort((first, second) => {
  if (sortBy === 'name') {
    return first.name.localeCompare(second.name) || first.id - second.id;
  }

  if (sortBy === 'due_date') {
    if (!first.due_date && !second.due_date) return first.id - second.id;
    if (!first.due_date) return 1;
    if (!second.due_date) return -1;
    return first.due_date.localeCompare(second.due_date) || first.id - second.id;
  }

  return second.id - first.id;
});

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/items');
        if (!response.ok) throw new Error('Network response was not ok');
        setData(await response.json());
        setError(null);
      } catch (requestError) {
        setError(`Failed to fetch data: ${requestError.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!newItem.trim()) return;

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItem.trim(), due_date: newDueDate || null }),
      });
      if (!response.ok) throw new Error('Failed to add item');
      const createdItem = await response.json();
      setData((items) => [...items, createdItem]);
      setNewItem('');
      setNewDueDate('');
      setError(null);
    } catch (requestError) {
      setError(`Error adding item: ${requestError.message}`);
    }
  };

  const handleEdit = (item) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditDueDate(item.due_date || '');
  };

  const handleUpdate = async (event, itemId) => {
    event.preventDefault();
    if (!editName.trim()) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), due_date: editDueDate || null }),
      });
      if (!response.ok) throw new Error('Failed to update item');
      const updatedItem = await response.json();
      setData((items) => items.map((item) => item.id === itemId ? updatedItem : item));
      setEditingItemId(null);
      setError(null);
    } catch (requestError) {
      setError(`Error updating item: ${requestError.message}`);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');
      setData((items) => items.filter((item) => item.id !== itemId));
      setError(null);
    } catch (requestError) {
      setError(`Error deleting item: ${requestError.message}`);
    }
  };

  const sortedItems = sortItems(data, sortBy);

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of your tasks</p>
      </header>

      <main>
        <section className="add-item-section" aria-labelledby="add-heading">
          <h2 id="add-heading">Add a task</h2>
          <form onSubmit={handleSubmit} className="task-form">
            <div className="form-field">
              <label htmlFor="new-task-name">Task name</label>
              <input
                id="new-task-name"
                type="text"
                value={newItem}
                onChange={(event) => setNewItem(event.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="new-task-due-date">Due date</label>
              <input
                id="new-task-due-date"
                type="date"
                value={newDueDate}
                onChange={(event) => setNewDueDate(event.target.value)}
              />
            </div>
            <button type="submit">Add task</button>
          </form>
        </section>

        <section className="items-section" aria-labelledby="tasks-heading">
          <div className="list-heading">
            <h2 id="tasks-heading">Tasks</h2>
            <div className="sort-control">
              <label htmlFor="sort-tasks">Sort by</label>
              <select id="sort-tasks" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">Recently added</option>
                <option value="due_date">Due date</option>
                <option value="name">Name A to Z</option>
              </select>
            </div>
          </div>
          {loading && <p role="status">Loading tasks...</p>}
          {error && <p className="error" role="alert">{error}</p>}
          {!loading && (sortedItems.length > 0 ? (
            <ul className="task-list">
              {sortedItems.map((item) => (
                <li className="task-row" key={item.id}>
                  {editingItemId === item.id ? (
                    <form className="edit-form" onSubmit={(event) => handleUpdate(event, item.id)}>
                      <div className="form-field">
                        <label htmlFor={`edit-name-${item.id}`}>Edit task name</label>
                        <input
                          id={`edit-name-${item.id}`}
                          type="text"
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`edit-date-${item.id}`}>Edit due date</label>
                        <input
                          id={`edit-date-${item.id}`}
                          type="date"
                          value={editDueDate}
                          onChange={(event) => setEditDueDate(event.target.value)}
                        />
                      </div>
                      <div className="task-actions">
                        <button type="submit">Save changes</button>
                        <button type="button" className="secondary-btn" onClick={() => setEditingItemId(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="task-details">
                        <strong>{item.name}</strong>
                        {item.due_date ? <span>Due: <time dateTime={item.due_date}>{item.due_date}</time></span> : <span className="no-due-date">No due date</span>}
                      </div>
                      <div className="task-actions">
                        <button type="button" className="secondary-btn" aria-label={`Edit ${item.name}`} onClick={() => handleEdit(item)}>Edit</button>
                        <button type="button" className="delete-btn" aria-label={`Delete ${item.name}`} onClick={() => handleDelete(item.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : <p>No tasks found. Add one to get started.</p>)}
        </section>
      </main>
    </div>
  );
}

export default App;