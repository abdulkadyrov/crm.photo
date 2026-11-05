export const CATALOG_THEMES = ['Принцессы', 'Вайнах', 'Супергерои', 'Бойцы'];
const patterns = {
  'Принцессы': /принцесс|рапунцел|эльз|золушк|мерид|ариэль|princess|ice-queen/i,
  'Вайнах': /вайнах|чечен|ингуш|джигит|chechen|ingush|dzhigit|vainakh/i,
  'Супергерои': /супергеро|железный человек|человек.?паук|бэтмен|супермен|леди баг|superhero|armored-tech-hero|spider.?man|iron.?man/i,
  'Бойцы': /боец|бойц|спецназ|военн|солдат|кадет|мма|бокс|mma|military|special-unit|cadet/i
};
export function matchesCatalogTheme(service, theme) {
  if (!patterns[theme]) return false;
  const text = [service.name, service.title, service.category, service.theme, ...(service.tags || [])].filter(Boolean).join(' ');
  return patterns[theme].test(text);
}
