// Crop stays in normalized coordinates so pointer and keyboard input work at any size.
export function createPhotoCrop(file, index) {
  const url = URL.createObjectURL(file);
  const root = document.createElement('details');
  root.open = true;
  root.className = 'roster-photo-crop';
  root.innerHTML = `<summary></summary><p>Обведите область с номерами, фамилиями и именами. Или задайте границы в процентах ниже.</p><div class="roster-crop-stage"><img alt=""><div class="roster-crop-box"></div></div><div class="roster-crop-fields"></div><button type="button" class="secondary-button" data-reset-crop>Всё фото</button>`;
  root.querySelector('summary').textContent = `Фото ${index + 1} · ${file.name}`;
  const stage = root.querySelector('.roster-crop-stage'), box = root.querySelector('.roster-crop-box'), img = root.querySelector('img');
  img.src = url; img.alt = `Область распознавания на фото ${index + 1}`; img.draggable = false;
  const crop = {left: 0, top: 0, right: 100, bottom: 100};
  const fields = {};
  const draw = () => {
    box.style.left = `${crop.left}%`; box.style.top = `${crop.top}%`;
    box.style.width = `${crop.right - crop.left}%`; box.style.height = `${crop.bottom - crop.top}%`;
    for (const [key, field] of Object.entries(fields)) field.value = Math.round(crop[key]);
  };
  for (const [key, title] of [['left','Слева'],['top','Сверху'],['right','Справа'],['bottom','Снизу']]) {
    const label = document.createElement('label'), input = document.createElement('input');
    label.textContent = `${title}, %`; input.type = 'number'; input.min = '0'; input.max = '100'; input.step = '1'; input.dataset.crop = key;
    input.onchange = () => {
      const value = Number(input.value);
      if (Number.isFinite(value)) crop[key] = Math.min(100, Math.max(0, value));
      if (crop.right <= crop.left || crop.bottom <= crop.top) { crop.left = 0; crop.top = 0; crop.right = 100; crop.bottom = 100; }
      draw();
    };
    fields[key] = input; label.append(input); root.querySelector('.roster-crop-fields').append(label);
  }
  let start = null;
  const point = event => { const rect = stage.getBoundingClientRect(); return {x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)), y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100))}; };
  stage.onpointerdown = event => { if (event.button !== 0) return; event.preventDefault(); start = point(event); stage.setPointerCapture(event.pointerId); };
  stage.onpointermove = event => {
    if (!start) return;
    const end = point(event);
    crop.left = Math.min(start.x, end.x); crop.right = Math.max(start.x, end.x);
    crop.top = Math.min(start.y, end.y); crop.bottom = Math.max(start.y, end.y); draw();
  };
  stage.onpointerup = stage.onpointercancel = () => { start = null; if (crop.right - crop.left < 2 || crop.bottom - crop.top < 2) Object.assign(crop,{left:0,top:0,right:100,bottom:100}); draw(); };
  root.querySelector('[data-reset-crop]').onclick = () => { Object.assign(crop,{left:0,top:0,right:100,bottom:100}); draw(); };
  draw();
  return {root, crop, dispose: () => URL.revokeObjectURL(url)};
}
