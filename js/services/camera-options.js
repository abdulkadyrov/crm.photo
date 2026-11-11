export function describeCamera(label, index = 0) {
  const text = String(label || '');
  if (/front|user|передн|фронт/i.test(text)) return {name:'Фронтальная', hint:'Для съёмки себя. Для портрета ученика удобнее задняя камера.'};
  if (/tele|теле/i.test(text)) return {name:'Телекамера', hint:'Для портрета с расстояния при хорошем свете. В тесной комнате удобнее основная.'};
  if (/ultra|сверхшир/i.test(text)) return {name:'Сверхширокая', hint:'Для общего кадра класса или тесной комнаты. Лицо крупным планом у края может искажаться.'};
  if (/triple|тройн/i.test(text)) return {name:'Задняя · три объектива', hint:'Автоматический выбор заднего объектива. Для портрета начните с 1× при хорошем освещении.'};
  if (/dual|двойн/i.test(text)) return {name:'Задняя · два объектива', hint:'Система из двух задних объективов. Начните с 1×; доступный зум зависит от браузера.'};
  if (/back|rear|environment|задн|wide|широк/i.test(text)) return {name:'Основная задняя', hint:'Начните с неё для портретов и видео. Обычно это удобный выбор для съёмки ученика.'};
  return {name:`Камера ${index+1}`,hint:'Браузер не уточняет тип. Сравните кадр и выберите камеру, на которой лицо выглядит естественно.'};
}

export function chooseCameraRecordingType(isSupported, canPlay) {
  return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm']
    .find(type => isSupported(type) && canPlay(type)) || '';
}
export function recordedCameraBlob(chunks, fallbackType) {
  const nonempty = chunks.filter(chunk => chunk.size > 0);
  if (!nonempty.length) throw new Error('Камера не вернула видео');
  const type = nonempty.find(chunk => chunk.type)?.type || fallbackType || 'video/mp4';
  return new Blob(nonempty, {type});
}

export const CAMERA_ZOOM_STOPS = Object.freeze([0.5, 1, 2, 3, 5]);
// Relative distances keep the detent equally usable at wide and telephoto zoom.
// A wider release zone prevents flicker when a finger jitters at an anchor.
export function snapCameraZoom(value, range, anchor = null) {
  const clamped = Math.max(range.min, Math.min(range.max, value));
  const stops = CAMERA_ZOOM_STOPS.filter(stop => stop >= range.min && stop <= range.max);
  if (stops.includes(anchor) && Math.abs(Math.log(clamped / anchor)) <= Math.log(1.075)) {
    return {value: anchor, anchor};
  }
  const nearest = stops.find(stop => Math.abs(Math.log(clamped / stop)) <= Math.log(1.04));
  return nearest === undefined ? {value: clamped, anchor: null} : {value: nearest, anchor: nearest};
}
