export const KINDERGARTEN_AI_VIDEO_CATEGORY = "ИИ-видео · Детский сад";
export const SCHOOL_INTERVIEW_CATEGORY = "Фото с видео · Школа";

const assetPath = (path) => `./assets/kindergarten-ai-video/${path}`;
const schoolAssetPath = (path) => `./assets/seedance-schoolboy-reference/${path}`;

export const KINDERGARTEN_DEMO_CHILDREN = Object.freeze([
  { id: "kindergarten-boy-01", title: "Мальчик 1", gender: "boy", age: 3, src: assetPath("children/boys/boy-01-age-3.jpg") },
  { id: "kindergarten-boy-02", title: "Мальчик 2", gender: "boy", age: 3, src: assetPath("children/boys/boy-02-age-3.jpg") },
  { id: "kindergarten-boy-03", title: "Мальчик 3", gender: "boy", age: 4, src: assetPath("children/boys/boy-03-age-4.jpg") },
  { id: "kindergarten-boy-04", title: "Мальчик 4", gender: "boy", age: 4, src: assetPath("children/boys/boy-04-age-4.jpg") },
  { id: "kindergarten-boy-05", title: "Мальчик 5", gender: "boy", age: 5, src: assetPath("children/boys/boy-05-age-5.jpg") },
  { id: "kindergarten-boy-06", title: "Мальчик 6", gender: "boy", age: 5, src: assetPath("children/boys/boy-06-age-5.jpg") },
  { id: "kindergarten-boy-07", title: "Мальчик 7", gender: "boy", age: 6, src: assetPath("children/boys/boy-07-age-6.jpg") },
  { id: "kindergarten-boy-08", title: "Мальчик 8", gender: "boy", age: 6, src: assetPath("children/boys/boy-08-age-6.jpg") },
  { id: "kindergarten-boy-09", title: "Мальчик 9", gender: "boy", age: 3, src: assetPath("children/boys/boy-09-age-3.jpg") },
  { id: "kindergarten-boy-10", title: "Мальчик 10", gender: "boy", age: 6, src: assetPath("children/boys/boy-10-age-6.jpg") },
  { id: "kindergarten-girl-01", title: "Девочка 1", gender: "girl", age: 3, src: assetPath("children/girls/girl-01-age-3.jpg") },
  { id: "kindergarten-girl-02", title: "Девочка 2", gender: "girl", age: 3, src: assetPath("children/girls/girl-02-age-3.jpg") },
  { id: "kindergarten-girl-03", title: "Девочка 3", gender: "girl", age: 4, src: assetPath("children/girls/girl-03-age-4.jpg") },
  { id: "kindergarten-girl-04", title: "Девочка 4", gender: "girl", age: 4, src: assetPath("children/girls/girl-04-age-4.jpg") },
  { id: "kindergarten-girl-05", title: "Девочка 5", gender: "girl", age: 5, src: assetPath("children/girls/girl-05-age-5.jpg") },
  { id: "kindergarten-girl-06", title: "Девочка 6", gender: "girl", age: 5, src: assetPath("children/girls/girl-06-age-5.jpg") },
  { id: "kindergarten-girl-07", title: "Девочка 7", gender: "girl", age: 6, src: assetPath("children/girls/girl-07-age-6.jpg") },
  { id: "kindergarten-girl-08", title: "Девочка 8", gender: "girl", age: 6, src: assetPath("children/girls/girl-08-age-6.jpg") },
  { id: "kindergarten-girl-09", title: "Девочка 9", gender: "girl", age: 3, src: assetPath("children/girls/girl-09-age-3.jpg") },
  { id: "kindergarten-girl-10", title: "Девочка 10", gender: "girl", age: 5, src: assetPath("children/girls/girl-10-age-5.jpg") }
]);

const IDENTITY_LOCK = `@Image 1 — единственный эталон внешности ребёнка и первый кадр. На протяжении всего ролика точно сохраняй возраст, форму лица, глаза, брови, нос, рот, щёки, уши, оттенок кожи, линию волос и естественную мимику ребёнка. Не усредняй лицо, не делай ребёнка старше и не меняй его этнические особенности. Стабильные черты лица и анатомия во всех кадрах, без мерцания, двойных деталей и деформаций.`;

const VIDEO_FORMAT = "Вертикальное видео 9:16, ровно 15 секунд, фотореализм, плавное естественное движение, стабильный свет, один ребёнок в кадре.";

function interviewPrompt(title, question, answer) {
  return {
    title,
    prompt: `${IDENTITY_LOCK}\n\n${VIDEO_FORMAT}\n\nСцена: оставь ребёнка одного на фоне настоящей уютной группы детского сада. Воспитательница находится за камерой: её голос слышен, но она ни разу не появляется в кадре. Камера на уровне глаз, средний крупный план, очень медленное естественное приближение.\n\nТайминг и точная речь:\n0–2 с — ребёнок спокойно смотрит на воспитательницу рядом с камерой, моргает и слегка улыбается.\n2–5 с — добрый женский голос за кадром спрашивает: «${question}»\n5–14 с — ребёнок естественным детским голосом отвечает: «${answer}» Точная русская артикуляция и синхронизация губ, без изменения слов.\n14–15 с — ребёнок снова смотрит в камеру и улыбается.\n\nЗвук: тихая атмосфера группы детсада, чистые голоса, без музыки и без посторонних реплик. Не показывай взрослого, других детей, микрофон, титры, субтитры, логотипы или текст в кадре.`
  };
}

export const KINDERGARTEN_INTERVIEW_PROMPTS = Object.freeze([
  interviewPrompt("Кем мечтает стать", "Кем ты хочешь стать, когда вырастешь?", "Я хочу лечить людей, чтобы они быстрее выздоравливали и снова улыбались."),
  interviewPrompt("Дом мечты", "Какой дом ты построишь, когда станешь большим?", "Я построю светлый дом с большим садом, где будут играть дети и петь птицы."),
  interviewPrompt("Помощь животным", "О чём ты мечтаешь больше всего?", "Я мечтаю помогать животным, лечить их и находить каждому добрый дом."),
  interviewPrompt("Полёт в космос", "Куда бы ты отправился на волшебной ракете?", "Я полечу к Луне, посмотрю на Землю сверху и привезу друзьям звёздную пыль."),
  interviewPrompt("Добрый воспитатель", "Чему ты научишь детей, когда вырастешь?", "Я научу их дружить, делиться игрушками и никогда не обижать друг друга."),
  interviewPrompt("Пожарный-спасатель", "Какой смелый поступок ты хочешь совершить?", "Я хочу стать спасателем, помогать людям и беречь всех от опасности."),
  interviewPrompt("Любимый рисунок", "Что ты больше всего любишь рисовать?", "Я люблю рисовать горы, солнце и нашу большую дружную группу в садике."),
  interviewPrompt("Вкусный праздник", "Что ты приготовишь для друзей?", "Я приготовлю большой фруктовый пирог и угощу всех на нашем весёлом празднике."),
  interviewPrompt("Будущий пилот", "Куда ты полетишь, если станешь пилотом?", "Я полечу над горами и покажу пассажирам самые красивые облака."),
  interviewPrompt("Спортивная мечта", "Чему ты хочешь научиться лучше всех?", "Я хочу быстро бегать, хорошо играть в футбол и всегда поддерживать команду."),
  interviewPrompt("Короткое стихотворение", "Расскажешь нам маленькое стихотворение?", "Солнце встало у ворот, новый день играть зовёт. Мы смеёмся и растём, дружно в садике живём."),
  interviewPrompt("Волшебная способность", "Какую добрую суперсилу ты бы выбрал?", "Я бы умел быстро мирить людей, чтобы никто не ссорился и всем было радостно."),
  interviewPrompt("Что такое дружба", "Как ты понимаешь, что человек — настоящий друг?", "Настоящий друг помогает, делится, слушает тебя и зовёт играть вместе."),
  interviewPrompt("Любимое занятие", "Что тебе больше всего нравится делать в садике?", "Мне нравится строить большой город из кубиков и придумывать истории вместе с друзьями."),
  interviewPrompt("Изобретение для детей", "Что полезное ты хочешь изобрести?", "Я изобрету робота, который собирает игрушки и читает детям добрые сказки."),
  interviewPrompt("Секрет хорошего дня", "Что делает твой день счастливым?", "Когда все здоровы, мы играем вместе, смеёмся и вечером обнимаем родных."),
  interviewPrompt("Любимое время года", "Какое время года ты любишь больше всего?", "Я люблю весну, потому что становится тепло, распускаются цветы и поют птицы."),
  interviewPrompt("Что такое доброта", "Как можно показать человеку свою доброту?", "Можно помочь, сказать хорошее слово, поделиться и обнять, если ему грустно."),
  interviewPrompt("Письмо себе в будущее", "Что ты скажешь себе, когда станешь взрослым?", "Я скажу: помни друзей из садика, будь добрым и обязательно исполни свою мечту."),
  interviewPrompt("Самый чудесный день", "Как выглядит твой самый чудесный день?", "Мы всей группой идём гулять, находим радугу и устраиваем весёлый пикник."),
]);

const NO_DIALOGUE_AUDIO = "Звук: только мягкая кинематографичная музыка и естественные звуки сцены. Без речи, без голосов, без пения и без артикуляции слов.";

const FAIRYTALE_PRINCESS_PROMPT = `${IDENTITY_LOCK}\n\n${VIDEO_FORMAT}\n\nUse the attached image as the exact visual reference for the girl, her face, age, hairstyle, lavender princess dress, tiara, magical garden, castle, waterfalls, flowers, lighting, and overall composition. Preserve the girl's identity, face, age, hairstyle, dress, tiara, body proportions, and facial features throughout the entire video.\n\n0–3 seconds: The young princess stands in a magical garden in front of a fairytale castle. Warm golden sunset light shines through the trees and flowers. A gentle breeze moves her hair and the transparent layers of her lavender dress. She looks directly at the camera and smiles softly.\n\n3–6 seconds: The girl slowly raises one hand. Small golden magical particles begin to appear around her. Tiny lights glow among the flowers, and several blossoms gently open as the magic spreads through the garden.\n\n6–10 seconds: The camera slowly pulls backward and rises upward like a smooth cinematic drone shot, revealing the full enchanted garden, waterfalls, stone arches, winding paths, and the fairytale castle in the background. Glowing butterflies fly gracefully around the girl.\n\n10–13 seconds: The princess takes two or three elegant steps along the garden path and turns slightly toward the castle. Her lavender and gold dress moves naturally in the breeze, with realistic fabric motion and sparkling embroidery.\n\n13–15 seconds: The camera smoothly returns to a medium shot. The girl turns back toward the camera, performs a small graceful royal curtsy, and smiles warmly. Golden particles softly float around her as the scene ends in a magical sunset glow.\n\nCamera and style: high-end cinematic fantasy film, photorealistic, elegant camera movement, smooth dolly-in and dolly-out transitions, gentle aerial reveal, shallow depth of field, realistic fabric and hair movement, soft lens flare, warm golden-hour lighting, detailed flowers, natural childlike expressions.\n\nSound: soft magical orchestral music, gentle wind, subtle sparkling sounds, distant waterfalls, light butterfly wing sounds. No dialogue, no singing, no subtitles, no text.\n\nDo not change the girl's face, age, hairstyle, dress, tiara, body proportions, or identity. No extra children, adults, characters, weapons, horror, costume changes, deformed hands, extra fingers, flickering, melting details, sudden camera shakes, text, subtitles, logos, or watermark.`;

const SUPERHERO_PROMPT = `${IDENTITY_LOCK}\n\n${VIDEO_FORMAT}\n\nЕсли добавлено @Image 2, используй его только как референс оригинального сине-серебряного костюма, крыши города, света и композиции; лицо из @Image 2 полностью игнорируй.\n\nСюжет «Юный супергерой»: 0–3 с — голубое свечение собирается вокруг ребёнка и формирует оригинальный сине-серебряный костюм с коротким плащом, без маски и шлема; лицо остаётся без изменений. 3–8 с — камера плавно обходит ребёнка на безопасной крыше города будущего, лёгкий ветер шевелит плащ. 8–12 с — ребёнок мягко поднимается над крышей на полметра в сияющем поле и спокойно опускается обратно. 12–15 с — герой уверенно улыбается в камеру, за ним загораются огни города. Без оружия, боя, опасности и сходства с известными героями.\n\n${NO_DIALOGUE_AUDIO}\n\nНе добавляй других людей, текст, логотипы, маску, шлем, резкие движения, агрессию или смену внешности.`;

const DRAGON_FLIGHT_PROMPT = `${IDENTITY_LOCK}\n\n${VIDEO_FORMAT}\n\nЕсли добавлено @Image 2, используй его только как референс доброго бирюзово-золотого дракона, безопасного седла, долины, света и композиции; лицо из @Image 2 полностью игнорируй.\n\nСюжет «Полёт на драконе»: 0–3 с — золотой свет переносит ребёнка из первого кадра в безопасное седло на спине большого доброго оригинального дракона; лицо и возраст ребёнка не меняются, страховочный ремень виден. 3–9 с — дракон плавно летит над сказочной зелёной долиной и водопадами, камера держится сбоку и немного впереди, ветер естественно двигает волосы и одежду. 9–13 с — дракон спокойно поворачивает к замку в облаках, ребёнок радостно смотрит вокруг и держится обеими руками. 13–15 с — средний план лица ребёнка, улыбка, мягкий золотой свет рассвета. Без огня, резких виражей, падения, страха или боя.\n\n${NO_DIALOGUE_AUDIO}\n\nНе добавляй других людей, текст, логотипы, оружие, опасные трюки, резкие движения или смену внешности.`;

function service({ id, title, gender, preview, shortDescription, description, prompt, promptVariants = [], tags, category = KINDERGARTEN_AI_VIDEO_CATEGORY, mediaKind = "video", previewVideoUrl = "", parentPreviewMode = "auto", angles = null, videoModel = "Seedance 2.0", systemTemplateVersion = 1 }) {
  return Object.freeze({
    id,
    title,
    name: title,
    mediaKind,
    price: "0",
    shortDescription,
    description,
    gender,
    category,
    popular: false,
    orderInfo: "Загрузите вертикальное фото ребёнка как @Image 1, скопируйте промпт в Seedance 2.0, создайте ролик и загрузите готовое видео в карточку ребёнка.",
    requirements: "Вертикальное фото 9:16: один ребёнок, лицо открыто, взгляд рядом с камерой, ровный свет, без других людей и текста.",
    angles: angles || [{ id: "video", name: "ИИ-видео 15 секунд", details: "Готовый ролик после генерации в Seedance 2.0.", refDataUrl: preview, refName: `${id}-preview.jpg` }],
    prompt,
    promptVariants,
    tags,
    previewSrc: preview,
    previewVideoUrl,
    parentPreviewMode,
    kindergartenAiVideo: true,
    videoModel,
    durationSeconds: 15,
    systemTemplate: true,
    systemTemplateVersion,
    enabled: true
  });
}

export const KINDERGARTEN_AI_VIDEO_SERVICES = Object.freeze([
  service({
    id: "kindergarten-video-interview",
    title: "Интервью в детском саду",
    gender: "unisex",
    preview: KINDERGARTEN_DEMO_CHILDREN[0].src,
    shortDescription: "Ребёнок один в кадре отвечает воспитательнице за камерой; 20 разных сценариев.",
    description: "Вертикальное интервью на 15 секунд. Воспитательница задаёт вопрос только голосом за кадром, ребёнок отвечает с точной русской артикуляцией, фон детского сада сохраняется.",
    prompt: "Выберите ниже один из 20 готовых сценариев интервью и нажмите «Скопировать сценарий». Каждый вариант уже содержит тайминг, точную речь и правила сохранения лица для Seedance 2.0.",
    promptVariants: KINDERGARTEN_INTERVIEW_PROMPTS,
    tags: ["детский сад", "интервью", "речь", "воспитательница", "мечта", "15 секунд", "Seedance 2.0"]
  }),
  service({
    id: "kindergarten-video-fairytale-princess",
    title: "Принцесса в сказочном мире",
    gender: "girls",
    preview: assetPath("previews/fairytale-princess-reference.jpg"),
    shortDescription: "Доброе превращение в оригинальную принцессу с сохранением лица ребёнка.",
    description: "Немой 15-секундный сказочный ролик: волшебное платье, солнечный сад, замок и светящиеся бабочки. Речи и других персонажей нет.",
    prompt: FAIRYTALE_PRINCESS_PROMPT,
    videoModel: "Kling 3.0",
    systemTemplateVersion: 2,
    tags: ["детский сад", "принцесса", "сказка", "замок", "без речи", "15 секунд", "Kling 3.0"]
  }),
  service({
    id: "kindergarten-video-original-superhero",
    title: "Юный супергерой",
    gender: "boys",
    preview: assetPath("previews/original-superhero.jpg"),
    shortDescription: "Оригинальный супергеройский образ без маски, боя и изменения лица.",
    description: "Немой 15-секундный ролик на безопасной крыше города будущего: костюм появляется в сиянии, плащ движется на ветру, ребёнок ненадолго поднимается над землёй.",
    prompt: SUPERHERO_PROMPT,
    tags: ["детский сад", "супергерой", "город будущего", "без речи", "15 секунд", "Seedance 2.0"]
  }),
  service({
    id: "kindergarten-video-dragon-flight",
    title: "Полёт на добром драконе",
    gender: "unisex",
    preview: assetPath("previews/dragon-flight.jpg"),
    shortDescription: "Безопасный сказочный полёт на оригинальном драконе с сохранением лица.",
    description: "Немой 15-секундный ролик: ребёнок в надёжном седле летит над волшебной долиной к замку в облаках. Без огня, боя, падения и страха.",
    prompt: DRAGON_FLIGHT_PROMPT,
    tags: ["детский сад", "дракон", "полёт", "сказка", "без речи", "15 секунд", "Seedance 2.0"]
  })
]);

export const SCHOOL_INTERVIEW_SERVICES = Object.freeze([
  service({
    id: "school-photo-interview-seedance",
    title: "Фото с интервью: школа",
    gender: "boys",
    category: SCHOOL_INTERVIEW_CATEGORY,
    mediaKind: "both",
    preview: schoolAssetPath("schoolboy-print-front.png"),
    previewVideoUrl: schoolAssetPath("schoolboy-interview-15s.mp4"),
    shortDescription: "Фронтальное фото для печати и персональное 15-секундное интервью на телефоне.",
    description: "Один заказ включает фотографию ребёнка, которую можно распечатать, и готовое вертикальное интервью с тем же ребёнком. На печатном фото ребёнок смотрит в камеру, а на телефоне запускается видео с ответами ученика учителю.",
    prompt: `Use the provided schoolboy reference image as the identity and scene reference. Create a realistic 15-second documentary-style interview in a classroom. The same boy sits at a wooden desk, looks slightly away from the camera toward the teacher, and wears a small black DJI lavalier microphone clipped to his collar. A bookshelf with books is visible in the background. The teacher stays off-camera and is heard only by voice. Preserve the boy's face, age, hairstyle, clothing, microphone, desk, classroom, and bookshelf. Use natural Russian lip synchronization, realistic pauses, subtle head and eye movements, and a small smile at the end. Do not add other people, subtitles, logos, text, or dramatic camera movement.
Teacher, off-camera: «Скажи, какой предмет тебе больше всего нравится в школе?»
Student: «Мне нравится история. Особенно когда мы узнаём, как жили люди раньше.»
Teacher: «А кем ты хочешь стать, когда вырастешь?»
Student: «Пока не знаю… может быть, инженером.»`,
    tags: ["школа", "фото", "печать", "интервью", "видео", "15 секунд", "Seedance 2.0"],
    angles: [
      { id: "print-photo", name: "Фото для печати", details: "Фронтальный портрет ребёнка, смотрит прямо в камеру; используется для распечатки.", refDataUrl: schoolAssetPath("schoolboy-print-front.png"), refName: "schoolboy-print-front.png" },
      { id: "interview-video", name: "Интервью 15 секунд", details: "Готовое вертикальное видео с учителем за кадром; запускается на телефоне.", refDataUrl: schoolAssetPath("schoolboy-classroom-side-glance.png"), refName: "schoolboy-classroom-side-glance.png", videoRefDataUrl: schoolAssetPath("schoolboy-interview-15s.mp4"), videoRefName: "schoolboy-interview-15s.mp4" }
    ]
  })
]);
