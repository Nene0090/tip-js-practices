import { useState } from 'react';
import { tasks as initialTasks, categories } from './data.js';
import { createInitialFilters } from './variant.js';
import {
  selectTasks,
  getTaskStats,
  addTask,
  updateTask,
  toggleTask,
  removeTask,
} from './domain/task-service.js';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';

export default function App() {
  const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);

  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);
  const editingTask = editingId === null
    ? null
    : tasks.find(task => task.id === editingId) ?? null;

  const handleToggle = id => {
    setTasks(previous => toggleTask(previous, id));
  };

  const handleDelete = id => {
    if (!window.confirm('Удалить задачу?')) return;
    setTasks(previous => removeTask(previous, id));
    if (editingId === id) setEditingId(null);
  };

  const handleEdit = id => {
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = value => {
    if (editingId === null) {
      let accepted = false;
      setTasks(previous => {
        const maxId = previous.reduce((max, t) => (t.id > max ? t.id : max), 0);
        const nextId = maxId + 1;
        accepted = true;
        return addTask(previous, value, nextId);
      });
      return accepted;
    }

    if (editingTask === null) return false;
    setTasks(previous => updateTask(previous, editingId, value));
    setEditingId(null);
    return true;
  };

  return (
    <main>
      <h1>Задачи на React</h1>
      <p>ПР7: данные в памяти. Обновление страницы восстанавливает исходный набор.</p>

      <TaskStats stats={stats} />

      <TaskFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />

      <TaskForm
        key={editingId ?? 'new'}
        categories={categories}
        initialTask={editingTask}
        onSave={handleSave}
        onCancel={handleCancelEdit}
      />

      <TaskList
        tasks={visibleTasks}
        categories={categories}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}