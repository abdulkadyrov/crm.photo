# Тестирование

Добавлены первые тесты:

- `tests/unit/file-system-service.test.mjs`
- `tests/unit/archive-service.test.mjs`
- `tests/unit/integrity-service.test.mjs`
- `tests/unit/backup-service.test.mjs`
- `tests/unit/conflict-service.test.mjs`
- `tests/unit/db.test.mjs`
- `tests/unit/export-filter-service.test.mjs`
- `tests/unit/fixture-factory.test.mjs`
- `tests/unit/import-preflight-service.test.mjs`
- `tests/unit/list-performance-service.test.mjs`
- `tests/unit/migrations.test.mjs`
- `tests/unit/object-url-service.test.mjs`
- `tests/unit/service-worker-cache.test.mjs`
- `tests/unit/transfer-merge-service.test.mjs`
- `tests/unit/photographer-analytics-service.test.mjs`
- `tests/integration/repositories.test.mjs`
- `tests/integration/reshoot-roundtrip.test.mjs`
- `tests/e2e/manual-smoke.md`

Команды:

```bash
npm test
npm run check
```

Ручная приёмка повторной съёмки фотографа описана в `docs/photographer-reshoot-acceptance.md`.

Дальнейший минимум:

- e2e: первый запуск, владелец, проект, класс, ученик, услуга, медиа, экспорт, импорт;
- integration: старый архив, повреждённый архив, повторная миграция, отмена импорта;
- unit: фильтры экспорта, конфликты, подсчёт сущностей, обратная совместимость.
