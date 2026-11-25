export default function TaskStats({ stats }) {
  return (
    <section className="task-stats" aria-label="Статистика задач">
      <p>Всего: <strong>{stats.total}</strong></p>
      <p>Выполнено: <strong>{stats.completed}</strong></p>
      <p>В работе: <strong>{stats.active}</strong></p>
    </section>
  );
}