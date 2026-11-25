export default function TaskFilters({ filters, categories, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <section className="task-filters" aria-label="Фильтры">
      <div className="task-filters__field">
        <label htmlFor="filter-q">Поиск по названию</label>
        <input
          id="filter-q"
          type="text"
          value={filters.q}
          onChange={e => update('q', e.target.value)}
        />
      </div>

      <div className="task-filters__field">
        <label htmlFor="filter-completed">Статус</label>
        <select
          id="filter-completed"
          value={filters.completed}
          onChange={e => update('completed', e.target.value)}
        >
          <option value="">Все</option>
          <option value="true">Выполненные</option>
          <option value="false">В работе</option>
        </select>
      </div>

      <div className="task-filters__field">
        <label htmlFor="filter-priority">Приоритет</label>
        <select
          id="filter-priority"
          value={filters.priority}
          onChange={e => update('priority', e.target.value)}
        >
          <option value="">Все</option>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
      </div>

      <div className="task-filters__field">
        <label htmlFor="filter-category">Категория</label>
        <select
          id="filter-category"
          value={filters.categoryId}
          onChange={e => update('categoryId', e.target.value)}
        >
          <option value="">Все</option>
          {categories.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => onChange({ q: '', completed: '', priority: '', categoryId: '' })}
      >
        Сбросить фильтры
      </button>
    </section>
  );
}