import {
  A4_CHILD_PORTRAIT_SCENES,
  A4_CHILD_PORTRAIT_TEMPLATE_IDS
} from "./child-portrait-a4-scenes.js";

export const CHILD_PORTRAIT_CATEGORY = "Детские образы";

export const SELECTED_CHILD_PORTRAIT_TEMPLATE_IDS = Object.freeze([
  "child-girl-fairytale-princess",
  "child-boy-pirate-captain",
  "child-boy-armored-tech-hero",
  "child-boy-medieval-knight",
  "child-boy-football-champion",
  "child-boy-chechen-dzhigit",
  "child-girl-long-haired-tower-princess",
  "child-girl-ice-queen",
  "child-girl-brave-highland-princess",
  "child-girl-eastern-princess-headscarf",
  "child-girl-magic-academy-hijab",
  "child-girl-horse-rider-headscarf",
  "child-girl-forest-fairy",
  "child-girl-ballerina-princess",
  "child-boy-santa-workshop",
  "child-girl-snowman-friend",
  "child-boy-rescue-puppy-team",
  "child-girl-fairy-tea-party",
  "child-boy-block-world-friend",
  "child-girl-electric-creature-friend",
  "child-boy-speed-fox-team",
  "child-girl-robot-friend",
  "child-boy-dragon-friend",
  "child-girl-superhero-team-up",
  ...A4_CHILD_PORTRAIT_TEMPLATE_IDS
]);

const selectedTemplateIds = new Set(SELECTED_CHILD_PORTRAIT_TEMPLATE_IDS);

const assetPath = (id, file) => `./assets/templates/children/${id}/${file}`;

const LEGACY_CANVAS = Object.freeze({
  format: "4:5",
  orientation: "portrait",
  width: 3072,
  height: 3840,
  previewWidth: 600,
  previewHeight: 750,
  dpi: 300,
  masterFile: "master.png"
});

const template = ({
  id,
  title,
  grade,
  gender,
  headwear = "none",
  theme,
  tags,
  description,
  faceGuide,
  canvas = LEGACY_CANVAS,
  enabled,
  version = 2
}) => ({
  id,
  title,
  grade,
  gender,
  headwear,
  theme,
  tags,
  description,
  masterSrc: assetPath(id, canvas.masterFile),
  previewSrc: assetPath(id, "preview.webp"),
  faceMaskSrc: assetPath(id, "face-mask.png"),
  metadataSrc: assetPath(id, "metadata.json"),
  faceGuide: { ...faceGuide, feather: 0.018 },
  canvas: { ...canvas },
  printFormat: canvas.format,
  enabled: enabled ?? selectedTemplateIds.has(id),
  version
});

export const CHILD_PORTRAIT_TEMPLATES = [
  template({
    id: "child-boy-pirate-captain", title: "Капитан пиратов", grade: 2, gender: "boy", theme: "pirate-captain",
    tags: ["пират", "корабль", "приключение"], description: "Добрый капитан на палубе парусника без оружия и пиратской символики.",
    faceGuide: { centerX: 0.5, centerY: 0.255, width: 0.235, height: 0.205 }
  }),
  template({
    id: "child-boy-armored-tech-hero", title: "Бронированный техногерой", grade: 2, gender: "boy", theme: "armored-tech-hero",
    tags: ["техногерой", "броня", "будущее"], description: "Оригинальный герой в графитово-синей технологичной броне с открытым лицом.",
    faceGuide: { centerX: 0.5, centerY: 0.245, width: 0.225, height: 0.195 }
  }),
  template({
    id: "child-boy-original-superhero", title: "Супергерой будущего", grade: 1, gender: "boy", theme: "original-superhero",
    tags: ["супергерой", "плащ", "город"], description: "Самостоятельный образ юного супергероя без чужих костюмов, эмблем и логотипов.",
    faceGuide: { centerX: 0.5, centerY: 0.25, width: 0.23, height: 0.2 }
  }),
  template({
    id: "child-boy-mma-champion", title: "Чемпион ММА", grade: 3, gender: "boy", theme: "mma-champion",
    tags: ["мма", "спорт", "чемпион"], description: "Спокойный спортивный портрет юного чемпиона в безопасной тренировочной сцене.",
    faceGuide: { centerX: 0.5, centerY: 0.255, width: 0.225, height: 0.195 }
  }),
  template({
    id: "child-boy-racing-champion", title: "Гоночный чемпион", grade: 2, gender: "boy", theme: "racing-champion",
    tags: ["гонщик", "автоспорт", "чемпион"], description: "Юный пилот в универсальном гоночном костюме без командных брендов.",
    faceGuide: { centerX: 0.5, centerY: 0.255, width: 0.225, height: 0.195 }
  }),
  template({
    id: "child-boy-medieval-knight", title: "Рыцарь королевства", grade: 2, gender: "boy", theme: "medieval-knight",
    tags: ["рыцарь", "замок", "сказка"], description: "Парадный рыцарь в синем и серебряном доспехе, без оружия.",
    faceGuide: { centerX: 0.5, centerY: 0.25, width: 0.22, height: 0.19 }
  }),
  template({
    id: "child-boy-football-champion", title: "Футбольный чемпион", grade: 3, gender: "boy", theme: "football-champion",
    tags: ["футбол", "стадион", "медаль"], description: "Чемпион на стадионе в оригинальной форме без клубных эмблем.",
    faceGuide: { centerX: 0.5, centerY: 0.255, width: 0.225, height: 0.195 }
  }),
  template({
    id: "child-boy-military-cadet", title: "Парадный кадет", grade: 4, gender: "boy", theme: "ceremonial-cadet",
    tags: ["кадет", "парадный", "форма"], description: "Вымышленная парадная форма без символов реальных армий, флагов и оружия.",
    faceGuide: { centerX: 0.5, centerY: 0.235, width: 0.215, height: 0.185 }
  }),
  template({
    id: "child-boy-rescue-special-unit", title: "Спасатель спецотряда", grade: 4, gender: "boy", theme: "rescue-special-unit",
    tags: ["спасатель", "спецотряд", "герой"], description: "Специалист вымышленного спасательного подразделения без оружия и военных знаков.",
    faceGuide: { centerX: 0.5, centerY: 0.225, width: 0.22, height: 0.19 }
  }),
  template({
    id: "child-boy-chechen-dzhigit", title: "Чеченский джигит", grade: 4, gender: "boy", headwear: "traditional-hat", theme: "chechen-dzhigit",
    tags: ["чеченец", "джигит", "черкеска", "горы"], description: "Уважительный национальный образ в черкеске и папахе на фоне Кавказских гор.",
    faceGuide: { centerX: 0.5, centerY: 0.285, width: 0.215, height: 0.18 }
  }),
  template({
    id: "child-boy-space-explorer", title: "Исследователь космоса", grade: 1, gender: "boy", theme: "space-explorer",
    tags: ["космонавт", "космос", "станция"], description: "Юный исследователь в оригинальном светлом скафандре без логотипов.",
    faceGuide: { centerX: 0.5, centerY: 0.245, width: 0.225, height: 0.195 }
  }),
  template({
    id: "child-boy-santa-workshop", title: "В гостях у Деда Мороза", grade: 0, gender: "boy", theme: "santa-workshop",
    tags: ["садик", "дед мороз", "новый год", "игрушки"], description: "Ребёнок идёт за руку с добрым Дедом Морозом по волшебной мастерской игрушек.",
    faceGuide: { centerX: 0.455, centerY: 0.265, width: 0.22, height: 0.2 }
  }),
  template({
    id: "child-boy-rescue-puppy-team", title: "Щенки-спасатели", grade: 0, gender: "boy", theme: "rescue-puppy-team",
    tags: ["садик", "щенки", "спасатели", "команда"], description: "Ребёнок обнимает дружную команду оригинальных щенков-спасателей.",
    faceGuide: { centerX: 0.51, centerY: 0.235, width: 0.21, height: 0.195 }
  }),
  template({
    id: "child-boy-block-world-friend", title: "Друг из блочного мира", grade: 1, gender: "boy", theme: "block-world-friend",
    tags: ["игра", "блочный мир", "голем", "приключение"], description: "Юный исследователь даёт пять доброму каменному голему в оригинальном блочном мире.",
    faceGuide: { centerX: 0.43, centerY: 0.3, width: 0.22, height: 0.19 }
  }),
  template({
    id: "child-boy-speed-fox-team", title: "Скоростной лис", grade: 2, gender: "boy", theme: "speed-fox-team",
    tags: ["игра", "скорость", "лис", "гонка"], description: "Ребёнок празднует победу вместе с оригинальным героем скоростной трассы.",
    faceGuide: { centerX: 0.34, centerY: 0.18, width: 0.23, height: 0.19 }
  }),
  template({
    id: "child-boy-dragon-friend", title: "Друг дракона", grade: 2, gender: "boy", theme: "dragon-friend",
    tags: ["дракон", "замок", "дружба", "приключение"], description: "Ребёнок гладит доброго молодого дракона в солнечной замковой долине.",
    faceGuide: { centerX: 0.39, centerY: 0.255, width: 0.24, height: 0.21 }
  }),
  template({
    id: "child-girl-fairytale-princess", title: "Сказочная принцесса", grade: 1, gender: "girl", theme: "fairytale-princess",
    tags: ["принцесса", "дворец", "сказка"], description: "Классический оригинальный образ принцессы в дворцовом саду.",
    faceGuide: { centerX: 0.5, centerY: 0.255, width: 0.225, height: 0.195 }
  }),
  template({
    id: "child-girl-unicorn-world", title: "Волшебный мир единорогов", grade: 2, gender: "girl", theme: "unicorn-world",
    tags: ["единорог", "магия", "кристаллы"], description: "Лавандовый волшебный мир с единорогом на дальнем плане.",
    faceGuide: { centerX: 0.5, centerY: 0.265, width: 0.225, height: 0.195 }
  }),
  template({
    id: "child-girl-long-haired-tower-princess", title: "Принцесса солнечной башни", grade: 2, gender: "girl", theme: "tower-princess",
    tags: ["длинные волосы", "башня", "принцесса"], description: "Оригинальная длинноволосая принцесса в библиотеке солнечной башни.",
    faceGuide: { centerX: 0.5, centerY: 0.255, width: 0.215, height: 0.19 }
  }),
  template({
    id: "child-girl-ice-queen", title: "Ледяная королева", grade: 4, gender: "girl", theme: "ice-queen",
    tags: ["лед", "зима", "королева"], description: "Самостоятельный образ ледяной королевы в северном дворце под сиянием.",
    faceGuide: { centerX: 0.5, centerY: 0.25, width: 0.22, height: 0.19 }
  }),
  template({
    id: "child-girl-brave-highland-princess", title: "Смелая принцесса гор", grade: 3, gender: "girl", theme: "brave-highland-princess",
    tags: ["смелая", "горы", "принцесса"], description: "Оригинальная отважная исследовательница высокогорья без оружия.",
    faceGuide: { centerX: 0.5, centerY: 0.27, width: 0.215, height: 0.185 }
  }),
  template({
    id: "child-girl-eastern-princess-headscarf", title: "Восточная принцесса", grade: 3, gender: "girl", headwear: "headscarf", theme: "eastern-princess",
    tags: ["восточная принцесса", "платок", "дворец"], description: "Сказочный восточный образ в лёгком платке, полностью открывающем лицо.",
    faceGuide: { centerX: 0.5, centerY: 0.265, width: 0.21, height: 0.185 }
  }),
  template({
    id: "child-girl-magic-academy-hijab", title: "Академия магии", grade: 2, gender: "girl", headwear: "hijab", theme: "magic-academy",
    tags: ["магия", "академия", "хиджаб"], description: "Ученица доброй академии магии в аккуратном светлом хиджабе.",
    faceGuide: { centerX: 0.5, centerY: 0.285, width: 0.205, height: 0.18 }
  }),
  template({
    id: "child-girl-horse-rider-headscarf", title: "Юная наездница", grade: 4, gender: "girl", headwear: "headscarf", theme: "horse-rider",
    tags: ["лошадь", "наездница", "платок"], description: "Мирный конный портрет в светлом платке и парадной экипировке.",
    faceGuide: { centerX: 0.5, centerY: 0.255, width: 0.21, height: 0.185 }
  }),
  template({
    id: "child-girl-sea-princess", title: "Морская принцесса", grade: 2, gender: "girl", theme: "sea-princess",
    tags: ["море", "русалка", "подводный дворец"], description: "Оригинальная морская принцесса в кораллово-бирюзовом подводном дворце.",
    faceGuide: { centerX: 0.5, centerY: 0.255, width: 0.22, height: 0.19 }
  }),
  template({
    id: "child-girl-forest-fairy", title: "Лесная фея", grade: 1, gender: "girl", theme: "forest-fairy",
    tags: ["фея", "лес", "крылья"], description: "Добрая лесная фея с крыльями за плечами и открытым лицом.",
    faceGuide: { centerX: 0.5, centerY: 0.255, width: 0.22, height: 0.19 }
  }),
  template({
    id: "child-girl-ballerina-princess", title: "Балерина-принцесса", grade: 3, gender: "girl", theme: "ballerina-princess",
    tags: ["балерина", "театр", "принцесса"], description: "Парадный балетный портрет на сцене классического театра.",
    faceGuide: { centerX: 0.5, centerY: 0.235, width: 0.215, height: 0.185 }
  }),
  template({
    id: "child-girl-snowman-friend", title: "Друг-снеговик", grade: 0, gender: "girl", theme: "snowman-friend",
    tags: ["садик", "снеговик", "зима", "новый год"], description: "Ребёнок даёт пять доброму снеговику в сказочной зимней деревне.",
    faceGuide: { centerX: 0.39, centerY: 0.365, width: 0.24, height: 0.215 }
  }),
  template({
    id: "child-girl-fairy-tea-party", title: "Чаепитие с феями", grade: 0, gender: "girl", theme: "fairy-tea-party",
    tags: ["садик", "феи", "чаепитие", "волшебный сад"], description: "Ребёнок устраивает чаепитие с маленькими оригинальными цветочными феями.",
    faceGuide: { centerX: 0.48, centerY: 0.255, width: 0.25, height: 0.21 }
  }),
  template({
    id: "child-girl-electric-creature-friend", title: "Искристый зверёк", grade: 1, gender: "girl", theme: "electric-creature-friend",
    tags: ["игра", "волшебный зверёк", "лес", "приключение"], description: "Ребёнок держит за лапку оригинального искристого лесного зверька.",
    faceGuide: { centerX: 0.36, centerY: 0.165, width: 0.23, height: 0.19 }
  }),
  template({
    id: "child-girl-robot-friend", title: "Робот-друг", grade: 2, gender: "girl", theme: "robot-friend",
    tags: ["робот", "будущее", "дружба", "город"], description: "Ребёнок идёт за руку с добрым роботом-помощником по саду города будущего.",
    faceGuide: { centerX: 0.35, centerY: 0.28, width: 0.23, height: 0.2 }
  }),
  template({
    id: "child-girl-superhero-team-up", title: "Команда супергероев", grade: 2, gender: "girl", theme: "superhero-team-up",
    tags: ["супергерой", "команда", "город", "приключение"], description: "Ребёнок приветствует оригинальную супергероиню на крыше города будущего.",
    faceGuide: { centerX: 0.36, centerY: 0.34, width: 0.24, height: 0.21 }
  }),
  ...A4_CHILD_PORTRAIT_SCENES.map(template)
];

export function childPortraitCatalogRecord(item, index = 0) {
  const prompt = `Сохрани лицо, возраст и индивидуальные черты ребёнка с исходной фотографии. Аккуратно совмести лицо с шаблоном «${item.title}», сохрани естественную кожу, свет и резкость. Не меняй мимику, форму лица и этнические особенности.`;
  return {
    id: item.id,
    title: item.title,
    name: item.title,
    mediaKind: "photo",
    price: "0",
    shortDescription: item.description,
    description: `${item.description} Подготовлены мастер ${item.canvas.width}×${item.canvas.height}${item.canvas.format === "A4" ? " (A4, 300 dpi)" : ""}, превью и мягкая маска лица.`,
    gender: item.gender === "boy" ? "boys" : "girls",
    category: CHILD_PORTRAIT_CATEGORY,
    popular: false,
    orderIndex: 1000 + index,
    orderInfo: "Выберите фотографию ребёнка в карточке ученика и откройте монтаж.",
    requirements: "Фронтальное фото ребёнка, ровный свет, открытые глаза, лицо без перекрытий.",
    angles: [{ id: "portrait", name: "Портрет по шаблону", details: "Фронтальный портрет для замены лица.", refDataUrl: item.previewSrc, refName: `${item.id}-preview.webp` }],
    prompt,
    tags: [...item.tags],
    childTemplate: true,
    systemTemplate: true,
    systemTemplateVersion: item.version,
    grade: item.grade,
    headwear: item.headwear,
    theme: item.theme,
    masterSrc: item.masterSrc,
    previewSrc: item.previewSrc,
    faceMaskSrc: item.faceMaskSrc,
    metadataSrc: item.metadataSrc,
    faceGuide: { ...item.faceGuide },
    canvas: { ...item.canvas },
    printFormat: item.printFormat,
    enabled: item.enabled
  };
}
