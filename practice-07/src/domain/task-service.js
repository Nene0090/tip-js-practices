export function validateTaskDraft(draft, categories) {
  const errors = {};
  let title = '';

  if (typeof draft?.title !== 'string') {
    errors.title = 'Название обязательно';
  } else {
    title = draft.title.trim();
    if (title.length === 0) {
      errors.title = 'Название не может быть пустым';
    } else if (title.length > 100) {
      errors.title = 'Название не должно превышать 100 символов';
    }
  }

  const priority = draft?.priority;
  if (!['low', 'medium', 'high'].includes(priority)) {
    errors.priority = 'Выберите корректный приоритет';
  }

  let categoryId = NaN;
  const rawCategory = draft?.categoryId;
  if (typeof rawCategory === 'string' && /^\d+$/.test(rawCategory)) {
    categoryId = Number(rawCategory);
  } else if (typeof rawCategory === 'number' && Number.isInteger(rawCategory)) {
    categoryId = rawCategory;
  }
  if (!Number.isInteger(categoryId) || !categories.some(c => c.id === categoryId)) {
    errors.categoryId = 'Выберите существующую категорию';
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    value: { title, priority, categoryId },
    errors,
  };
}

export function selectTasks(tasks, filters) {
  const q = typeof filters?.q === 'string' ? filters.q.trim().toLowerCase() : '';
  const completed = filters?.completed ?? '';
  const priority = filters?.priority ?? '';
  const categoryId = filters?.categoryId ?? '';

  return tasks.filter(task => {
    if (q !== '' && !task.title.toLowerCase().includes(q)) return false;
    if (completed === 'true' && task.completed !== true) return false;
    if (completed === 'false' && task.completed !== false) return false;
    if (priority !== '' && task.priority !== priority) return false;
    if (categoryId !== '' && String(task.categoryId) !== String(categoryId)) return false;
    return true;
  });
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  return { total, completed, active: total - completed };
}

export function addTask(tasks, value, id) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('id должен быть положительным целым');
  }
  if (tasks.some(t => t.id === id)) {
    throw new Error('id уже занят');
  }
  const newTask = {
    id,
    title: value.title,
    completed: false,
    priority: value.priority,
    categoryId: value.categoryId,
  };
  return [...tasks, newTask];
}

export function updateTask(tasks, id, value) {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return tasks;
  const next = tasks.slice();
  next[index] = {
    ...tasks[index],
    title: value.title,
    priority: value.priority,
    categoryId: value.categoryId,
  };
  return next;
}

export function toggleTask(tasks, id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return tasks;
  const next = tasks.slice();
  next[index] = { ...tasks[index], completed: !tasks[index].completed };
  return next;
}

export function removeTask(tasks, id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return tasks;
  return tasks.filter(t => t.id !== id);
}