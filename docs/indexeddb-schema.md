# IndexedDB Schema

База: `school-photo-flow`. Текущая версия: `6`.

Stores:

- `projects`
- `classes`
- `students`
- `orders`
- `media`
- `operators`
- `operatorEvents`
- `templates`
- `settings`
- `catalog`
- `albumProjects`
- `albumClasses`
- `albumStudents`
- `albumGroupMedia`
- `albumTeachers`
- `albumMedia`
- `finalWorks`
- `documents`

Все stores сейчас используют `keyPath: "id"`. Новые обращения должны идти через `js/data/db.js` и `js/data/repositories/*`. Экранные модули не должны открывать транзакции напрямую после переноса.

Первый шов переноса выполнен: `legacy-app.js` больше не вызывает `indexedDB.open()` напрямую, а открывает базу через `openVakhaDb()` из `js/data/db.js`.
