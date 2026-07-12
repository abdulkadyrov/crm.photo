# Текущая функциональная матрица Vakha Studio

Дата фиксации: 2026-07-12. Основание: `STATUS_REPORT_2026-07-12.txt` и текущий код `js/core/legacy-app.js`.

| Функция | Маршрут | IndexedDB stores | Основные действия | Импорт/экспорт | Состояние | Автотест | Ручной тест |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Первый запуск и демо | home/settings | settings, projects, classes, students, catalog, templates | Инициализация владельца, демо-данные | Входит в полный экспорт | Реализовано | Планируется integration | Первый запуск на чистой базе |
| Операторы и роли | profile/settings | operators, operatorEvents, settings | Владелец, вход по коду, включение/отключение, журнал | ZIP операторов, рабочая конфигурация | Реализовано | Планируется unit/integration | Создать владельца и оператора |
| Проекты | home/classes | projects, classes, students, media, orders | Создание, выбор, статистика | Экспорт/импорт проекта | Реализовано | Планируется e2e | Создать проект и открыть |
| Классы и группы | classes | classes, students, media, orders | Создание, сортировка, переименование, статистика | Экспорт/импорт класса | Реализовано | Планируется e2e | Создать класс, добавить учеников |
| Ученики | student/classes/search | students, orders, media, finalWorks, documents | Создание, карточка, оплата, статус, услуги | Экспорт ученика | Реализовано | Планируется e2e | Добавить ученика и услугу |
| Каталог услуг | settings/services/catalog | catalog, settings, templates | Категории, аудитории, референсы, массовое назначение | ZIP услуг, публичный каталог | Реализовано | Планируется unit/e2e | Создать услугу и назначить |
| Чеклисты | settings/student | templates, orders, students | Шаблон, применение, отметка выполнения | Входит в backup | Реализовано | Планируется integration | Изменить шаблон, проверить заказ |
| Съёмочный поток | scan/student | students, orders, media, operatorEvents | Захват, импорт фото, очередь задач | Импорт папки/ZIP съёмки | Реализовано, требует ручной проверки | Планируется e2e | Камера и импорт на телефоне |
| QR-сканер и QR-переключатель | scan/student/albums/finalWorks | students, media, finalWorks, albumStudents, albumMedia | Скан через камеру, ручной ввод, переход к ученику, разделители съёмки, служебные QR | QR сохраняются в данных и печати | Сохраняется как критический навык | Планируется e2e | Скан ученика, служебного QR и fallback |
| Выпускные альбомы | albums/albumProject/albumClass | albumProjects, albumClasses, albumStudents, albumGroupMedia, albumTeachers, albumMedia | Проекты альбомов, группы, ученики, учителя, общие фото | ZIP альбомной группы, PDF статистика | Реализовано | Планируется integration/e2e | Создать альбом и экспортировать |
| Готовые работы | student/classes | finalWorks, media, students, settings | Создание результата, A4, QR для печати, скачивание | JPG/PDF/HTML печать, полный export | Реализовано | Планируется e2e | Создать работу и распечатать |
| Документы | student/classes | documents, projects, classes, students | Загрузка, привязка, просмотр, скачивание, удаление | Входит в перенос и backup | Реализовано | Планируется integration | Загрузить PDF/JPG |
| Импорт/экспорт | settings/classes/student/albums | все stores | Полный backup, проект, класс, услуги, настройки, операторы, альбомы | Старые ZIP должны сохраняться | Реализовано, рискованная зона | Unit для manifest/path/checksum/conflicts/export filters | Экспорт -> чистая база -> импорт |
| Хранилище и папка ПК | settings/storage | settings | Квота, persistent storage, предупреждения бэкапа, выбор папки, проверка доступа, ZIP fallback | Будущий прямой экспорт в папку | Начато | Unit для путей, capability и backup warnings | Chrome/Edge: выбрать папку |
| PWA и офлайн | all | Cache Storage + IndexedDB | App shell, manifest, service worker | Не применимо | Реализовано, требует усиления SW | Планируется e2e | Установка PWA и офлайн запуск |
