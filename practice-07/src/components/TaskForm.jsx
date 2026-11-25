import { useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';

function buildInitialDraft(initialTask, categories) {
  if (initialTask) {
    return {
      title: initialTask.title,
      priority: initialTask.priority,
      categoryId: String(initialTask.categoryId),
    };
  }
  return {
    title: '',
    priority: 'medium',
    categoryId: categories.length > 0 ? String(categories[0].id) : '',
  };
}

export default function TaskForm({ categories, initialTask, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => buildInitialDraft(initialTask, categories));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [saveError, setSaveError] = useState('');

  const isEditing = initialTask !== null;

  const updateField = (key, value) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    setSaveError('');
    setStatus('');

    const result = validateTaskDraft(draft, categories);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    const accepted = onSave(result.value);
    if (accepted) {
      setStatus(isEditing ? 'Изменения сохранены' : 'Задача создана');
      if (!isEditing) {
        setDraft(buildInitialDraft(null, categories));
      }
    } else {
      setSaveError('Не удалось сохранить задачу. Возможно, запись уже удалена.');
    }
  };

  const handleCancel = () => {
    setErrors({});
    setSaveError('');
    setStatus('');
    onCancel();
  };

  return (
    <form className="task-form" noValidate onSubmit={handleSubmit}>
      <h2>{isEditing ? 'Редактирование задачи' : 'Новая задача'}</h2>

      <div className="task-form__field">
        <label htmlFor="form-title">Название</label>
        <input
          id="form-title"
          type="text"
          value={draft.title}
          onChange={e => updateField('title', e.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'form-title-error' : undefined}
        />
        {errors.title && (
          <p id="form-title-error" className="task-form__error" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      <div className="task-form__field">
        <label htmlFor="form-priority">Приоритет</label>
        <select
          id="form-priority"
          value={draft.priority}
          onChange={e => updateField('priority', e.target.value)}
          aria-invalid={Boolean(errors.priority)}
          aria-describedby={errors.priority ? 'form-priority-error' : undefined}
        >
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        {errors.priority && (
          <p id="form-priority-error" className="task-form__error" role="alert">
            {errors.priority}
          </p>
        )}
      </div>

      <div className="task-form__field">
        <label htmlFor="form-category">Категория</label>
        <select
          id="form-category"
          value={draft.categoryId}
          onChange={e => updateField('categoryId', e.target.value)}
          aria-invalid={Boolean(errors.categoryId)}
          aria-describedby={errors.categoryId ? 'form-category-error' : undefined}
        >
          {categories.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        {errors.categoryId && (
          <p id="form-category-error" className="task-form__error" role="alert">
            {errors.categoryId}
          </p>
        )}
      </div>

      <div className="task-form__actions">
        <button type="submit">{isEditing ? 'Сохранить' : 'Создать'}</button>
        {isEditing && (
          <button type="button" onClick={handleCancel}>Отмена</button>
        )}
      </div>

      {status && <p className="task-form__status" role="status">{status}</p>}
      {saveError && <p className="task-form__error" role="alert">{saveError}</p>}
    </form>
  );
}