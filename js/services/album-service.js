export function albumStatusLabel(status) {
  const labels = { not_started: "Не начат", shooting: "Съемка", editing: "Верстка", ready: "Готов", delivered: "Выдан" };
  return labels[status] || status || "";
}
