// ПРОФСИЛА · режимы длительности, правила выпадения заданий, достижения.
//
// Как собирается партия:
// 1. Из каждого из шести блоков ситуаций случайно берётся perBlock ситуаций.
// 2. Добавляются быстрые выборы (quick), вопросы «Проверь себя» (quiz) и кейс (cases).
// 3. Если какое-то направление встретилось реже minPerDir раз, набор тянется заново.
// 4. Ситуации, сыгранные в прошлых партиях на этом телефоне, выпадают в последнюю очередь.
//
// Баллы: выбор в ситуации или кейсе даёт +2, быстрый выбор даёт +1.
// Итог считается как доля: набранные баллы направления / баллы, которые оно могло набрать.

window.PROFSILA = window.PROFSILA || {};

PROFSILA.scoring = {
  situationPoints: 2,
  casePoints: 2,
  quickPoints: 1
};

PROFSILA.modes = [
  {
    id: "blitz",
    name: "блиц",
    minutes: "5–7",
    desc: "6 ситуаций и 4 быстрых выбора · быстрый темп",
    perBlock: 1,
    quick: 4,
    quiz: 1,
    cases: 0,
    hints: false,
    discussion: false,
    minPerDir: 3,
    // Порядок: ситуация и быстрый выбор чередуются, бонус-вопрос в самом конце.
    layout: "alternate",
    result: ["superpower", "fact", "tryNow", "quiz", "more"],
    resultNote: "Экспресс-итог: только главная суперсила. Чтобы узнать вторую силу и полный профиль, сыграй стандарт."
  },
  {
    id: "std",
    name: "стандарт",
    minutes: "15",
    desc: "12 ситуаций и 3 вопроса «Проверь себя» · с подсказками о профессиях",
    perBlock: 2,
    quick: 0,
    quiz: 3,
    quizAfterBlocks: [2, 4, 6],
    cases: 0,
    hints: true,
    discussion: false,
    minPerDir: 5,
    layout: "blocks",
    result: ["superpower", "second", "combo", "profile", "ege", "terms", "quiz", "fact", "tryNow", "catalog"]
  },
  {
    id: "deep",
    name: "глубоко",
    minutes: "30–40",
    desc: "12 ситуаций, командный кейс и 6 вопросов · разбор каждой ситуации",
    perBlock: 2,
    quick: 0,
    quiz: 6,
    quizAfterBlocks: [1, 2, 3, 4, 5, 6],
    cases: 1,
    caseAfterBlock: 3,
    hints: true,
    discussion: true,
    minPerDir: 6,
    layout: "blocks",
    result: ["superpower", "second", "combo", "profile", "badges", "caseTeam", "ege", "terms", "quiz", "fact", "tryNow", "catalog"]
  }
];

// Общий режим на проекторе: сколько секунд даётся классу на голосование.
PROFSILA.classroom = {
  timerSeconds: 20
};

// Звание по доле верных ответов в «Проверь себя».
PROFSILA.quizRanks = [
  { from: 0, title: "Новичок", text: "Хорошее начало: теперь ты знаешь ответы, которые знают не все взрослые." },
  { from: 0.4, title: "Знаток", text: "Ты уже разбираешься в деньгах и бизнесе лучше многих." },
  { from: 0.8, title: "Профи", text: "Почти всё верно. С такими знаниями можно идти на олимпиаду по экономике." }
];

// Достижения на экране итога. rule.type понимает движок (game/js/engine.js):
//   allDirs      — хотя бы один выбор в каждом из семи направлений;
//   focus        — у одного направления доля выборов не меньше rule.share;
//   spread       — ни у одного направления доля процентов профиля не больше rule.maxShare;
//   quizPerfect  — все ответы «Проверь себя» верные (нужно не меньше rule.minQuestions вопросов);
//   blockDir     — в блоке rule.block направление rule.dir выбрано не меньше rule.min раз;
//   caseRoles    — в кейсе выбраны не меньше rule.min разных направлений.
PROFSILA.badges = [
  {
    id: "universal",
    title: "Универсал",
    text: "Ты хотя бы раз выбрал каждое из семи направлений. Тебе интересно всё — это редкость.",
    rule: { type: "allDirs" },
    modes: ["std", "deep"]
  },
  {
    id: "focus",
    title: "Чёткий фокус",
    text: "Больше половины твоих выборов — в одном направлении. Ты точно знаешь, что тебе нравится.",
    rule: { type: "focus", share: 0.5 },
    modes: ["std", "deep"]
  },
  {
    id: "balance",
    title: "Мастер баланса",
    text: "Ни одно направление не набрало больше четверти профиля: ты смотришь на задачу с разных сторон.",
    rule: { type: "spread", maxShare: 0.25 },
    modes: ["std", "deep"]
  },
  {
    id: "erudite",
    title: "Эрудит",
    text: "Все ответы в «Проверь себя» верные.",
    rule: { type: "quizPerfect", minQuestions: 3 },
    modes: ["std", "deep"]
  },
  {
    id: "antifraud",
    title: "Антифрод",
    text: "В блоке «Осторожно, схема!» ты оба раза выбрал путь защитника. Мошенникам с тобой не повезло.",
    rule: { type: "blockDir", block: "safety", dir: "sec", min: 2 },
    modes: ["std", "deep"]
  },
  {
    id: "teamplayer",
    title: "Человек команды",
    text: "В кейсе ты примерил роли трёх разных специалистов. Так и работают настоящие проектные команды.",
    rule: { type: "caseRoles", min: 3 },
    modes: ["deep"]
  }
];
