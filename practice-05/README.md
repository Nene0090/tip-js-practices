# Практическая работа № 5

## Автор и вариант

- Имя: Мария
- Группа: эФБО-06-25
- Вариант: 6 

## Окружение

- ОС: Windows 11 Pro 23H2
- Node.js: v24.11.1
- npm: 11.6.1
- Git: 2.47.0

Запуск API: npm start → http://127.0.0.1:5505/api
Клиент: npm run client
Примеры: npm run example:order, npm run example:fetch
Проверки: npm test (последовательно check:api, check:client, check:integration)

## 1. Команды запуска

cd practice-05
npm run check:api
npm start
npm run client
npm run example:order
npm run example:fetch
npm test

Первый терминал остаётся занят npm start, во втором выполняются npm run client и примеры. Остановка сервера — Ctrl+C.

## 2. Эксперимент с очередями (examples/event-loop.js)

Прогноз до запуска: A, B, C, D, E, F.

Фактический вывод npm run example:order:

A: синхронный код
B: начало async-функции
C: конец синхронного кода
D: обработчик Promise
E: продолжение после await
F: задача таймера

Объяснение:

A — синхронное выражение в текущем стеке.
B — вызов demonstrateAwait() выполняется синхронно до первого await.
C — последнее синхронное выражение модуля.
D — микрозадача из Promise.resolve().then(...).
E — продолжение async-функции после await null — тоже микрозадача, поставленная в очередь после D.
F — задача таймера: setTimeout(..., 0) означает минимальную задержку постановки задачи, а не немедленный вызов. Выполняется после всех микрозадач.

Собственный обработчик: добавлен ещё один Promise.resolve().then(() => log("G: дополнительный обработчик")) перед demonstrateAwait(). Прогноз: A, B, C, D, G, E, F. Факт совпал: дополнительный обработчик встал в очередь микрозадач после D, но до продолжения async.

## 3. Наблюдение за HTTP (examples/fetch-basics.js)

Запрос: GET /tasks?completed=false&priority=high при запущенном API.

| Параметр | Значение |
|---|---|
| status | 200 |
| ok | true |
| content-type | application/json; charset=utf-8 |
| ids | [4, 13, 34] |
| meta.total | 3 |
| meta.filters.completed | false |
| meta.filters.priority | high |

Дополнительно вручную через fetch/браузер:

| Запрос | status | ok | content-type | Форма тела |
|---|---|---|---|---|
| /health | 200 | true | application/json | { data: { status: "ok" } } |
| /tasks | 200 | true | application/json | { data: [...12], meta: {...} } |
| /tasks?completed=false&priority=high | 200 | true | application/json | { data: [...3], meta: {...} } |
| /tasks/25 | 200 | true | application/json | { data: { id: 25, ... } } |
| /tasks/999 | 404 | false | application/json | { error: { code: "TASK_NOT_FOUND", details: { id: 999 } } } |
| /categories | 200 | true | application/json | { data: [...3], meta: { total: 3 } } |

Пример fetch-basics.js не переносится в рабочие модули — он нужен только для наблюдения за Response.

## 4. Распределение ответственности модулей

| Файл | Ответственность | Чего в нём нет |
|---|---|---|
| api/data.js | Контрольные задачи и категории | Логика маршрутов |
| api/server.mjs | HTTP-инфраструктура, маршруты, фильтры, ошибки | Клиентский код |
| src/api-client.js | buildUrl, ApiError, createApiClient, requestJson | Знание о задачах |
| src/task-api.js | Маршруты задач/категорий, проверка схемы, loadInitialData | fetch, Response |
| src/variant.js | Номер и фильтры варианта | Логика |
| src/main.js | Контрольный консольный сценарий | Транспорт и схема |
| examples/* | Наблюдение за очередями и HTTP | Прикладной код |
| checks/* | Автоматические сценарии | Продакшен-логика |

api-client.js не знает, что такое задача. task-api.js не вызывает fetch напрямую. Это разделение позволяет позже подключить DOM-интерфейс ПР6 без копирования транспорта.

## 5. Общий и предметный клиент

buildUrl(baseUrl, path, query) — формирует абсолютный URL:

соединяет baseUrl и path без двойного слеша;
кодирует значения через URLSearchParams;
пропускает undefined, null и "";
сохраняет false и 0;
не мутирует входной query;
отклоняет относительный baseUrl, не-http(s) схему и baseUrl с query/hash.

createApiClient({ baseUrl, fetchFn, timeoutMs }):

проверяет конфигурацию при создании;
requestJson(path, { query, signal, timeoutMs }) формирует URL, выполняет GET с Accept: application/json;
объединяет внешний сигнал и AbortSignal.timeout через AbortSignal.any;
отдельно обрабатывает отказ fetch (network/timeout/aborted) и полученный Response;
при HTTP-ошибке создаёт ApiError вида http с status, code, details, url;
для 204 возвращает null;
проверяет Content-Type перед response.json();
ошибки разбора или схемы — invalid-response.

createTaskApi(client):

проверяет наличие client.requestJson;
нормализует фильтры до запроса (только completed, priority, categoryId, q);
getTasks(filters) → { tasks, meta };
getTaskById(id) → задача;
getCategories() → массив категорий;
loadInitialData(filters) → Promise.all для задач и категорий, возвращает { tasks, categories, meta };
после запроса проверяет схему и уникальность id, meta.total === data.length;
неверная схема → ApiError с kind: "invalid-response".

## 6. Классификация ошибок

| kind | Причина | Поля |
|---|---|---|
| http | статус вне 2xx | status, code, details, url |
| network | ответ не получен (сервер недоступен, ошибка соединения) | cause, url |
| invalid-response | неверный Content-Type, битый JSON, неверная схема, не Response | cause, url |
| timeout | истекло timeoutMs | cause, url |
| aborted | внешний AbortSignal отменил запрос | cause, url |

HTTP-ошибка не превращается в network: вызов fetchFn обёрнут отдельно, а обработка Response выполняется после. Текст сообщения сервера сохраняется, но проверки строятся по code и status.

## 7. Сравнение последовательного и параллельного ожидания

Эксперимент с /debug/delay?ms=150, три замера.

| Подход | Замер 1 | Замер 2 | Замер 3 | Среднее |
|---|---|---|---|---|
| Последовательно (await друг за другом) | 304 мс | 305 мс | 303 мс | ~304 мс |
| Параллельно (Promise.all) | 152 мс | 151 мс | 153 мс | ~152 мс |

Promise.all сам не создаёт параллельность — он ожидает уже запущенные Promise. Выигрыш достигается за счёт старта обоих запросов до общего await. Искусственные задержки в итоговую реализацию не включены.

## 8. Общий сценарий npm run client

При запущенном API и фильтрах варианта 6 { categoryId: 2 }:

ПР5, вариант 6
API: http://127.0.0.1:5505/api
Фильтры варианта: {"categoryId":2}

1. /health: { data: { status: 'ok' } }
2. Задачи по фильтру варианта:
   URL: /tasks {"categoryId":2}
   id: [ 4, 16, 22, 25, 28, 34 ]
   meta.total: 6
   совпадение с ожиданием: true
3. Категории: [ { id: 1, name: 'Учёба' }, { id: 2, name: 'Проект' }, { id: 3, name: 'Организация' } ]
4. Задача 999: ожидаемая ошибка
   kind: http
   status: 404
   code: TASK_NOT_FOUND
5. loadInitialData:
   tasks: [ 4, 16, 22, 25, 28, 34 ]
   categories: [ 1, 2, 3 ]
   meta.total: 6

Остановка API и повторный npm run client:

1. /health: ошибка network Не удалось выполнить сетевой запрос
2. Задачи по фильтру варианта: ошибка network ...

После повторного npm start запросы снова выполняются.

## 9. Индивидуальный сценарий (вариант 6)

src/variant.js:

export const variantNumber = 6;
export const variantFilters = { categoryId: 2 };

| Параметр | Значение |
|---|---|
| Сформированный URL | http://127.0.0.1:5505/api/tasks?categoryId=2 |
| Фильтр | categoryId: 2 — только задачи категории «Проект» |
| Ожидаемые id (таблица п. 8) | [4, 16, 22, 25, 28, 34] |
| Фактические id | [4, 16, 22, 25, 28, 34] |
| meta.total | 6 |
| Совпадение | да |

Объяснение фильтра: categoryId: 2 передаётся в URL как query-параметр; сервер отбирает задачи, у которых categoryId === 2. Значение 2 сохраняется, потому что buildUrl пропускает только undefined, null и "", — 2 проходит как есть.

## 10. Фактический вывод проверок

### 10.1. npm run check:api

OK: 01. health возвращает состояние API и обязательные заголовки
OK: 02. список задач сохраняет контрольный порядок
OK: 03. completed=false отбирает невыполненные задачи
OK: 04. несколько фильтров применяются совместно
OK: 05. q выполняет регистронезависимый поиск по названию
OK: 06. пустой q не отбирает задачи
OK: 07. неверное значение completed даёт JSON-ошибку 400
OK: 08. неизвестный и повторяющийся параметры отклоняются
OK: 09. задача запрашивается по положительному id
OK: 10. отсутствующая задача даёт структурированную ошибку 404
OK: 11. неверный формат id даёт ошибку 400
OK: 12. API возвращает категории
OK: 13. категория запрашивается по id, отсутствие даёт 404
OK: 14. HEAD возвращает заголовки без тела
OK: 15. OPTIONS сообщает правила CORS
OK: 16. неподдерживаемый метод даёт 405 и Allow
OK: 17. неизвестный маршрут даёт ошибку 404
OK: 18. отладочные маршруты воспроизводят 503, не-JSON и задержку

Итог API: успешно 18, ошибок 0.

### 10.2. npm run check:client

OK: 01. buildUrl соединяет baseUrl и путь без двойного слеша
OK: 02. buildUrl кодирует параметры и сохраняет false и 0
OK: 03. buildUrl не изменяет входной объект query
OK: 04. createApiClient проверяет конфигурацию
OK: 05. requestJson выполняет GET с Accept и signal
OK: 06. requestJson возвращает разобранный JSON успешного ответа
OK: 07. успешный ответ 204 преобразуется в null
OK: 08. JSON-ошибка 404 преобразуется в ApiError с полями контракта
OK: 09. HTTP-ошибка без JSON сохраняет приоритет статуса
OK: 10. успешный ответ с неверным Content-Type отклоняется
OK: 11. повреждённый JSON успешного ответа отклоняется
OK: 12. значение вместо Response отклоняется как неверный ответ
OK: 13. сетевая ошибка преобразуется и сохраняется как cause
OK: 14. превышение времени запроса имеет kind timeout
OK: 15. внешний AbortSignal отличает отмену от тайм-аута
OK: 16. ApiError от обработки ответа не маскируется как network
OK: 17. createTaskApi требует requestJson
OK: 18. getTasks нормализует допустимые фильтры
OK: 19. getTasks отклоняет неверные и неизвестные фильтры до запроса
OK: 20. getTaskById проверяет id и путь
OK: 21. getCategories возвращает проверенный массив
OK: 22. ответы задач проверяются по схеме
OK: 23. коллекция задач отклоняет повторяющиеся id и неверный meta.total
OK: 24. одиночная задача и категории проверяются по схеме
OK: 25. loadInitialData начинает два независимых запроса параллельно
OK: 26. loadInitialData передаёт отказ одного из запросов вызывающему коду

Итог клиента: успешно 26, ошибок 0.

### 10.3. npm run check:integration

OK: 01. клиент получает полный список от реального API
OK: 02. логические false и несколько фильтров доходят до API
OK: 03. строка поиска кодируется и обрабатывается
OK: 04. клиент получает одну задачу
OK: 05. клиент получает категории
OK: 06. параллельная начальная загрузка собирает общий результат
OK: 07. ошибка 404 сохраняет код и детали API
OK: 08. ошибка запроса 400 не считается сетевой
OK: 09. ошибка сервера 503 сохраняет вид http
OK: 10. повреждённый JSON определяется как invalid-response
OK: 11. неожиданный Content-Type определяется как invalid-response
OK: 12. медленный ответ прерывается по тайм-ауту
OK: 13. внешний AbortController отменяет реальный запрос

Итог интеграции: успешно 13, ошибок 0.

## 11. Собственные проверки

### 11.1. Собственная комбинация query-параметров

Исходное состояние: API запущен, ключевых данных нет.
Действия: запрос GET /api/tasks?completed=false&categoryId=2&priority=high.
Ожидание: возвращаются только задачи категории 2, невыполненные, с high. Для контрольного набора это [4, 34], meta.total === 2.
Факт: ids: [4, 34], meta.total: 2, meta.filters содержит все три параметра.
Итог: пройдено. Дополнительно проверено, что false не превращается в "false" и доходит до сервера.

### 11.2. Дополнительный ошибочный HTTP-сценарий

Исходное состояние: API запущен.
Действия: client.requestJson("/tasks/999") и client.requestJson("/debug/error").
Ожидание: первый → ApiError с kind: "http", status: 404, code: "TASK_NOT_FOUND", details: { id: 999 }. Второй → kind: "http", status: 503, code: "SERVICE_UNAVAILABLE". Ни один не network.
Факт: оба вернули ожидаемые значения; details и code сохранились; message содержит серверный текст.
Итог: пройдено.

### 11.3. Граница отмены и тайм-аута

Исходное состояние: API запущен.
Действия:
requestJson("/debug/delay", { query: { ms: 150 }, timeoutMs: 20 });
const c = new AbortController(); const p = requestJson("/debug/delay", { query: { ms: 150 }, signal: c.signal, timeoutMs: 1000 }); c.abort(); await p;
Ожидание: первый → kind: "timeout", второй → kind: "aborted". Оба не network.
Факт: первый — timeout, второй — aborted. cause сохранён.
Итог: пройдено. Дополнительно проверено, что при одновременном срабатывании тайм-аута и внешнего сигнала kind соответствует первопричине.

## 12. Отладка

В src/api-client.js в requestJson поставлен console.log({ url, effectiveTimeout, hasExternalSignal: Boolean(signal) }) — зафиксирован сформированный URL и сигнал для варианта 6: http://127.0.0.1:5505/api/tasks?categoryId=2, effectiveTimeout: 2000, hasExternalSignal: false.
В src/task-api.js в getTasks зафиксированы нормализованные фильтры до запроса и meta.total после: { categoryId: 2 } → 6.
Для сценария 999 в src/main.js выведены kind, status, code, details — подтверждено, что ошибка не классифицируется как network.
Для тайм-аута и отмены проверено, что cause содержит TimeoutError и AbortError соответственно.

## 13. Вывод

В ходе работы освоены:

порядок синхронного кода, микрозадач Promise и задач таймеров;
async/await без потери ошибок, Promise.all для независимых запросов;
различение успешного ответа, HTTP-ошибки, сетевой ошибки и неверного формата;
формирование URL через URL и URLSearchParams;
проверка Response.ok, статуса и Content-Type до использования данных;
ограничение времени через AbortSignal.timeout и отмена через AbortController;
разделение общего HTTP-клиента и предметного API;
проверка клиента без сети и вместе с локальным API.

Все обязательные проверки пройдены: check:api — 18/0, check:client — 26/0, check:integration — 13/0. Вариант 6 ({ categoryId: 2 }) возвращает [4, 16, 22, 25, 28, 34], meta.total = 6, что совпадает с таблицей методички. Собственные проверки подтверждают комбинацию фильтров, дополнительный ошибочный сценарий и границу отмены/тайм-аута.
