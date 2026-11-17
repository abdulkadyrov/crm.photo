import { cameraCrop } from './camera-framing.js';

// drawImage must happen synchronously, before constraints, promises, or JPEG work.
export function freezeCameraFrame(video, aspect, createCanvas = () => document.createElement('canvas')) {
  if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) throw new Error('Поток камеры ещё не готов.');
  const crop = cameraCrop(video.videoWidth, video.videoHeight, aspect, video.videoWidth > video.videoHeight);
  const canvas = createCanvas();
  canvas.width = crop.width;
  canvas.height = crop.height;
  const context = canvas.getContext('2d', {alpha:false});
  if (!context) throw new Error('Не удалось получить кадр камеры.');
  context.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return canvas;
}

export function encodeCameraFrame(canvas) {
  return new Promise((resolve,reject) => canvas.toBlob(blob => {
    if (blob?.size) resolve(blob);
    else reject(new Error('Не удалось сохранить кадр камеры.'));
  }, 'image/jpeg', 0.98));
}

export function bindCameraShutter(button, {shoot, isPhoto, pointerEvents = typeof PointerEvent !== 'undefined'}) {
  if (pointerEvents) button.onpointerdown = event => {
    if (!isPhoto() || event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    shoot();
  };
  button.onclick = event => {
    // Pointer photos were already captured at press, keyboard/assistive clicks still work.
    if (pointerEvents && isPhoto() && event.detail > 0) return;
    shoot();
  };
}
