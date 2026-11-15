# Vakha staff → canonical CRM, local v1 / 2026-11-15

Локальная подготовка, без deploy, Caddy, DNS и production DB. Не включать staff gateway
до совместной browser/cookie/ACL-приёмки. Чужие изменения working tree сохранены.

## Контракт

POST `/api/v1/studio/call` с существующей HttpOnly session cookie после `/login`.
GET `/me`, POST `/logout` прежние. На zakaz cookie отдельная, не SSO cookie CRM.
Origin CRM/zakaz разрешены только для studio/login/logout; прочие staff мутации
от zakaz запрещены. Роли admin/manager; менеджер ограничен memberships.

`{action:"updateChild",args:[id,{first_name:"Али"}],requestKey:"uuid",revisions:{[id]:123}}`

Args позиционные, ответ прямой, не `{data}`. Entity revision=sync_records.seq.
Мутации проверяют версии и сохраняют actor/requestKey/bodyhash receipt. Повтор после
отзыва membership заново проверяет ACL; changed body 409. На 409 перечитать данные.

Основные actions: loadSchools/loadSchool/loadClass, create/update School/Class/Child,
importChildren, loadCatalog/updateCatalogItem/deleteCatalogItems,
loadOrders/loadOrdersWorkspace/updateOrderStatus, getProfile/updateProfile,
loadInquiries/updateInquiryStatus, loadVisitAnalytics, getPrivateMediaUrls,
getPublicCatalog(token). Неизвестные actions 501.

Revisions: update* и deleteCatalogItems — каждый изменяемый ID; createClass — schoolId;
createChild/importChildren — classId; updateProfile — userId (пустой профиль0);
updateOrderStatus/updateInquiryStatus — revision возвращённой заявки/обращения.
createSchool без родительской версии. Catalog mutations/import — только admin.

Canonical IDs не меняются. Child edits не затрагивают оплату, медиа, task.fileIds.
Profile role всегда из account, не из profile JSON. Менеджеру финансовые поля скрыты.
Архивирование использует studioStatus, не заменяет workflow status. Токены класса
стабильны; public_expires_at проверяется и закрывает публичное чтение/мутации.

## Импорт и приватные файлы

POST `/studio/import-catalog`: multipart metadata JSON `{userId,items,requestKey}`,
Blob fields `${index}_${property}` для previewImage/originalImage/previewVideo.
Импорт **только добавляет отсутствующие sourceId**, не меняет существующие цены,
не удаляет другие услуги. Ответ число добавленных. Редактирование через update
с revision. deleteCatalogItems скрывает услугу, сохраняет запись и файлы.
`studio_imports.seed_catalog_zip(...)` — явный офлайн helper с теми же правилами,
не запускается автоматически и не читает произвольный путь из HTTP запроса.
Локальный ZIP79 проверен только на чтение:79 уникальных ID, все assets присутствуют.
В production seed не выполнялся.

POST `/studio/import-project`: multipart file/city/year/requestKey, ZIP <=50MiB,
защита duplicate/path traversal/zip bomb, формат app Vakha Studio или School Photo
Flow/schemaVersion1. Добавляет отсутствующие projects/classes/students/orders.
**Существующие записи сохраняются**, вместо безусловного overwrite устаревшим ZIP.
Исходный архив хранится приватно и доступен из crm_archive_path школы.
Медиа/finalWorks/documents архива остаются в исходном ZIP: пока не гидратируются
в самостоятельные canonical media records. Поэтому файлы доступны в архиве, а не
как отдельные фотографии в карточке импортированного учащегося.

GET `/studio/file?path=opaqueId` проверяет актуальный membership на каждом запросе,
поддерживает Range, Content-Type и private/no-store. Для ZIP с несколькими школами
нужен доступ ко всем. `getPrivateMediaUrls([ids])` возвращает `{id:authorizedURL}`,
не публичные URL/S3 keys/пути ФС. Order aliases reference_path/parent_video_path
содержат media ID, имена/MIME из canonical metadata. Каталожный оригинал тоже
выдаётся только через защищённый staff file endpoint.

## Публичная витрина и директория

GET `/api/v1/public/catalog` → PublicCatalogPayload из опубликованного parent_catalog:
только marketing whitelist; inactive скрыты. originals/owner/staff/private refs
не выдаются. getPublicCatalog(token) использует тот же mapper и profile token.

GET `/api/v1/public/directory?query=...` →
`{schools:[{id,name,city,classes:[{id,name,token}]}]}`.
По прямому разрешению пользователя публикует названия canonical active школ/классов,
создаёт только отсутствующие стабильные parent links, синхронизирует имена учащихся.
Ранее закрытый класс не открывает. Контакты, телефоны, staff, оплаты, медиа отсутствуют.
Дети доступны стандартным GET `/public/classes/<token>` после выбора класса.

Analytics считает открытия root catalog/class с daily HMAC visitor hash; исходные IP,
User-Agent, токены и контакты не хранятся. Manager видит только свои project visits.
Обращения читаются из studio_inquiries с project ACL, поддержаны статусы
new/contacted/closed и версии. **Public catalog intake ещё не пишет studio_inquiries**:
интеграция создания новых обращений — отдельный оставшийся этап, не считать этот
экран реальной миграцией старых Supabase inquiries.

## Проверки и ограничения приёмки

Focused WSGI: `python3 -m unittest discover -s tests/server -p test_studio_api.py -v`.
Проверяет роли, чужие проекты, retries/revisions, revoked membership, сохранение оплат
и tasks, children dedup, directory privacy/stable links, catalog price preservation,
private bytes/cache/ZIP traversal, expiry, inquiry ACL, anonymous analytics.

Полный suite на этом Mac требует synthetic disk_usage только в test process из-за
малого свободного диска; production guards не ослаблялись. Нет реальных credentials,
production orders/imports или данных телефона. Реальные cookies/Caddy/browser staff
journey и эксплуатационная seed79-проверка пока не выполнены. Не объявлять live-ready.
