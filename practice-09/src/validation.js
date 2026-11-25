import { ApiError } from './errors.js';

const ALLOWED_PARAMS = new Set(['completed', 'priority', 'categoryId', 'q']);
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high']);
const MAX_Q_LENGTH = 100;

export function parsePositiveId(raw) {
  if (typeof raw !== 'string') return null;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

export function parseFilters(searchParams) {
  for (const name of searchParams.keys()) {
    if (!ALLOWED_PARAMS.has(name)) {
      throw new ApiError(400, 'INVALID_QUERY', `Неизвестный параметр: ${name}.`);
    }
  }

  const completedRaw = searchParams.getAll('completed');
  const priorityRaw = searchParams.getAll('priority');
  const categoryIdRaw = searchParams.getAll('categoryId');
  const qRaw = searchParams.getAll('q');

  for (const list of [completedRaw, priorityRaw, categoryIdRaw, qRaw]) {
    if (list.length > 1) {
      throw new ApiError(400, 'INVALID_QUERY', 'Повторяющийся параметр запроса.');
    }
  }

  let completed = null;
  if (completedRaw.length === 1) {
    const value = completedRaw[0];
    if (value === 'true') completed = true;
    else if (value === 'false') completed = false;
    else throw new ApiError(400, 'INVALID_QUERY', 'Некорректное значение completed.');
  }

  let priority = null;
  if (priorityRaw.length === 1) {
    const value = priorityRaw[0];
    if (!ALLOWED_PRIORITIES.has(value)) {
      throw new ApiError(400, 'INVALID_QUERY', 'Некорректное значение priority.');
    }
    priority = value;
  }

  let categoryId = null;
  if (categoryIdRaw.length === 1) {
    const raw = categoryIdRaw[0];
    if (!/^[1-9]\d*$/.test(raw)) {
      throw new ApiError(400, 'INVALID_QUERY', 'Некорректное значение categoryId.');
    }
    const value = Number(raw);
    if (!Number.isSafeInteger(value)) {
      throw new ApiError(400, 'INVALID_QUERY', 'Некорректное значение categoryId.');
    }
    categoryId = value;
  }

  let q = '';
  if (qRaw.length === 1) {
    q = qRaw[0].trim();
    if (q.length > MAX_Q_LENGTH) {
      throw new ApiError(400, 'INVALID_QUERY', 'Слишком длинный поисковый запрос.');
    }
  }

  return { completed, priority, categoryId, q };
}