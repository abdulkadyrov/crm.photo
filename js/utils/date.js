export function nowIso() {
  return new Date().toISOString();
}

export function formatDateTime(value, locale = "ru-RU") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
