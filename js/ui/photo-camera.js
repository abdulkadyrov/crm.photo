import { describeCamera, chooseCameraRecordingType, recordedCameraBlob, snapCameraZoom, CAMERA_ZOOM_STOPS } from "../services/camera-options.js?v=154";
import { cameraCrop } from "../services/camera-framing.js";
const preferredVideo = {
  width: { ideal: 3840 },
  height: { ideal: 2880 },
  aspectRatio: { ideal: 4 / 3 }
};

const manualControls = [
  ["zoom", "Зум"],
  ["exposureCompensation", "Экспокоррекция, EV"],
  ["iso", "ISO", "exposureMode"],
  ["exposureTime", "Выдержка, мс", "exposureMode", value => Number((value / 10).toFixed(2))],
  ["focusDistance", "Фокус, м", "focusMode"],
  ["colorTemperature", "Баланс белого, К", "whiteBalanceMode"]
];

function rangeOf(capabilities, key) {
  const range = capabilities[key];
  return Number.isFinite(range?.min) && Number.isFinite(range?.max) && range.min < range.max ? range : null;
}

function inRange(value, { min, max, step }) {
  const rounded = step > 0 ? min + Math.round((value - min) / step) * step : value;
  return Math.min(max, Math.max(min, rounded));
}

async function takeStill(video, track) {
  if (typeof window.ImageCapture === "function") {
    try {
      const capture = new window.ImageCapture(track);
      const caps = await capture.getPhotoCapabilities?.().catch(() => null);
      const dimensions = {};
      if (caps?.imageWidth?.max > 0) dimensions.imageWidth = caps.imageWidth.max;
      if (caps?.imageHeight?.max > 0) dimensions.imageHeight = caps.imageHeight.max;
      const still = await capture.takePhoto(dimensions).catch(() => capture.takePhoto());
      if (still?.size) return still;
    } catch {
      // Some browsers expose ImageCapture for only a subset of camera tracks.
    }
  }
  if (!video.videoWidth || !video.videoHeight) throw new Error("Поток камеры ещё не готов.");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.98));
  if (!blob?.size) throw new Error("Не удалось получить снимок.");
  return blob;
}

export function openPhotoCamera({ studentName, existingMedia = [], initialType = "photo", reference, mountHistory, onSave, onDelete, onClose, openSystemCamera }) {
  if (document.querySelector(".photo-camera")) return;
  const panel = document.createElement("dialog");
  panel.className = "photo-camera";
  panel.setAttribute("aria-label", "Фотосъёмка");
  panel.innerHTML = `
    <header class="photo-camera-header">
      <div><h2>Камера</h2><p data-camera-student></p></div>
      <button class="photo-camera-button" data-camera-close type="button" autofocus aria-label="Закрыть камеру" title="Закрыть камеру"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    </header>
    <div class="camera-top-tools" data-camera-live>
      <button class="photo-camera-button camera-round" data-torch type="button" aria-label="Постоянный свет" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 10-13h-7z" fill="currentColor"/></svg></button>
      <button class="photo-camera-button camera-round" data-tools-toggle type="button" aria-expanded="false" aria-label="Настройки камеры"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
      <button class="photo-camera-button camera-round" data-grid type="button" aria-label="Сетка" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v18M16 3v18M3 8h18M3 16h18" fill="none" stroke="currentColor"/></svg></button>
    </div>
    <div class="photo-camera-stage">
      <div class="photo-camera-frame"><video autoplay muted playsinline></video><button class="photo-camera-button camera-round camera-zoom" data-camera-live data-camera-zoom type="button" aria-label="Масштаб камеры">1×</button></div>
      <video class="camera-recorded-preview" controls playsinline hidden></video>
      <img alt="Снятая фотография" hidden draggable="false" /><div class="camera-photo-zoom" hidden><button type="button" data-photo-less aria-label="Уменьшить фото">−</button><button type="button" data-photo-reset>1×</button><button type="button" data-photo-more aria-label="Увеличить фото">+</button></div>
      <div class="photo-camera-guide" aria-hidden="true" hidden></div>
    </div>
    <footer class="photo-camera-controls">
      <div class="camera-settings" hidden><div class="photo-camera-aspect" data-camera-live><button class="photo-camera-button" type="button" data-camera-aspect-toggle aria-expanded="false">4:3</button><div data-camera-aspects hidden aria-label="Соотношение сторон"><button class="photo-camera-button" type="button" data-aspect="1" aria-pressed="false">1:1</button><button class="photo-camera-button" type="button" data-aspect="1.3333333333333333" aria-pressed="true">4:3</button><button class="photo-camera-button" type="button" data-aspect="1.7777777777777777" aria-pressed="false">16:9</button></div></div>
      </div><div class="camera-capture-modes" data-camera-live><button type="button" data-capture-mode="video">ВИДЕО</button><button type="button" data-capture-mode="photo">ФОТО</button></div>
      <p class="photo-camera-status" role="status"></p>
      <div class="photo-camera-modes" data-camera-live>
        <button class="photo-camera-button" type="button" data-camera-mode="auto" aria-pressed="true">Авто</button>
        <button class="photo-camera-button" type="button" data-camera-mode="low" aria-pressed="false">Мало света</button>
        <button class="photo-camera-button" type="button" data-camera-mode="pro" aria-pressed="false">Профи</button>
      </div>
      <div class="photo-camera-manual" data-camera-manual hidden></div>
      <div class="camera-shutter-row" data-camera-live><button class="photo-camera-button camera-latest" data-latest type="button" aria-label="Последний снимок" disabled></button><button class="photo-camera-button photo-camera-primary" data-camera-shutter data-camera-live type="button" disabled aria-label="Сфотографировать"><span></span></button><button class="photo-camera-button camera-round" data-flip type="button" aria-label="Переключить камеру"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8a8 8 0 0 0-14-2L3 9m0-6v6h6M4 16a8 8 0 0 0 14 2l3-3m0 6v-6h-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button></div>
      <button class="photo-camera-button" data-camera-play type="button" hidden>Включить предпросмотр</button>
      <div class="photo-camera-review" hidden>
        <button class="photo-camera-button" data-camera-retake type="button">Переснять</button>
      <div class="photo-camera-filmstrip" aria-label="Снимки за сеанс" hidden></div>
        <button class="photo-camera-button photo-camera-primary" data-camera-save type="button">Сохранить и продолжить</button>
      </div>
      <button class="photo-camera-button" data-camera-system type="button" hidden>Открыть камеру телефона</button>
    </footer>
  `;
  const find = selector => panel.querySelector(selector);
  const video = find("video");
  video.muted = true;
  const image = find("img");
  const shutter = find("[data-camera-shutter]");
  const exit = find("[data-camera-close]");
  const retake = find("[data-camera-retake]");
  const save = find("[data-camera-save]");
  const manual = find("[data-camera-manual]");
  find('.camera-settings').append(find('.photo-camera-modes'), manual);
  const system = find("[data-camera-system]");
  const play = find("[data-camera-play]");
  const modes = [...panel.querySelectorAll("[data-camera-mode]")];
  const status = find(".photo-camera-status");
  find("[data-camera-student]").textContent = studentName;
  let referenceVideo;
  if (reference?.imageUrl || reference?.videoUrl) {
    const details = document.createElement("details");
    details.className = "photo-camera-reference";
    details.dataset.cameraLive = "";
    const summary = document.createElement("summary");
    summary.setAttribute("aria-label", `Референс ракурса: ${reference.name || "текущий ракурс"}`);
    const label = document.createElement("span");
    label.textContent = reference.name || "Ракурс";
    if (reference.imageUrl) {
      const thumbnail = document.createElement("img");
      thumbnail.src = reference.imageUrl;
      thumbnail.alt = "";
      summary.append(thumbnail);
    }
    summary.append(label);
    details.append(summary);
    if (reference.imageUrl) {
      const enlarged = document.createElement("img");
      enlarged.src = reference.imageUrl;
      enlarged.alt = reference.name || "Референс ракурса";
      details.append(enlarged);
    } else {
      referenceVideo = document.createElement("video");
      referenceVideo.src = reference.videoUrl;
      referenceVideo.controls = true;
      referenceVideo.playsInline = true;
      referenceVideo.preload = "none";
      details.append(referenceVideo);
      details.addEventListener("toggle", () => { if (!details.open) referenceVideo.pause(); });
    }
    find(".photo-camera-stage").append(details);
  }

  let aspect = 4 / 3;
  let photoAspect = aspect;
  const frame = find('.photo-camera-frame');
  const stage = find('.photo-camera-stage');
  frame.append(find('.photo-camera-guide'));
  const zoomPanel = document.createElement('div');
  zoomPanel.className = 'camera-zoom-dial';
  zoomPanel.hidden = true;
  zoomPanel.innerHTML = '<svg class="camera-zoom-wheel" viewBox="0 0 400 210" aria-hidden="true"><g data-zoom-ticks></g></svg><span class="camera-zoom-pointer" aria-hidden="true"></span><output>1×</output><input type="range" aria-label="Масштаб камеры" />';
  const zoomPresets = document.createElement('div');
  zoomPresets.className = 'camera-zoom-presets camera-zoom-quick';
  frame.append(zoomPresets);
  frame.append(zoomPanel);
  const zoomSlider = zoomPanel.querySelector('input');
  let pendingZoom = null, zoomApplying = false, zoomAnchor = null;
  async function drainZoom() {
    if (zoomApplying) return;
    zoomApplying = true;
    try {
      while (pendingZoom !== null && !closed) {
        const value = pendingZoom; pendingZoom = null;
        // Zoom alone: resending resolution/facing mode can restart camera negotiation.
        await track.applyConstraints({advanced: [{zoom: value, ...(torchOn ? {torch: true} : {})}]});
      }
    } catch { if (!closed) status.textContent = 'Не удалось изменить масштаб'; }
    finally { zoomApplying = false; }
  }
  function requestZoom(value) {
    const range = rangeOf(capabilities, 'zoom');
    if (!range || busy || closed) return;
    const snapped = snapCameraZoom(Number(value), range, zoomAnchor);
    zoomAnchor = snapped.anchor;
    pendingZoom = inRange(snapped.value, range);
    const label = `${Number(pendingZoom.toFixed(1))}×`;
    zoomSlider.value = pendingZoom;
    zoomPresets.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(Math.abs(parseFloat(button.textContent)-pendingZoom)<0.05)));
    zoomPanel.querySelector('output').textContent = label;
    find('[data-camera-zoom]').textContent = label;
    const ratio = Math.log(pendingZoom / range.min) / Math.log(range.max / range.min);
    zoomPanel.querySelector('[data-zoom-ticks]').style.transform = `rotate(${70 - ratio * 140}deg)`;
    void drainZoom();
  }
  zoomSlider.oninput = () => requestZoom(zoomSlider.value);
  const aspectToggle = find('[data-camera-aspect-toggle]');
  function updateFrame() {
    const width = stage.clientWidth, height = stage.clientHeight;
    const ratio = video.videoWidth > video.videoHeight ? aspect : 1 / aspect;
    frame.style.width = `${Math.min(width, height * ratio)}px`;
    frame.style.height = `${Math.min(height, width / ratio)}px`;
  }
  const observer = new ResizeObserver(updateFrame);
  observer.observe(stage);
  aspectToggle.onclick = () => {
    const options = find('[data-camera-aspects]');
    options.hidden = !options.hidden;
    aspectToggle.setAttribute('aria-expanded', String(!options.hidden));
  };
  panel.querySelectorAll('[data-aspect]').forEach(button => {
    button.onclick = () => {
      if (busy) return;
      if (captureType === "video") { status.textContent = "Формат видео определяется выбранной камерой"; return; }
      aspect = photoAspect = Number(button.dataset.aspect);
      aspectToggle.textContent = button.textContent;
      panel.querySelectorAll('[data-aspect]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      find('[data-camera-aspects]').hidden = true;
      aspectToggle.setAttribute('aria-expanded', 'false');
      updateFrame();
    };
  });
  let captureType = initialType;
  let recorder, audioStream, recordingTimer;
  let torchOn = false;
  let gridOn = true;
  const recordedPreview = find('.camera-recorded-preview');
  function showRecordedVideo(url) {
    recordedPreview.pause();
    recordedPreview.srcObject = null;
    recordedPreview.hidden = false;
    recordedPreview.controls = true;
    recordedPreview.playsInline = true;
    recordedPreview.preload = 'auto';
    recordedPreview.src = url;
    recordedPreview.load();
  }
  recordedPreview.onerror = () => {
    if (closed || !recordedPreview.getAttribute('src')) return;
    status.textContent = 'Не удалось воспроизвести видео. Его можно сохранить. Для новой записи попробуйте основную заднюю камеру.';
  };
  function refreshCaptureMode() {
    panel.classList.toggle('is-video', captureType === 'video');
    panel.querySelectorAll('[data-capture-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.captureMode === captureType)));
    shutter.setAttribute('aria-label', captureType === 'video' ? 'Начать запись' : 'Сфотографировать');
    if (captureType === 'photo') aspect = photoAspect;
    if (captureType === 'video' && video.videoWidth) aspect = Math.max(video.videoWidth, video.videoHeight) / Math.min(video.videoWidth, video.videoHeight);
    updateFrame();
  }
  find('[data-tools-toggle]').onclick = event => {
    const settings = find('.camera-settings');
    settings.hidden = !settings.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!settings.hidden));
    panel.classList.toggle('tools-open', !settings.hidden);
  };
  find('[data-grid]').onclick = event => {
    gridOn = !gridOn;
    event.currentTarget.setAttribute('aria-pressed', String(gridOn));
    find('.photo-camera-guide').hidden = !gridOn;
  };
  find('[data-torch]').onclick = () => run(async () => {
    if (!capabilities.torch) { status.textContent = 'Постоянный свет недоступен этой камере в браузере'; return; }
    await applyCameraSettings({torch: !torchOn});
    torchOn = !torchOn;
    find('[data-torch]').setAttribute('aria-pressed', String(torchOn));
  }, 'Не удалось переключить свет');
  find('[data-flip]').onclick = () => run(async () => {
    if (devices.length < 2) return;
    const index = devices.findIndex(device => device.deviceId === defaults.deviceId);
    await startCamera(devices[(index + 1) % devices.length].deviceId);
  }, 'Не удалось переключить камеру');
  panel.querySelectorAll('[data-capture-mode]').forEach(button => button.onclick = () => {
    if (busy || shot || recorder?.state === 'recording') return;
    captureType = button.dataset.captureMode;
    refreshCaptureMode();
  });
  function configureZoom() {
    const range = rangeOf(capabilities, 'zoom');
    zoomPresets.replaceChildren();
    zoomAnchor = null;
    find('[data-camera-zoom]').hidden = !!range;
    if (!range) return;
    zoomSlider.min = range.min; zoomSlider.max = range.max;
    zoomSlider.step = range.step || 0.01;
    zoomSlider.value = track.getSettings?.().zoom || range.min;
    const ticks = zoomPanel.querySelector('[data-zoom-ticks]');
    ticks.replaceChildren();
    const ns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i <= 70; i++) {
      const angle = (-70 + i * 2) * Math.PI / 180;
      const major = i % 5 === 0;
      const line = document.createElementNS(ns, 'line');
      const r = major ? 155 : 168;
      for (const [name, value] of Object.entries({x1:200+Math.sin(angle)*r, y1:200-Math.cos(angle)*r, x2:200+Math.sin(angle)*185, y2:200-Math.cos(angle)*185})) line.setAttribute(name,value);
      line.setAttribute('stroke', major ? '#fff' : '#ffffff66');
      line.setAttribute('stroke-width', major ? '1.5' : '1'); ticks.append(line);
    }
    const values = [...new Set([range.min, ...CAMERA_ZOOM_STOPS])].filter(value => value >= range.min && value <= range.max).sort((a,b)=>a-b);
    for (const value of values) {
      const angle = (-70 + Math.log(value/range.min)/Math.log(range.max/range.min)*140) * Math.PI/180;
      const label = document.createElementNS(ns,'text');
      label.setAttribute('x',200+Math.sin(angle)*137); label.setAttribute('y',200-Math.cos(angle)*137);
      label.setAttribute('text-anchor','middle'); label.setAttribute('fill','#fff'); label.setAttribute('font-size','13'); label.textContent = value;
      ticks.append(label);
      const button = document.createElement('button'); button.type='button'; button.textContent=`${value}×`;
      button.setAttribute('aria-label', `Масштаб ${value}`);
      button.onclick = () => { requestZoom(value); };
      button.onpointerdown = event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        button.setPointerCapture(event.pointerId);
        dialDrag = {x:event.clientX, value};
      };
      button.onpointermove = event => {
        if (!dialDrag || Math.abs(event.clientX-dialDrag.x)<6) return;
        zoomPanel.hidden = false;
        requestZoom(dialDrag.value * Math.pow(range.max/range.min, (dialDrag.x-event.clientX)/360));
      };
      button.onpointerup = button.onpointercancel = () => { dialDrag=null; };
      zoomPresets.append(button);
    }
    const expand = document.createElement('button'); expand.type='button'; expand.textContent='⌃'; expand.setAttribute('aria-label','Плавный зум');
    expand.onclick = () => { zoomPanel.hidden = !zoomPanel.hidden; };
    zoomPresets.append(expand);
    const current = Number(zoomSlider.value);
    const angle = 70-Math.log(current/range.min)/Math.log(range.max/range.min)*140;
    ticks.style.transform = `rotate(${angle}deg)`;
    zoomPanel.querySelector('output').textContent = `${Number(current.toFixed(1))}×`;
  }
  let dialDrag;
  zoomPanel.onpointerdown = event => {
    if (!rangeOf(capabilities, 'zoom')) return;
    zoomPanel.setPointerCapture(event.pointerId);
    dialDrag = {x:event.clientX, value:Number(zoomSlider.value)};
  };
  zoomPanel.onpointermove = event => {
    if (!dialDrag) return;
    const range = rangeOf(capabilities,'zoom');
    requestZoom(dialDrag.value * Math.pow(range.max/range.min, (dialDrag.x-event.clientX)/360));
  };
  zoomPanel.onpointerup = event => { if (dialDrag && Math.abs(event.clientX-dialDrag.x)<4) zoomPanel.hidden=true; dialDrag=null; };
  zoomPanel.onpointercancel = () => { dialDrag=null; };
  find('[data-camera-zoom]').onclick = () => { status.textContent = 'Зум недоступен этой камере в браузере'; };
  find('[data-latest]').onclick = () => find('.photo-camera-thumbnail:last-child')?.click();
  let stream;
  let track;
  let baseConstraints;
  let capabilities = {};
  let defaults = {};
  let devices = [];
  let mode = "auto";
  let shot;
  let shotUrl;
  let savedCount = 0;
  const sessionPhotos = existingMedia.filter(item => item.blob instanceof Blob && item.blob.size > 0).map(item => ({ id: item.id, kind: item.type === "video" ? "video" : "photo", url: URL.createObjectURL(item.blob) }));
  let reviewingSaved = null;
  let busy = false;
  let closed = false;

  const stopStream = () => {
    if (recorder?.state === "recording") recorder.stop();
    clearInterval(recordingTimer);
    audioStream?.getTracks().forEach(item => item.stop());
    stream?.getTracks().forEach(item => item.stop());
    video.srcObject = null;
    stream = track = null;
  };
  const discardShot = () => {
    recordedPreview.pause();
    recordedPreview.removeAttribute("src");
    recordedPreview.load();
    image.removeAttribute("src");
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shot = shotUrl = null;
  };
  const history = mountHistory(() => {
    closed = true;
    stopStream();
    observer.disconnect();
    discardShot();
    sessionPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
    panel.close();
    panel.remove();
    onClose();
  });
  const updateControls = () => {
    const ready = track?.readyState === "live";
    const recording = recorder?.state === 'recording';
    panel.querySelectorAll('[data-flip], [data-capture-mode], [data-aspect], [data-camera-mode]').forEach(control => { control.disabled = busy || recording; });
    shutter.disabled = busy || !ready || !video.videoWidth;
    retake.disabled = save.disabled = busy;
    play.disabled = busy;
    modes.forEach(button => {
      button.disabled = busy || recording || !ready || (button.dataset.cameraMode === "low" && !canBrighten());
      button.setAttribute("aria-pressed", String(button.dataset.cameraMode === mode));
    });
    manual.querySelectorAll("input, select").forEach(control => { control.disabled = busy; });
  };
  const run = async (action, errorMessage) => {
    if (busy || closed) return;
    busy = true;
    updateControls();
    try { await action(); }
    catch (error) {
      if (!closed) {
        if (recorder?.state !== "recording") audioStream?.getTracks().forEach(item => item.stop());
        console.warn(errorMessage, error);
        status.textContent = errorMessage;
      }
    } finally {
      busy = false;
      if (!closed) updateControls();
    }
  };
  let photoScale = 1, photoX = 0, photoY = 0;
  const photoPointers = new Map();
  let photoGesture;
  function paintPhoto() {
    const bounds = stage.getBoundingClientRect();
    photoX = Math.max(-bounds.width * (photoScale - 1) / 2, Math.min(bounds.width * (photoScale - 1) / 2, photoX));
    photoY = Math.max(-bounds.height * (photoScale - 1) / 2, Math.min(bounds.height * (photoScale - 1) / 2, photoY));
    image.style.transform = `translate(${photoX}px, ${photoY}px) scale(${photoScale})`;
    find('[data-photo-reset]').textContent = `${Number(photoScale.toFixed(1))}×`;
  }
  function resetPhotoZoom() { photoScale = 1; photoX = photoY = 0; photoPointers.clear(); photoGesture = null; paintPhoto(); }
  function changePhotoScale(value) { photoScale = Math.max(1, Math.min(6, value)); paintPhoto(); }
  find('[data-photo-more]').onclick = () => changePhotoScale(photoScale + .5);
  find('[data-photo-less]').onclick = () => changePhotoScale(photoScale - .5);
  find('[data-photo-reset]').onclick = resetPhotoZoom;
  image.ondblclick = () => changePhotoScale(photoScale > 1 ? 1 : 2);
  image.onwheel = event => { event.preventDefault(); changePhotoScale(photoScale * (event.deltaY < 0 ? 1.1 : 1/1.1)); };
  function beginPhotoGesture() {
    const points = [...photoPointers.values()];
    photoGesture = points.length === 2 ? {distance: Math.hypot(points[1].x-points[0].x, points[1].y-points[0].y), scale: photoScale} : points.length ? {x: points[0].x, y: points[0].y, offsetX: photoX, offsetY: photoY} : null;
  }
  image.onpointerdown = event => {
    image.setPointerCapture(event.pointerId);
    photoPointers.set(event.pointerId, {x:event.clientX,y:event.clientY}); beginPhotoGesture();
  };
  image.onpointermove = event => {
    if (!photoPointers.has(event.pointerId)) return;
    photoPointers.set(event.pointerId, {x:event.clientX,y:event.clientY});
    const points = [...photoPointers.values()];
    if (points.length === 2 && photoGesture?.distance) changePhotoScale(photoGesture.scale * Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y) / photoGesture.distance);
    else if (points.length === 1 && photoGesture) { photoX = photoGesture.offsetX + points[0].x-photoGesture.x; photoY = photoGesture.offsetY + points[0].y-photoGesture.y; paintPhoto(); }
  };
  image.onpointerup = image.onpointercancel = event => { photoPointers.delete(event.pointerId); beginPhotoGesture(); };
  const setReview = reviewing => {
    resetPhotoZoom();
    zoomPanel.hidden = true;
    zoomPresets.hidden = reviewing;
    find('.camera-photo-zoom').hidden = !reviewing;
    if (reviewing) { referenceVideo?.pause(); video.pause(); }
    else if (video.srcObject) video.play().catch(() => { if (!closed) play.hidden = false; });
    if (!reviewing && torchOn && capabilities.torch === true && track?.readyState === 'live') {
      applyCameraSettings({torch: true}).catch(() => { if (!closed) status.textContent = 'Не удалось восстановить постоянный свет'; });
    }
    panel.classList.toggle("is-reviewing", reviewing);
    image.hidden = !reviewing;
    panel.querySelectorAll("[data-camera-live]").forEach(control => { control.hidden = reviewing; });
    if (!reviewing && rangeOf(capabilities, 'zoom')) find('[data-camera-zoom]').hidden = true;
    find(".photo-camera-review").hidden = !reviewing;
    manual.hidden = reviewing || mode !== "pro";
    find(".photo-camera-guide").hidden = reviewing || !gridOn;
    if (!reviewing) { recordedPreview.pause(); recordedPreview.hidden = true; }
  };
  function renderFilmstrip() {
    const strip = find('.photo-camera-filmstrip');
    strip.replaceChildren();
    strip.hidden = !sessionPhotos.length;
    find('[data-latest]').disabled = !sessionPhotos.length;
    const latest = sessionPhotos.at(-1);
    find('[data-latest]').style.backgroundImage = latest && latest.kind !== 'video' ? `url("${latest.url}")` : '';
    find('[data-latest]').textContent = latest?.kind === 'video' ? 'Видео' : '';
    for (const [index, photo] of sessionPhotos.entries()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'photo-camera-thumbnail';
      button.setAttribute('aria-label', `Открыть снимок ${index + 1}`);
      button.setAttribute('aria-pressed', String(reviewingSaved?.id === photo.id));
      const thumb = document.createElement(photo.kind === 'video' ? 'video' : 'img');
      thumb.muted = true;
      thumb.playsInline = true;
      thumb.src = photo.url;
      thumb.alt = '';
      button.append(thumb);
      button.onclick = () => {
        if (busy || shot) return;
        reviewingSaved = photo;
        strip.querySelectorAll('.photo-camera-thumbnail').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        image.src = photo.url;
        setReview(true);
        if (photo.kind === 'video') { find('.camera-photo-zoom').hidden = true; image.hidden = true; showRecordedVideo(photo.url); }
        retake.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4l2-3h4l2 3h4v13H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
        retake.setAttribute('aria-label', 'К камере');
        retake.title = 'К камере';
        save.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        save.setAttribute('aria-label', 'Удалить снимок');
        save.title = 'Удалить снимок';
        find('.photo-camera-review').classList.add('is-saved-review');
        status.textContent = `Снимок ${index + 1} из ${sessionPhotos.length}`;
      };
      strip.append(button);
    }
  }
  const canBrighten = () => capabilities.torch === true || (rangeOf(capabilities, "exposureCompensation")?.max ?? 0) > 0;

  async function startCamera(deviceId) {
    stopStream();
    system.hidden = true;
    play.hidden = true;
    manual.replaceChildren();
    status.textContent = "Подключаем камеру…";
    baseConstraints = { ...preferredVideo, ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "environment" } }) };
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: baseConstraints, audio: false });
      if (closed) return nextStream.getTracks().forEach(item => item.stop());
      stream = nextStream;
      track = stream.getVideoTracks()[0];
      const activeTrack = track;
      track.addEventListener("ended", () => {
        if (closed || activeTrack !== track) return;
        status.textContent = "Поток прерван. Можно открыть камеру телефона.";
        system.hidden = false;
        updateControls();
      });
      video.srcObject = stream;
      if (closed) return;
      capabilities = track.getCapabilities?.() || {};
      defaults = track.getSettings?.() || {};
      configureZoom();
      find("[data-camera-zoom]").textContent = `${defaults.zoom || 1}×`;
      devices = (await navigator.mediaDevices.enumerateDevices?.().catch(() => []) || []).filter(device => device.kind === "videoinput");
      if (closed) return;
      mode = "auto";
      torchOn = false;
      find('[data-torch]').setAttribute('aria-pressed', 'false');
      refreshCaptureMode();
      renderManual();
      setReview(false);
      try {
        await resumePreview();
      } catch (error) {
        if (error.name !== "NotAllowedError") throw error;
        if (!closed) {
          play.hidden = false;
          status.textContent = "Нажмите, чтобы включить предпросмотр";
        }
      }
    } catch (error) {
      if (closed) return;
      stopStream();
      system.hidden = false;
      throw error;
    }
  }

  async function resumePreview() {
    await video.play();
    if (closed) return;
    play.hidden = true;
    status.textContent = savedCount ? `Сохранено за сеанс: ${savedCount}` : "Камера готова";
  }

  async function applyCameraSettings(values) {
    if (!Object.keys(values).length) return;
    const settings = capabilities.torch === true ? {torch: torchOn, ...values} : values;
    await track.applyConstraints({ ...baseConstraints, advanced: [settings] });
    const current = track.getSettings?.() || {};
    for (const [key, value] of Object.entries(values)) {
      if (!(key in current)) continue;
      const accepted = typeof value === "number"
        ? Math.abs(current[key] - value) < Math.max(rangeOf(capabilities, key)?.step || 0, 0.01)
        : current[key] === value;
      if (!accepted) throw new Error("Камера не приняла настройку.");
    }
  }

  function renderManual() {
    manual.replaceChildren();
    if (mode !== "pro") return;
    const help = document.createElement('small');
    help.textContent = 'Сетка и ручные параметры. Показаны только настройки, доступные этой камере в браузере. Авто сбрасывает изменения.';
    manual.append(help);
    if (devices.length > 1) {
      const label = document.createElement("label");
      label.textContent = "Камера";
      const select = document.createElement("select");
      devices.forEach((device, index) => select.add(new Option(describeCamera(device.label, index).name, device.deviceId)));
      select.value = defaults.deviceId || select.options[0].value;
      select.onchange = () => run(() => startCamera(select.value), "Не удалось переключить камеру.");
      label.append(select);
      manual.append(label);
      const device = devices.find(item => item.deviceId === select.value);
      const explanation = document.createElement('small');
      explanation.textContent = describeCamera(device?.label).hint;
      manual.append(explanation);
      const details = document.createElement('details');
      details.className = 'camera-device-help';
      const summary = document.createElement('summary'); summary.textContent = 'Подробнее о камерах'; details.append(summary);
      devices.forEach((device, index) => {
        const info = describeCamera(device.label, index);
        const paragraph = document.createElement('p');
        paragraph.textContent = `${info.name}: ${info.hint} Название устройства: ${device.label || 'не указано'}`;
        details.append(paragraph);
      });
      manual.append(details);
    }
    const controls = manualControls.filter(([key, , metering]) =>
      rangeOf(capabilities, key) && (!metering || capabilities[metering]?.includes("manual"))
    );
    const settings = track.getSettings?.() || {};
    const manualValues = {};
    for (const [key, labelText, metering, format = value => Number(value.toFixed(2))] of controls) {
      const range = rangeOf(capabilities, key);
      const label = document.createElement("label");
      const name = document.createElement("span");
      const input = document.createElement("input");
      input.type = "range";
      input.min = range.min;
      input.max = range.max;
      input.step = range.step || "any";
      input.value = settings[key] ?? defaults[key] ?? range.min;
      const updateLabel = () => { name.textContent = `${labelText} · ${format(Number(input.value))}`; };
      updateLabel();
      input.oninput = updateLabel;
      input.onchange = () => run(async () => {
        const values = { ...manualValues, ...(metering ? { [metering]: "manual" } : {}), [key]: Number(input.value) };
        try {
          await applyCameraSettings(values);
          Object.assign(manualValues, values);
          status.textContent = "Настройки применены";
        } catch (error) {
          input.value = track.getSettings?.()[key] ?? settings[key] ?? range.min;
          updateLabel();
          throw error;
        }
      }, "Эта настройка недоступна для выбранной камеры.");
      label.append(name, input);
      manual.append(label);
    }
    if (!controls.length) {
      const message = document.createElement("small");
      message.textContent = "Сетка кадрирования включена. Ручные параметры этой камеры браузеру недоступны.";
      manual.append(message);
    }
  }

  for (const button of modes) button.onclick = () => run(async () => {
    const next = button.dataset.cameraMode === mode && mode !== "auto" ? "auto" : button.dataset.cameraMode;
    if (next === mode) return;
    const values = Object.fromEntries(
      ["zoom", "exposureCompensation", "exposureMode", "whiteBalanceMode", "focusMode"]
        .filter(key => defaults[key] !== undefined)
        .map(key => [key, defaults[key]])
    );
    // The dedicated light button owns the torch independently of exposure presets.
    const exposure = rangeOf(capabilities, "exposureCompensation");
    if (exposure && next === "low") values.exposureCompensation = inRange(1, exposure);


    await applyCameraSettings(values);
    mode = next;
    status.textContent = next === "low" ? "Подсветка и экспозиция по возможностям камеры" : "Камера готова";
    renderManual();
    setReview(false);
  }, "Не удалось применить режим к этой камере.");

  shutter.onclick = () => {
    if (recorder?.state === 'recording') { recorder.stop(); return; }
    return run(async () => {
    if (captureType === 'video') {
      if (!window.MediaRecorder) throw new Error('Запись видео не поддерживается');
      audioStream = await navigator.mediaDevices.getUserMedia({audio: true});
      if (closed) { audioStream.getTracks().forEach(item => item.stop()); return; }
      const mimeType = chooseCameraRecordingType(type => MediaRecorder.isTypeSupported(type), type => !!recordedPreview.canPlayType(type));
      recorder = new MediaRecorder(new MediaStream([...stream.getVideoTracks(), ...audioStream.getAudioTracks()]), mimeType ? {mimeType} : {});
      const chunks = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        clearInterval(recordingTimer);
        audioStream?.getTracks().forEach(item => item.stop());
        panel.classList.remove('is-recording');
        if (closed) return;
        let blob;
        try { blob = recordedCameraBlob(chunks, recorder.mimeType || mimeType); }
        catch { status.textContent = 'Камера не вернула видео. Повторите запись'; updateControls(); return; }
        if (!blob.size) { status.textContent = 'Не удалось записать видео'; updateControls(); return; }
        shotUrl = URL.createObjectURL(blob);
        shot = {file: new File([blob], blob.type.includes('mp4') ? 'video.mp4' : 'video.webm', {type: blob.type}), kind: 'video'};
        setReview(true);
        image.hidden = true;
        find('.camera-photo-zoom').hidden = true;
        showRecordedVideo(shotUrl);
        status.textContent = 'Видео готово. Проверьте и сохраните';
        updateControls();
      };
      recorder.onerror = () => { status.textContent = 'Ошибка записи. Остановите запись и попробуйте снова'; };
      recorder.start();
      panel.classList.add('is-recording');
      shutter.setAttribute('aria-label', 'Остановить запись');
      const started = Date.now();
      recordingTimer = setInterval(() => { status.textContent = `Запись · ${new Date(Date.now()-started).toISOString().slice(14,19)}`; }, 500);
      return;
    }
    status.textContent = "Получаем снимок…";
    const original = await takeStill(video, track);
    if (torchOn && capabilities.torch === true) await applyCameraSettings({torch: true});
    const bitmap = await createImageBitmap(original);
    let blob;
    try {
      const crop = cameraCrop(bitmap.width, bitmap.height, aspect, video.videoWidth > video.videoHeight);
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      canvas.getContext('2d').drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.98));
      if (!blob) throw new Error('Не удалось кадрировать снимок');
    } finally { bitmap.close(); }
    if (closed) return;
    shotUrl = URL.createObjectURL(blob);
    image.src = shotUrl;
    try {
      await image.decode();
    } catch (error) {
      discardShot();
      throw error;
    }
    if (closed) return;
    const extension = { "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" }[blob.type] || "jpg";
    shot = { kind: "photo", file: new File([blob], `photo.${extension}`, { type: blob.type || "image/jpeg" }) };
    status.textContent = `Снимок ${image.naturalWidth} × ${image.naturalHeight}`;
    setReview(true);
  }, "Не удалось начать съёмку. Проверьте разрешения камеры и микрофона.");
  };

  retake.onclick = () => {
    reviewingSaved = null;
    find(".photo-camera-review").classList.remove("is-saved-review");
    retake.removeAttribute("aria-label");
    save.removeAttribute("aria-label");
    retake.removeAttribute("title");
    save.removeAttribute("title");
    retake.textContent = "Переснять";
    save.textContent = "Сохранить и продолжить";
    discardShot();
    status.textContent = "Камера готова";
    setReview(false);
    shutter.focus();
  };
  save.onclick = () => run(async () => {
    if (reviewingSaved) {
      if (!onDelete || !await onDelete(reviewingSaved.id)) return;
      const index = sessionPhotos.indexOf(reviewingSaved);
      URL.revokeObjectURL(reviewingSaved.url);
      sessionPhotos.splice(index, 1);
      savedCount = sessionPhotos.length;
      reviewingSaved = null;
      renderFilmstrip();
      retake.onclick();
      return;
    }
    status.textContent = "Сохраняем снимок…";
    await onSave(shot);
    if (closed) return;
    sessionPhotos.push({id: shot.id, kind: shot.kind, url: URL.createObjectURL(shot.file)});
    savedCount = sessionPhotos.length;
    renderFilmstrip();
    discardShot();
    status.textContent = `Сохранено за сеанс: ${savedCount}`;
    setReview(false);
    requestAnimationFrame(() => shutter.focus());
  }, "Не удалось сохранить снимок. Попробуйте ещё раз.");
  video.addEventListener("resize", () => { updateControls(); refreshCaptureMode(); });
  video.addEventListener("loadeddata", updateControls);
  panel.addEventListener("cancel", event => event.preventDefault());
  exit.onclick = () => {
    if (recorder?.state === 'recording') { status.textContent = 'Остановите запись и сохраните видео перед выходом'; return; }
    history.close();
  };
  play.onclick = () => run(resumePreview, "Не удалось включить предпросмотр.");
  system.onclick = () => {
    panel.close();
    history.close();
    openSystemCamera(captureType);
  };
  renderFilmstrip();
  refreshCaptureMode();
  document.body.append(panel);
  panel.showModal();
  run(() => startCamera(), "Встроенная камера недоступна. Проверьте разрешение браузера.");
}
