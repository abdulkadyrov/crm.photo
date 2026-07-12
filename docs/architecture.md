# Архитектура

Vakha Studio остаётся офлайн-ориентированным статическим PWA без обязательного сервера и Supabase. Главный принцип модернизации: strangler-refactoring вокруг `js/core/legacy-app.js`.

Текущая точка входа: `index.html` -> `js/core/app.js` -> `js/core/legacy-app.js`.

Целевая структура уже подготовлена частично:

- `js/data/` - единая точка доступа к IndexedDB и репозитории.
- `js/services/` - чистые сервисы для архивов, checksum, backup, File System Access.
- `js/features/` - будущие экранные модули по подсистемам.
- `js/workers/` - места для ZIP, checksum, image и PDF workers.
- `tests/` - unit, integration и будущие e2e.

Правило переноса: тест существующего сценария -> модуль -> подключение через прежний интерфейс -> проверка -> только потом удаление кода из legacy.

