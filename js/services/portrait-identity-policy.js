export const PORTRAIT_IDENTITY_POLICY = 'Лицо ребёнка из исходной фотографии неприкосновенно. Сохрани без изменений личность, возраст, пропорции и форму лица, глаза, нос, губы, взгляд, положение головы, мимику, улыбку и эмоцию. Не перерисовывай и не улучшай черты лица. Разрешена только лёгкая ретушь временных дефектов кожи и мягкая коррекция освещения и цвета без изменения внешности. Если точное сохранение лица невозможно, не выдавай изменённый результат как готовую работу.';
export function withPortraitIdentityPolicy(prompt) {
  const text = String(prompt || '').trim();
  if (!text || text.includes(PORTRAIT_IDENTITY_POLICY)) return text;
  return `${PORTRAIT_IDENTITY_POLICY}\n\n${text}`;
}
