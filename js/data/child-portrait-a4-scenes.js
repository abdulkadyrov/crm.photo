export const A4_CHILD_PORTRAIT_CANVAS = Object.freeze({
  format: "A4",
  orientation: "portrait",
  width: 2480,
  height: 3508,
  previewWidth: 600,
  previewHeight: 849,
  dpi: 300,
  masterFile: "master.jpg"
});

const centeredFace = Object.freeze({ centerX: 0.5, centerY: 0.275, width: 0.175, height: 0.155 });
const centeredCadetFace = Object.freeze({ centerX: 0.5, centerY: 0.235, width: 0.17, height: 0.15 });
const teamFace = Object.freeze({ centerX: 0.36, centerY: 0.27, width: 0.17, height: 0.15 });

const scene = ({ headwear = "none", faceGuide = teamFace, ...item }) => ({
  ...item,
  headwear,
  faceGuide,
  canvas: A4_CHILD_PORTRAIT_CANVAS,
  enabled: true,
  version: 3
});

export const A4_CHILD_PORTRAIT_SCENES = Object.freeze([
  scene({ id: "child-boy-chechen-mosque-dawn", title: "У мечети на рассвете", grade: 3, gender: "boy", headwear: "traditional-hat", theme: "chechen-mosque-dawn", tags: ["чечня", "мечеть", "черкеска", "горы", "a4"], description: "Чеченский национальный образ на рассвете во дворе мечети и на фоне Кавказских гор.", faceGuide: centeredFace }),
  scene({ id: "child-boy-chechen-stone-tower", title: "У древней башни", grade: 3, gender: "boy", headwear: "traditional-hat", theme: "chechen-stone-tower", tags: ["чечня", "башня", "черкеска", "горы", "a4"], description: "Национальный образ у древней вайнахской башни в высокогорной долине.", faceGuide: centeredFace }),
  scene({ id: "child-boy-chechen-wolf-guardian", title: "Страж гор и волк", grade: 4, gender: "boy", headwear: "traditional-hat", theme: "chechen-wolf-guardian", tags: ["чечня", "волк", "черкеска", "горы", "a4"], description: "Юный горец и спокойный кавказский волк на вершине над облаками.", faceGuide: centeredFace }),
  scene({ id: "child-boy-chechen-horse-valley", title: "Джигит с конём", grade: 4, gender: "boy", headwear: "traditional-hat", theme: "chechen-horse-valley", tags: ["чечня", "конь", "долина", "черкеска", "a4"], description: "Парадный национальный портрет с конём в солнечной горной долине.", faceGuide: centeredFace }),
  scene({ id: "child-boy-chechen-fortress-sunset", title: "Крепость на закате", grade: 4, gender: "boy", headwear: "traditional-hat", theme: "chechen-fortress-sunset", tags: ["чечня", "крепость", "мост", "горы", "a4"], description: "Чеченский национальный образ перед старинной крепостью и каменным мостом.", faceGuide: centeredFace }),
  scene({ id: "child-boy-chechen-waterfall", title: "У горного водопада", grade: 3, gender: "boy", headwear: "traditional-hat", theme: "chechen-waterfall", tags: ["чечня", "водопад", "лес", "черкеска", "a4"], description: "Светлый национальный костюм у большого горного водопада.", faceGuide: centeredFace }),
  scene({ id: "child-boy-winter-cadet", title: "Зимний кадет", grade: 4, gender: "boy", headwear: "traditional-hat", theme: "winter-cadet", tags: ["кадет", "форма", "зима", "парадный", "a4"], description: "Мирный парадный кадет в зимнем дворе академии без оружия и знаков реальных армий.", faceGuide: centeredCadetFace }),
  scene({ id: "child-boy-rescue-unit", title: "Горный спасатель", grade: 4, gender: "boy", theme: "mountain-rescue-unit", tags: ["спасатель", "спецотряд", "каска", "горы", "a4"], description: "Юный участник вымышленного горно-спасательного отряда с каской и рацией.", faceGuide: centeredCadetFace }),
  scene({ id: "child-boy-field-observer", title: "Полевой наблюдатель", grade: 4, gender: "boy", theme: "field-observer", tags: ["форма", "бинокль", "экспедиция", "пустыня", "a4"], description: "Постановочный образ мирного полевого наблюдателя в исследовательском лагере.", faceGuide: centeredCadetFace }),
  scene({ id: "child-boy-rescue-helicopter-pilot", title: "Пилот спасательной службы", grade: 4, gender: "boy", theme: "rescue-helicopter-pilot", tags: ["спасатель", "пилот", "вертолёт", "горы", "a4"], description: "Юный пилот вымышленной спасательной службы на мирной горной площадке.", faceGuide: centeredCadetFace }),
  scene({ id: "child-boy-solar-cape-guardian", title: "Солнечный страж", grade: 2, gender: "boy", theme: "solar-cape-guardian", tags: ["супергерой", "плащ", "город", "команда", "a4"], description: "Ребёнок рядом с оригинальным солнечным защитником в плаще." }),
  scene({ id: "child-boy-emerald-giant-friend", title: "Изумрудный великан", grade: 2, gender: "boy", theme: "emerald-giant-friend", tags: ["супергерой", "великан", "наука", "дружба", "a4"], description: "Добрый изумрудный великан показывает большой палец рядом с ребёнком." }),
  scene({ id: "child-boy-iron-tech-guardian", title: "Железный техностраж", grade: 3, gender: "boy", theme: "iron-tech-guardian", tags: ["супергерой", "броня", "технологии", "команда", "a4"], description: "Оригинальный бронированный техностраж рядом с ребёнком в городе будущего." }),
  scene({ id: "child-boy-thunder-guardian", title: "Громовой защитник", grade: 3, gender: "boy", theme: "thunder-guardian", tags: ["супергерой", "гром", "броня", "горы", "a4"], description: "Ребёнок в команде с оригинальным защитником небесной обсерватории." }),
  scene({ id: "child-boy-speed-hedgehog-friend", title: "Скоростной синий друг", grade: 1, gender: "boy", theme: "speed-hedgehog-friend", tags: ["мультфильм", "скорость", "синий зверёк", "дружба", "a4"], description: "Весёлый скоростной зверёк даёт ребёнку пять на яркой трассе." }),
  scene({ id: "child-boy-night-wing-guardian", title: "Ночной крылатый страж", grade: 3, gender: "boy", theme: "night-wing-guardian", tags: ["супергерой", "ночь", "крылья", "город", "a4"], description: "Оригинальный крылатый защитник рядом с ребёнком в лунном саду." }),
  scene({ id: "child-boy-ninja-turtle-friend", title: "Черепаха-исследователь", grade: 1, gender: "boy", theme: "ninja-turtle-friend", tags: ["мультфильм", "черепаха", "исследователь", "дружба", "a4"], description: "Добрая черепаха-путешественник приветствует ребёнка в вечернем саду." }),
  scene({ id: "child-boy-robot-lion-pilot", title: "Белый робот-лев", grade: 2, gender: "boy", theme: "robot-lion-pilot", tags: ["робот", "лев", "космос", "дружба", "a4"], description: "Ребёнок рядом с благородным белым роботом-львом в космическом ангаре." }),
  scene({ id: "child-boy-cosmic-ranger-friend", title: "Космический рейнджер", grade: 2, gender: "boy", theme: "cosmic-ranger-friend", tags: ["космос", "рейнджер", "планета", "команда", "a4"], description: "Оригинальный космический исследователь показывает ребёнку карту далёкой планеты." }),
  scene({ id: "child-boy-city-hero-shield", title: "Герой энергетического щита", grade: 3, gender: "boy", theme: "city-hero-shield", tags: ["супергерой", "щит", "город", "команда", "a4"], description: "Ребёнок рядом с оригинальным городским героем и светящимся энергетическим щитом." }),

  scene({ id: "child-girl-chechen-mosque-garden", title: "В саду у мечети", grade: 3, gender: "girl", headwear: "headscarf", theme: "chechen-mosque-garden", tags: ["чечня", "мечеть", "национальное платье", "сад", "a4"], description: "Чеченский национальный образ в цветущем саду у мечети.", faceGuide: centeredFace }),
  scene({ id: "child-girl-chechen-stone-tower", title: "Девочка у башни", grade: 3, gender: "girl", headwear: "headscarf", theme: "chechen-stone-tower", tags: ["чечня", "башня", "национальное платье", "горы", "a4"], description: "Парадный национальный портрет у древней вайнахской башни.", faceGuide: centeredFace }),
  scene({ id: "child-girl-chechen-wolf-companion", title: "Хозяйка гор и волк", grade: 4, gender: "girl", headwear: "headscarf", theme: "chechen-wolf-companion", tags: ["чечня", "волк", "национальное платье", "горы", "a4"], description: "Чеченская девочка и спокойный кавказский волк на закатном хребте.", faceGuide: centeredFace }),
  scene({ id: "child-girl-chechen-waterfall", title: "У водопада в белом", grade: 3, gender: "girl", headwear: "headscarf", theme: "chechen-waterfall", tags: ["чечня", "водопад", "национальное платье", "лес", "a4"], description: "Светлый национальный образ у высокого горного водопада.", faceGuide: centeredFace }),
  scene({ id: "child-girl-sun-tower-princess", title: "Златовласка с фонарём", grade: 1, gender: "girl", theme: "sun-tower-princess", tags: ["принцесса", "длинные волосы", "башня", "сказка", "a4"], description: "Длинноволосая принцесса дарит ребёнку сияющий фонарь в солнечной башне." }),
  scene({ id: "child-girl-forest-apple-princess", title: "Принцесса леса и яблок", grade: 1, gender: "girl", theme: "forest-apple-princess", tags: ["принцесса", "яблоки", "лес", "сказка", "a4"], description: "Добрая лесная принцесса с корзиной яблок рядом с ребёнком." }),
  scene({ id: "child-girl-highland-archer-princess", title: "Рыжая принцесса гор", grade: 2, gender: "girl", theme: "highland-archer-princess", tags: ["принцесса", "рыжие волосы", "горы", "сказка", "a4"], description: "Смелая рыжая принцесса высокогорья стоит рядом с ребёнком." }),
  scene({ id: "child-girl-rose-princess-beast", title: "Красавица и добрый зверь", grade: 2, gender: "girl", theme: "rose-princess-beast", tags: ["принцесса", "зверь", "роза", "библиотека", "a4"], description: "Ребёнок, книжная красавица и добрый зверь в зачарованной библиотеке." }),
  scene({ id: "child-girl-glass-slipper-princess", title: "Принцесса хрустальной туфельки", grade: 1, gender: "girl", theme: "glass-slipper-princess", tags: ["принцесса", "туфелька", "дворец", "сказка", "a4"], description: "Принцесса бала показывает ребёнку хрустальную туфельку на дворцовой лестнице." }),
  scene({ id: "child-girl-coral-sea-princess", title: "Коралловая морская принцесса", grade: 2, gender: "girl", theme: "coral-sea-princess", tags: ["принцесса", "море", "кораллы", "сказка", "a4"], description: "Морская принцесса со светящейся раковиной рядом с ребёнком в подводном дворце." }),
  scene({ id: "child-girl-ocean-wayfinder", title: "Океанская путешественница", grade: 3, gender: "girl", theme: "ocean-wayfinder", tags: ["океан", "путешествие", "остров", "лодка", "a4"], description: "Отважная океанская путешественница встречает ребёнка на тропическом берегу." }),
  scene({ id: "child-girl-northern-crystal-queen", title: "Северная кристальная королева", grade: 3, gender: "girl", theme: "northern-crystal-queen", tags: ["королева", "север", "кристаллы", "сияние", "a4"], description: "Добрая северная королева с кристальным фонарём под полярным сиянием." }),
  scene({ id: "child-girl-moon-warrior-princess", title: "Лунная принцесса-воительница", grade: 4, gender: "girl", theme: "moon-warrior-princess", tags: ["принцесса", "луна", "воительница", "дворец", "a4"], description: "Мирная лунная принцесса с веером рядом с ребёнком в цветущем дворе." }),
  scene({ id: "child-girl-desert-palace-princess", title: "Принцесса пустынного дворца", grade: 3, gender: "girl", theme: "desert-palace-princess", tags: ["принцесса", "дворец", "пустыня", "фонарь", "a4"], description: "Восточная принцесса с фонарём на террасе над сказочным городом." }),
  scene({ id: "child-girl-star-cape-heroine", title: "Звёздная героиня", grade: 3, gender: "girl", theme: "star-cape-heroine", tags: ["супергероиня", "плащ", "город", "команда", "a4"], description: "Ребёнок рядом с оригинальной звёздной героиней на крыше города будущего." }),
  scene({ id: "child-girl-sun-shield-heroine", title: "Героиня солнечного щита", grade: 3, gender: "girl", theme: "sun-shield-heroine", tags: ["супергероиня", "щит", "храм", "команда", "a4"], description: "Оригинальная защитница с солнечным щитом стоит рядом с ребёнком." }),
  scene({ id: "child-girl-ladybird-heroine", title: "Героиня удачи", grade: 2, gender: "girl", theme: "ladybird-heroine", tags: ["супергероиня", "божья коровка", "город", "талисман", "a4"], description: "Городская героиня с мотивом божьей коровки дарит ребёнку талисман удачи." }),
  scene({ id: "child-girl-bear-forest-friend", title: "Добрый лесной медведь", grade: 1, gender: "girl", theme: "bear-forest-friend", tags: ["медведь", "лес", "домик", "дружба", "a4"], description: "Ребёнок с добрым медведем на солнечной поляне у деревянного домика." }),
  scene({ id: "child-girl-fashion-dream-friend", title: "Модная мечта", grade: 3, gender: "girl", theme: "fashion-dream-friend", tags: ["мода", "розовый", "студия", "наставница", "a4"], description: "Модная наставница помогает ребёнку придумать праздничный образ в светлой студии." }),
  scene({ id: "child-girl-butterfly-fairy-mentor", title: "Фея-бабочка", grade: 1, gender: "girl", theme: "butterfly-fairy-mentor", tags: ["фея", "бабочка", "сад", "волшебство", "a4"], description: "Оригинальная фея-бабочка с цветочным фонарём рядом с ребёнком в волшебном саду." })
]);

export const A4_CHILD_PORTRAIT_TEMPLATE_IDS = Object.freeze(A4_CHILD_PORTRAIT_SCENES.map((item) => item.id));
