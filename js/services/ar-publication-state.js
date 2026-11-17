// Local queue acknowledgement is distinct from a confirmed AR publication.
export function arPublicationState(work = {}) {
  const status = work.arStatus;
  const states = {
    queued: ['В очереди на устройстве', 'CRM передаст фото A4 и видео при синхронизации.'],
    processing: ['AR Photo обрабатывает файлы', 'Готовим распознавание фото и видео. QR появится после подтверждения.'],
    retry: ['Ожидаем подтверждение AR Photo', 'Задача сохранена. Сервер повторит проверку автоматически.'],
    ready: ['Готово в AR Photo', 'Фото и видео опубликованы. Можно открыть AR и скачать QR.'],
    failed: ['Отправка не завершена', 'Проверьте ошибку перед повторной отправкой.']
  };
  if (status === 'queued' && work.arJobId) states.queued = ['В очереди на сервере', 'Файлы приняты CRM. Ожидаем передачу в AR Photo.'];
  const [title, detail] = states[status] || ['Ещё не отправлено', 'Выберите готовое видео для фотографии A4.'];
  return { title, detail: work.arError || detail, busy: ['queued', 'processing', 'retry'].includes(status), ready: status === 'ready' };
}
