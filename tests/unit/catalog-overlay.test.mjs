import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../../js/core/legacy-app.js", import.meta.url), "utf8");
const body = source.slice(source.indexOf("function catalogServiceCard("), source.indexOf("\nfunction miniCatalogPreview("));
const render = vm.runInNewContext(`(${body})`, {
  servicePreviewImageDataUrl: item => item.image || "",
  servicePreviewVideoDataUrl: item => item.video || "",
  serviceName: item => item.name,
  escapeAttr: value => String(value).replaceAll('"', '&quot;'),
  escapeHtml: value => String(value),
  formatPrice: value => `${value} ₽`,
  serviceShortDescription: () => "Описание услуги",
  serviceCategory: () => "ИИ-видео",
  isServicePopular: () => false,
  serviceGenderLabel: () => "Для всех",
  childTemplateBadges: () => ""
});

for (const item of [
  { id: "interview", name: "Интервью", price: 1200, image: "portrait.jpg" },
  { id: "dragon", name: "Полёт на драконе", price: 1200, image: "dragon.jpg", video: "dragon.mp4" },
  { id: "video-only", name: "Видео", price: 1200, video: "preview.mp4" },
  { id: "photo", name: "Леди Баг", price: 350, image: "photo.jpg", childTemplate: true }
]) {
  test(`catalog card ${item.id} uses the same compact media overlay`, () => {
    const html = render(item);
    assert.match(html, /portrait-overlay-card/);
    assert.match(html, /catalog-card-preview portrait/);
    assert.doesNotMatch(html, /Описание услуги|catalog-card-badges/);
    assert(html.includes(item.name));
    assert(html.includes(`${item.price} ₽`));
    if (item.video && item.image) assert(html.includes(`poster="${item.image}"`));
  });
}

test("a service without media retains a readable fallback", () => {
  const html = render({ id: "empty", name: "Услуга", price: 350 });
  assert.doesNotMatch(html, /portrait-overlay-card/);
  assert.match(html, /catalog-card-empty/);
  assert.match(html, /Описание услуги/);
});
