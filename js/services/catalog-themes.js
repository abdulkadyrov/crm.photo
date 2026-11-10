export const CATALOG_THEMES = ['Принцессы', 'Вайнах', 'Супергерои', 'Бойцы'];
const patterns = {
  'Дисней': /дисней|disney|рапунцел|эльз|золушк|мерид|ариэль|моан|олаф|белосн[её]ж|белль|аврор|жасмин|tower-princess|ice-queen|forest-apple-princess|rose-princess|glass-slipper-princess|ocean-wayfinder/i,
  'Игры': /игр(?:а|ы|ов)|майнкрафт|роблокс|фортнайт|соник|тейлз|пикачу|block-world|hedgehog|speed-fox|electric-creature/i,
  'Профессии': /професси|космонавт|спасател|врач|пожарн|пилот|л[её]тчик|полицейск|повар|строител/i,
  'Принцессы': /принцесс|рапунцел|эльз|золушк|мерид|ариэль|princess|ice-queen/i,
  'Вайнах': /вайнах|чечен|ингуш|джигит|chechen|ingush|dzhigit|vainakh/i,
  'Супергерои': /супергеро|железный человек|человек.?паук|бэтмен|супермен|леди баг|superhero|armored-tech-hero|spider.?man|iron.?man/i,
  'Бойцы': /боец|бойц|спецназ|военн|солдат|кадет|мма|бокс|mma|military|special-unit|cadet/i
};
export function matchesCatalogTheme(service, theme) {
  if (!Object.hasOwn(patterns, theme)) return false;
  const text = [service.name, service.title, service.category, service.theme, ...(service.tags || [])].filter(Boolean).join(' ');
  return patterns[theme].test(text);
}
