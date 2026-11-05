import { recognizeMonitorPhoto } from './monitor-roster.js';
import { createPhotoCrop } from './roster-photo-crop.js';
import { extractPhotoNames, mergePhotoNames } from './roster-photo-parser.js';
import { parseRoster } from './class-roster.js';
const asset = name => new URL(`../../vendor/tesseract/${name}`, import.meta.url).href;
let library;
function loadLibrary() {
  if (!library) library = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = asset('tesseract.min.js');
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => { script.remove(); library = null; reject(new Error('Не удалось загрузить распознавание. Подключитесь к интернету и повторите.')); };
    document.head.append(script);
  });
  return library;
}
async function prepareImage(file, crop) {
  const bitmap = await createImageBitmap(file);
  try {
    // Downsampling suppresses monitor pixel stripes; full camera resolution harms OCR.
    const left = bitmap.width * crop.left / 100, top = bitmap.height * crop.top / 100;
    const width = bitmap.width * (crop.right - crop.left) / 100, height = bitmap.height * (crop.bottom - crop.top) / 100;
    const scale = Math.min(1, 1400 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'grayscale(1)'; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, left, top, width, height, 0, 0, canvas.width, canvas.height);
    const smooth = document.createElement('canvas');
    smooth.width = canvas.width; smooth.height = canvas.height;
    const smoothCtx = smooth.getContext('2d');
    smoothCtx.filter = 'blur(0.6px)'; smoothCtx.drawImage(canvas, 0, 0);
    return smooth;
  } finally { bitmap.close(); }
}
export function mountRosterPhotoImport(host, onImport) {
  host.innerHTML = `<details><summary>Добавить по фотографиям</summary>
    <p>Выберите до 10 фото одного класса. Фотографии обрабатываются на устройстве. При первом использовании потребуется интернет для загрузки распознавания.</p>
    <label class="field-label">Фотографии списка<input class="input" type="file" data-photos accept="image/jpeg,image/png,image/webp" multiple></label>
    <label class="row"><input type="checkbox" data-monitor-mode>Фото монитора: убрать полосы и выровнять строки</label>
    <div data-photo-crops></div>
    <div class="row"><button class="secondary-button" type="button" data-recognize>Распознать фото</button><button class="secondary-button" type="button" data-cancel hidden>Отменить распознавание</button></div>
    <p role="status" data-photo-status></p><div data-photo-sources class="roster-photo-sources"></div>
    <div data-photo-result hidden><p>Это черновик. Сверьте каждую фамилию и имя с фото. Отчества не нужны. Нечёткие буквы и пропущенные строки исправьте вручную.</p>
    <ul data-photo-warnings></ul><label class="field-label">Распознанные фамилии и имена<textarea class="input textarea" data-photo-names rows="10"></textarea></label>
    <label class="row"><input type="checkbox" data-photo-checked>Я сверил список с фотографиями</label>
    <button class="secondary-button" type="button" data-photo-apply disabled>Добавить в список для проверки</button></div></details>`;
  const q = selector => host.querySelector(selector);
  const status = q('[data-photo-status]'), input = q('[data-photos]'), start = q('[data-recognize]'), cancel = q('[data-cancel]');
  const names = q('[data-photo-names]'), checked = q('[data-photo-checked]'), apply = q('[data-photo-apply]');
  let worker = null, run = 0, disposed = false, urls = [], crops = [];
  function clearURLs() { urls.forEach(URL.revokeObjectURL); urls = []; }
  function invalidate() { checked.checked = false; apply.disabled = true; }
  names.oninput = invalidate;
  checked.onchange = () => { apply.disabled = !checked.checked || !names.value.trim(); };
  input.onchange = () => {
    invalidate(); q('[data-photo-result]').hidden = true; clearURLs(); q('[data-photo-sources]').replaceChildren(); status.textContent = '';
    crops.forEach(item => item.dispose()); crops = [];
    const files = [...input.files];
    if (files.length <= 10 && files.every(file => /^image\/(jpeg|png|webp)$/.test(file.type) && file.size <= 20 * 1024 * 1024)) crops = files.map(createPhotoCrop);
    q('[data-photo-crops]').replaceChildren(...crops.map(item => item.root));
  };
  apply.onclick = () => {
    if (!checked.checked || apply.disabled) return;
    try {
      const parsed = parseRoster(names.value);
      if (!parsed.length) throw new Error('Список пуст. Внесите фамилии и имена.');
      if (parsed.some(name => name.split(' ').length !== 2)) throw new Error('Оставьте только фамилию и имя в каждой строке. Составные имена пишите через дефис.');
      onImport(parsed); invalidate(); status.textContent = 'Добавлено в общий список. Теперь нажмите «Проверить изменения» перед сохранением.';
    } catch (error) { status.textContent = error.message; }
  };
  async function stop() {
    run++; const active = worker; worker = null;
    if (active) await active.terminate();
    if (!disposed) { start.disabled = false; input.disabled = false; q('[data-monitor-mode]').disabled = false; cancel.hidden = true; status.textContent = 'Распознавание отменено. Список класса не изменён.'; }
  }
  cancel.onclick = stop;
  start.onclick = async () => {
    if (worker || start.disabled) return;
    const files = [...input.files];
    if (!files.length || files.length > 10) { status.textContent = 'Выберите от 1 до 10 фотографий одного класса.'; return; }
    if (files.some(file => !/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 20 * 1024 * 1024)) { status.textContent = 'Нужны JPG, PNG или WebP размером до 20 МБ каждый.'; return; }
    const monitorMode = q('[data-monitor-mode]').checked;
    const selections = crops.map(item => ({...item.crop}));
    const token = ++run;
    start.disabled = true; input.disabled = true; q('[data-monitor-mode]').disabled = true; cancel.hidden = false; invalidate();
    q('[data-photo-result]').hidden = true; clearURLs(); q('[data-photo-sources]').replaceChildren();
    status.textContent = 'Подготовка распознавания…';
    let active;
    const pages = [];
    try {
      const Tesseract = await loadLibrary();
      if (token !== run) return;
      active = await Tesseract.createWorker('rus', 1, {workerPath: asset('worker.min.js'), corePath: asset(''), langPath: asset('').replace(/\/$/, ''), workerBlobURL: false,
        logger: event => { if (!monitorMode && token === run && event.status === 'recognizing text') status.textContent = `Фото ${pages.length + 1} из ${files.length}: ${Math.round(event.progress * 100)}%`; }});
      if (token !== run) return;
      worker = active;
      await active.setParameters({ tessedit_pageseg_mode: '6', thresholding_method: '2' });
      for (const [index, file] of files.entries()) {
        if (token !== run) return;
        const source = `Фото ${index + 1}`;
        let data, rows;
        if (monitorMode) {
          status.textContent = `${source}: убираем полосы и выравниваем строки…`;
          const recognized = await recognizeMonitorPhoto(file, selections[index], active, {
            source, isCancelled: () => token !== run,
            onProgress: (line, count) => { if (token === run) status.textContent = `${source} из ${files.length}: строка ${line} из ${count}`; }
          });
          if (!recognized || token !== run) return;
          data = {text: recognized.text}; rows = recognized.rows;
        } else {
          const canvas = await prepareImage(file, selections[index]);
          ({data} = await active.recognize(canvas));
          rows = extractPhotoNames(data.text, source);
        }
        if (token !== run) return;
        pages.push({source, rows});
        const details = document.createElement('details'), summary = document.createElement('summary');
        summary.textContent = `${source} · ${file.name} · найдено строк: ${pages.at(-1).rows.length}`;
        const img = document.createElement('img');
        const url = URL.createObjectURL(file); urls.push(url); img.src = url; img.alt = source; img.loading = 'lazy';
        const raw = document.createElement('pre'); raw.textContent = data.text;
        details.append(summary, img, raw); q('[data-photo-sources]').append(details);
      }
      const merged = mergePhotoNames(pages);
      const inferred = pages.flatMap(page => page.rows.filter(row => row.numberInferred));
      if (inferred.length) merged.warnings.push('Часть номеров восстановлена по порядку соседних строк. Проверьте номера и полноту списка.');
      names.value = merged.rows.map(row => row.name).join('\n');
      q('[data-photo-warnings]').replaceChildren(...merged.warnings.map(message => { const li = document.createElement('li'); li.textContent = message; return li; }));
      q('[data-photo-result]').hidden = false;
      status.textContent = `Найдено строк: ${merged.rows.length}. Совпавших строк с одинаковым номером: ${merged.overlaps}. Проверьте полноту и написание имён.`;
    } catch (error) {
      if (token === run) status.textContent = 'Не удалось распознать фотографии. Попробуйте более чёткое фото или вставьте список вручную. Список класса не изменён.';
    } finally {
      if (active && worker === active) worker = null;
      if (active) await active.terminate();
      if (token === run && !disposed) { start.disabled = false; input.disabled = false; q('[data-monitor-mode]').disabled = false; cancel.hidden = true; }
    }
  };
  return () => { disposed = true; void stop(); clearURLs(); crops.forEach(item => item.dispose()); };
}
