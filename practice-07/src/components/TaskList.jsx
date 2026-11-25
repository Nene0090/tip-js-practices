import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete }) {
  const categoryNameById = new Map(categories.map(c => [c.id, c.name]));

  return (
    <section className="task-list">
      <p className="task-list__count">Найдено: {tasks.length}</p>
      {tasks.length === 0 ? (
        <p className="task-list__empty">Задач по выбранным условиям нет</p>
      ) : (
        <ul className="task-list__items">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              categoryName={categoryNameById.get(task.categoryId) ?? 'Без категории'}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}