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

export function openPhotoCamera({ studentName, mountHistory, onSave, onClose, openSystemCamera }) {
  if (document.querySelector(".photo-camera")) return;
  const panel = document.createElement("dialog");
  panel.className = "photo-camera";
  panel.setAttribute("aria-label", "Фотосъёмка");
  panel.innerHTML = `
    <header class="photo-camera-header">
      <div><h2>Фотосъёмка</h2><p data-camera-student></p></div>
      <button class="photo-camera-button" data-camera-close type="button" autofocus>Выйти</button>
    </header>
    <div class="photo-camera-stage">
      <video autoplay muted playsinline></video>
      <img alt="Снятая фотография" hidden />
      <div class="photo-camera-guide" aria-hidden="true" hidden></div>
    </div>
    <footer class="photo-camera-controls">
      <p class="photo-camera-status" role="status"></p>
      <div class="photo-camera-modes" data-camera-live>
        <button class="photo-camera-button" type="button" data-camera-mode="auto" aria-pressed="true">Авто</button>
        <button class="photo-camera-button" type="button" data-camera-mode="low" aria-pressed="false">Мало света</button>
        <button class="photo-camera-button" type="button" data-camera-mode="pro" aria-pressed="false">Профи</button>
      </div>
      <div class="photo-camera-manual" data-camera-manual hidden></div>
      <button class="photo-camera-button photo-camera-primary" data-camera-shutter data-camera-live type="button" disabled>Сфотографировать</button>
      <button class="photo-camera-button" data-camera-play type="button" hidden>Включить предпросмотр</button>
      <div class="photo-camera-review" hidden>
        <button class="photo-camera-button" data-camera-retake type="button">Переснять</button>
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
  const system = find("[data-camera-system]");
  const play = find("[data-camera-play]");
  const modes = [...panel.querySelectorAll("[data-camera-mode]")];
  const status = find(".photo-camera-status");
  find("[data-camera-student]").textContent = studentName;

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
  let busy = false;
  let closed = false;

  const stopStream = () => {
    stream?.getTracks().forEach(item => item.stop());
    video.srcObject = null;
    stream = track = null;
  };
  const discardShot = () => {
    image.removeAttribute("src");
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shot = shotUrl = null;
  };
  const history = mountHistory(() => {
    closed = true;
    stopStream();
    discardShot();
    panel.close();
    panel.remove();
    onClose();
  });
  const updateControls = () => {
    const ready = track?.readyState === "live";
    shutter.disabled = busy || !ready || !video.videoWidth;
    retake.disabled = save.disabled = busy;
    play.disabled = busy;
    modes.forEach(button => {
      button.disabled = busy || !ready || (button.dataset.cameraMode === "low" && !canBrighten());
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
        console.warn(errorMessage, error);
        status.textContent = errorMessage;
      }
    } finally {
      busy = false;
      if (!closed) updateControls();
    }
  };
  const setReview = reviewing => {
    panel.classList.toggle("is-reviewing", reviewing);
    image.hidden = !reviewing;
    panel.querySelectorAll("[data-camera-live]").forEach(control => { control.hidden = reviewing; });
    find(".photo-camera-review").hidden = !reviewing;
    manual.hidden = reviewing || mode !== "pro";
    find(".photo-camera-guide").hidden = reviewing || mode !== "pro";
  };
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
      devices = (await navigator.mediaDevices.enumerateDevices?.().catch(() => []) || []).filter(device => device.kind === "videoinput");
      if (closed) return;
      mode = mode === "low" && !canBrighten() ? "auto" : mode;
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
    await track.applyConstraints({ ...baseConstraints, advanced: [values] });
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
    if (devices.length > 1) {
      const label = document.createElement("label");
      label.textContent = "Камера";
      const select = document.createElement("select");
      devices.forEach((device, index) => select.add(new Option(device.label || `Камера ${index + 1}`, device.deviceId)));
      select.value = defaults.deviceId || select.options[0].value;
      select.onchange = () => run(() => startCamera(select.value), "Не удалось переключить камеру.");
      label.append(select);
      manual.append(label);
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
    const next = button.dataset.cameraMode;
    if (next === mode) return;
    const values = Object.fromEntries(
      ["zoom", "exposureCompensation", "exposureMode", "whiteBalanceMode", "focusMode"]
        .filter(key => defaults[key] !== undefined)
        .map(key => [key, defaults[key]])
    );
    if (capabilities.torch === true) values.torch = next === "low";
    const exposure = rangeOf(capabilities, "exposureCompensation");
    if (exposure && next === "low") values.exposureCompensation = inRange(1, exposure);
    await applyCameraSettings(values);
    mode = next;
    status.textContent = next === "low" ? "Подсветка и экспозиция по возможностям камеры" : "Камера готова";
    renderManual();
    setReview(false);
  }, "Не удалось применить режим к этой камере.");

  shutter.onclick = () => run(async () => {
    status.textContent = "Получаем снимок…";
    const blob = await takeStill(video, track);
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
    shot = { file: new File([blob], `photo.${extension}`, { type: blob.type || "image/jpeg" }) };
    status.textContent = `Снимок ${image.naturalWidth} × ${image.naturalHeight}`;
    setReview(true);
  }, "Не удалось получить снимок. Попробуйте ещё раз.");

  retake.onclick = () => {
    discardShot();
    status.textContent = "Камера готова";
    setReview(false);
    shutter.focus();
  };
  save.onclick = () => run(async () => {
    status.textContent = "Сохраняем снимок…";
    await onSave(shot);
    if (closed) return;
    savedCount += 1;
    discardShot();
    status.textContent = `Сохранено за сеанс: ${savedCount}`;
    setReview(false);
    requestAnimationFrame(() => shutter.focus());
  }, "Не удалось сохранить снимок. Попробуйте ещё раз.");
  video.addEventListener("resize", updateControls);
  video.addEventListener("loadeddata", updateControls);
  panel.addEventListener("cancel", event => event.preventDefault());
  exit.onclick = () => history.close();
  play.onclick = () => run(resumePreview, "Не удалось включить предпросмотр.");
  system.onclick = () => {
    panel.close();
    history.close();
    openSystemCamera();
  };
  document.body.append(panel);
  panel.showModal();
  run(() => startCamera(), "Встроенная камера недоступна. Проверьте разрешение браузера.");
}
