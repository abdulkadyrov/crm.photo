import assert from "node:assert/strict";
import test from "node:test";
import { classServiceCounts, shootingRoster, splitPopularServices } from "../../js/services/shooting-roster.js";
import { groupPickerServices, matchesCatalogTheme } from "../../js/services/catalog-themes.js";

test("shooting roster groups by service audience and surname, then indexes surnames", () => {
  const students = [
    { lastName: "Петрова", firstName: "София", audiences: [] },
    { lastName: "Якубов", firstName: "Ильяс", audiences: ["unisex"] },
    { lastName: "Айдин", firstName: "Зара", audiences: ["girls"] },
    { lastName: "Алиев", firstName: "Али", audiences: ["boys", "girls"] },
    { lastName: "Ким", firstName: "Саша", audiences: [] },
    { lastName: "Ярова", firstName: "Маша", audiences: [] }
  ];
  const groups = shootingRoster(students, student => student.audiences);
  assert.deepEqual(groups.map(({ group, letters }) => [group, letters.map(([letter]) => letter)]), [
    ["boys", ["А", "Я"]],
    ["girls", ["А", "П", "Я"]],
    ["unknown", ["К"]]
  ]);
});

test("class popularity counts each student's saved service once and keeps every matching card", () => {
  const students = [
    { classId: "4Б", selected: ["x", "x", "y"] },
    { classId: "4Б", selected: ["y", "z"] },
    { classId: "4А", selected: ["x", "w"] }
  ];
  const counts = classServiceCounts(students, "4Б", student => student.selected);
  const services = ["w", "x", "y", "z"].map(id => ({ id }));
  assert.deepEqual([...counts], [["x", 1], ["y", 2], ["z", 1]]);
  assert.deepEqual(splitPopularServices(services, counts, 2), {
    popular: [{ id: "y" }, { id: "x" }],
    others: [{ id: "w" }, { id: "z" }]
  });
  assert.deepEqual(splitPopularServices(services, classServiceCounts(students, "new", student => student.selected)), {
    popular: [], others: services
  });
});

test("picker themes recognize existing Disney, game and profession entries", () => {
  assert.equal(matchesCatalogTheme({ title: "Рапунцель" }, "Дисней"), true);
  assert.equal(matchesCatalogTheme({ category: "Игровые фотомонтажи" }, "Игры"), true);
  assert.equal(matchesCatalogTheme({ tags: ["космонавт"] }, "Профессии"), true);
  assert.equal(matchesCatalogTheme({ title: "Эльза" }, "Бойцы"), false);
});

test("picker groups each service once and keeps specific catalog categories", () => {
  const services = [
    { id: "portrait", title: "Школьный портрет", category: "Фото" },
    { id: "disney", title: "Рапунцель", category: "Детские образы" },
    { id: "game", title: "Герой игры", category: "Игровые фотомонтажи" },
    { id: "video", title: "Путешествие с Эльзой", category: "ИИ-видео" },
    { id: "hero", title: "Железный человек", category: "Детские образы" },
    { id: "other", title: "Без категории" }
  ];
  assert.deepEqual(groupPickerServices(services).map(group => [group.title, group.items.map(item => item.id)]), [
    ["Супергерои", ["hero"]],
    ["Дисней", ["disney"]],
    ["Игры", ["game"]],
    ["Фото", ["portrait"]],
    ["ИИ-видео", ["video"]],
    ["Другие услуги", ["other"]]
  ]);
});
