export const GAME_PHOTO_CATEGORY = "Игровые фотомонтажи";

const previewPath = (file) => `./assets/game-photo-services/${file}`;

function service({ id, title, gender, preview, original, description, tags }) {
  return Object.freeze({
    id,
    title,
    name: title,
    mediaKind: "photo",
    type: "photo",
    price: "350",
    catalogPriceVersion: 1,
    shortDescription: "Персональный игровой фотомонтаж с ребёнком и персонажем, вертикальный A4.",
    description,
    gender,
    category: GAME_PHOTO_CATEGORY,
    popular: false,
    orderInfo: "Выберите фронтальную фотографию ребёнка. Итоговый фотомонтаж подготавливается в вертикальном формате A4.",
    requirements: "Чёткое фронтальное фото ребёнка, открытое лицо, ровный свет, руки и фигура по возможности видны.",
    angles: [],
    prompt: "Сохрани лицо, возраст и индивидуальные черты ребёнка. Создай безопасный игровой постер A4 с узнаваемой атмосферой выбранной игры, персонажем рядом и фантастическим реквизитом без стрельбы и насилия.",
    tags,
    previewSrc: previewPath(preview),
    originalSrc: previewPath(`originals/${original}`),
    parentPreviewMode: "print",
    printFormat: "A4",
    gamePhotoService: true,
    systemTemplate: true,
    systemTemplateVersion: 1,
    enabled: true
  });
}

export const GAME_PHOTO_SERVICES = Object.freeze([
  service({
    id: "game-photo-free-fire-boy",
    title: "Free Fire — игровой фотомонтаж",
    gender: "boys",
    preview: "free-fire.webp",
    original: "free-fire.png",
    description: "Кинематографичный турнирный постер: ребёнок и игровой персонаж в яркой футуристической арене с детализированным фантастическим реквизитом.",
    tags: ["Free Fire", "игра", "мальчик", "персонаж", "A4"]
  }),
  service({
    id: "game-photo-pubg-boy",
    title: "PUBG — игровой фотомонтаж",
    gender: "boys",
    preview: "pubg.webp",
    original: "pubg.png",
    description: "Приключенческий островной постер: ребёнок рядом с персонажем в фирменном шлеме, парашютом и игровым реквизитом.",
    tags: ["PUBG", "игра", "мальчик", "персонаж", "A4"]
  }),
  service({
    id: "game-photo-roblox-boy",
    title: "Roblox — мальчик",
    gender: "boys",
    preview: "roblox-boy.webp",
    original: "roblox-boy.png",
    description: "Яркий фотомонтаж мальчика с классическим блочным аватаром в мире парящих островов и игровых испытаний.",
    tags: ["Roblox", "игра", "мальчик", "блочный мир", "A4"]
  }),
  service({
    id: "game-photo-roblox-girl",
    title: "Roblox — девочка",
    gender: "girls",
    preview: "roblox-girl.webp",
    original: "roblox-girl.png",
    description: "Яркий фотомонтаж девочки с классическим блочным аватаром в красочном игровом мире.",
    tags: ["Roblox", "игра", "девочка", "блочный мир", "A4"]
  })
]);
