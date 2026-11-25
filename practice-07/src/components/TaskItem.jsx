const PRIORITY_LABELS = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
  return (
    <li className={`task-item ${task.completed ? 'task-item--done' : ''}`}>
      <div className="task-item__main">
        <h3 className="task-item__title">{task.title}</h3>
        <p className="task-item__meta">
          <span>Статус: {task.completed ? 'Выполнена' : 'В работе'}</span>
          <span>Приоритет: {PRIORITY_LABELS[task.priority] ?? task.priority}</span>
          <span>Категория: {categoryName}</span>
        </p>
      </div>
      <div className="task-item__actions">
        <button type="button" onClick={() => onToggle(task.id)}>
          {task.completed ? 'Вернуть в работу' : 'Завершить'}
        </button>
        <button type="button" onClick={() => onEdit(task.id)}>Редактировать</button>
        <button type="button" onClick={() => onDelete(task.id)}>Удалить</button>
      </div>
    </li>
  );
}