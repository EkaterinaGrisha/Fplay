#!/usr/bin/env node
// ПРОФСИЛА · проверка банка заданий и сборка документа для вычитки.
//
//   node tools/bank.js check   — структура, баланс направлений, симуляция случайных партий
//   node tools/bank.js md      — пересобрать docs/BANK.md из game/content/*.js

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const CONTENT = [
  "directions.js",
  "modes.js",
  "situations-1.js",
  "situations-2.js",
  "quick.js",
  "cases.js",
  "quiz.js"
];
const INK = "#141033";
const BADGE_RULES = ["allDirs", "focus", "spread", "quizPerfect", "blockDir", "caseRoles"];
const RESULT_SECTIONS = ["superpower", "second", "combo", "profile", "badges", "caseTeam", "ege", "terms", "quiz", "fact", "tryNow", "catalog", "more"];

function loadBank() {
  // Как в браузере: window и есть глобальный объект, поэтому PROFSILA виден без префикса.
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of CONTENT) {
    const file = path.join(ROOT, "game", "content", f);
    vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  }
  return ctx.PROFSILA;
}

const engine = require(path.join(ROOT, "game", "js", "engine.js"));

// Каждый режим играется в двух вариантах: на проекторе (общие настройки) и на телефоне (поле phone).
function variants(bank) {
  const out = [];
  bank.modes.forEach((m) => {
    out.push({ label: `${m.id}`, place: "проектор", device: null, mode: m });
    if (m.phone) out.push({ label: `${m.id}/телефон`, place: "телефон", device: "phone", mode: engine.modeFor(bank, m.id, "phone") });
  });
  return out;
}

// ---------- проверки ----------

function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function check(bank) {
  const errors = [];
  const warns = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warns.push(m);
  const ids = new Set();
  const uniq = (id, where) => { if (ids.has(id)) err(`повтор id ${id} (${where})`); ids.add(id); };
  const long = (s, max, where) => { if (s && s.length > max) warn(`${where}: ${s.length} знаков, лучше до ${max}`); };

  const dirs = bank.directions.map((d) => d.id);
  const dirSet = new Set(dirs);
  const isDir = (d) => dirSet.has(d);

  // Направления
  bank.directions.forEach((d) => {
    uniq(d.id, "направление");
    ["short", "name", "tab", "code", "level", "color", "skill", "plus", "about", "you"].forEach((k) => { if (!d[k]) err(`${d.id}: нет поля ${k}`); });
    if (!(d.profiles || []).length) err(`${d.id}: нет профиля`);
    if (!d.ege || !(d.ege.oneOf || []).length) err(`${d.id}: нет предметов ЕГЭ на выбор`);
    if (!d.icon || !d.icon.a) err(`${d.id}: нет иконки`);
    if ((d.tasks || []).length !== 3) err(`${d.id}: задач должно быть 3`);
    if ((d.where || []).length < 3) err(`${d.id}: мест работы меньше 3`);
    if ((d.roles || []).length < 3) err(`${d.id}: должностей меньше 3`);
    if ((d.facts || []).length < 2) err(`${d.id}: фактов меньше 2`);
    if ((d.tryNow || []).length < 1) err(`${d.id}: нет «Попробуй сейчас»`);
    if (!d.ege || !d.ege.required || !d.ege.required.includes("Русский язык")) err(`${d.id}: в ЕГЭ нет русского языка`);
    const c = contrast(d.color, INK);
    if (c < 4.5) err(`${d.id}: контраст тёмного текста на ${d.color} ${c.toFixed(1)} : 1 — меньше 4,5`);
  });

  // Сочетания: каждая пара ровно один раз
  const pairKey = (a, b) => [a, b].sort().join("+");
  const combos = new Map();
  bank.combos.forEach((c) => {
    if (!c.dirs.every(isDir) || c.dirs[0] === c.dirs[1]) err(`сочетание ${c.title}: неверные направления`);
    const k = pairKey(...c.dirs);
    if (combos.has(k)) err(`сочетание ${k} повторяется`);
    combos.set(k, c);
  });
  for (let i = 0; i < dirs.length; i++) for (let j = i + 1; j < dirs.length; j++) {
    if (!combos.has(pairKey(dirs[i], dirs[j]))) err(`нет сочетания ${dirs[i]}+${dirs[j]}`);
  }

  // Ситуации
  const terms = new Map();
  const addTerm = (t, where) => {
    if (!t || !t.word || !t.def) { err(`${where}: нет термина`); return; }
    const k = t.word.toLowerCase();
    if (terms.has(k)) warn(`термин «${t.word}» повторяется: ${terms.get(k)} и ${where}`);
    terms.set(k, where);
    long(t.def, 170, `${where} термин`);
  };
  const checkOptions = (opts, where, needHint) => {
    if (opts.length !== 4) err(`${where}: вариантов ${opts.length}, нужно 4`);
    const seen = new Set();
    opts.forEach((o, i) => {
      if (!isDir(o.dir)) err(`${where}: вариант ${i + 1} — неизвестное направление ${o.dir}`);
      if (seen.has(o.dir)) err(`${where}: направление ${o.dir} повторяется`);
      seen.add(o.dir);
      if (!o.text) err(`${where}: пустой вариант ${i + 1}`);
      if (needHint && !o.hint) err(`${where}: нет подсказки к варианту ${i + 1}`);
      long(o.text, 95, `${where} вариант ${o.dir}`);
      long(o.hint, 150, `${where} подсказка ${o.dir}`);
    });
  };

  bank.blocks.forEach((b) => {
    uniq(b.id, "блок");
    if (!b.title) err(`блок ${b.id}: нет названия`);
    b.situations.forEach((s) => {
      const where = `${b.id}/${s.id}`;
      uniq(s.id, "ситуация");
      if (!s.title || !s.text) err(`${where}: нет заголовка или текста`);
      if (!s.ask) err(`${where}: нет вопроса классу`);
      long(s.title, 40, `${where} заголовок`);
      long(s.text, 220, `${where} текст`);
      checkOptions(s.options, where, true);
      addTerm(s.term, where);
    });
  });

  // Быстрые выборы: каждая пара направлений должна встречаться одинаковое число раз
  const quickPairs = new Map();
  bank.quick.items.forEach((q) => {
    uniq(q.id, "быстрый выбор");
    if (!isDir(q.a.dir) || !isDir(q.b.dir) || q.a.dir === q.b.dir) err(`${q.id}: неверные направления`);
    const k = pairKey(q.a.dir, q.b.dir);
    quickPairs.set(k, (quickPairs.get(k) || 0) + 1);
    long(q.a.text, 70, `${q.id} a`);
    long(q.b.text, 70, `${q.id} b`);
  });
  const pairCounts = [];
  for (let i = 0; i < dirs.length; i++) for (let j = i + 1; j < dirs.length; j++) pairCounts.push([pairKey(dirs[i], dirs[j]), quickPairs.get(pairKey(dirs[i], dirs[j])) || 0]);
  const topPair = Math.max(...pairCounts.map((p) => p[1]));
  pairCounts.filter((p) => p[1] < topPair).forEach((p) => warn(`быстрые выборы: пара ${p[0]} встречается ${p[1]} раз, а другие — по ${topPair}`));

  // Кейсы
  bank.cases.forEach((c) => {
    uniq(c.id, "кейс");
    if (c.steps.length !== 3) warn(`${c.id}: шагов ${c.steps.length}, задумано 3`);
    ["title", "intro", "outro", "team", "ask"].forEach((k) => { if (!c[k]) err(`${c.id}: нет поля ${k}`); });
    const cover = new Set();
    c.steps.forEach((st, i) => {
      checkOptions(st.options, `${c.id} шаг ${i + 1}`, true);
      st.options.forEach((o) => cover.add(o.dir));
    });
    dirs.forEach((d) => { if (!cover.has(d)) err(`${c.id}: в кейсе не встречается ${d}`); });
    addTerm(c.term, c.id);
  });

  // Викторина
  const quizByDir = {};
  const correctPos = [0, 0, 0, 0];
  bank.quiz.forEach((q) => {
    uniq(q.id, "вопрос");
    if (!isDir(q.dir)) err(`${q.id}: неизвестное направление`);
    if (q.options.length < 3) err(`${q.id}: меньше 3 вариантов`);
    if (!(q.correct >= 0 && q.correct < q.options.length)) err(`${q.id}: неверный номер ответа`);
    if (!q.explain) err(`${q.id}: нет объяснения`);
    quizByDir[q.dir] = (quizByDir[q.dir] || 0) + 1;
    correctPos[q.correct]++;
  });

  // Режимы и достижения
  const minBlock = Math.min(...bank.blocks.map((b) => b.situations.length));
  variants(bank).forEach(({ label, mode: m }) => {
    if (m.perBlock > minBlock) err(`режим ${label}: берёт ${m.perBlock} из блока, а в самом маленьком блоке ${minBlock}`);
    if ((m.quick || 0) > bank.quick.items.length) err(`режим ${label}: быстрых выборов не хватает`);
    if ((m.cases || 0) > bank.cases.length) err(`режим ${label}: кейсов не хватает`);
    if (m.quizEvery) {
      const sits = m.perBlock * bank.blocks.length;
      if (m.quizEvery * m.quiz > sits) err(`режим ${label}: ${m.quiz} вопросов через каждые ${m.quizEvery} ситуаций не помещаются в ${sits} ситуаций`);
    } else if (m.quizAfterBlocks && m.quizAfterBlocks.length !== m.quiz) err(`режим ${label}: quizAfterBlocks не совпадает с quiz`);
    if (m.quiz > bank.quiz.length) err(`режим ${label}: вопросов «Проверь себя» не хватает`);
    if (!m.desc) err(`режим ${label}: нет описания`);
    m.result.forEach((r) => { if (!RESULT_SECTIONS.includes(r)) err(`режим ${label}: неизвестный раздел итога ${r}`); });
  });
  bank.badges.forEach((b) => {
    if (!BADGE_RULES.includes(b.rule.type)) err(`достижение ${b.id}: неизвестное правило ${b.rule.type}`);
    b.modes.forEach((m) => { if (!bank.modes.some((x) => x.id === m)) err(`достижение ${b.id}: нет режима ${m}`); });
    if (b.rule.block && !bank.blocks.some((x) => x.id === b.rule.block)) err(`достижение ${b.id}: нет блока ${b.rule.block}`);
  });

  // Метка ?v= у скриптов и стилей страниц должна совпадать с версией банка,
  // иначе браузеры игроков после обновления смешают старые файлы с новыми.
  ["index.html", "flyer.html", "host.html"].forEach((page) => {
    const html = fs.readFileSync(path.join(ROOT, "game", page), "utf8");
    const refs = [...html.matchAll(/(?:src|href)="((?:content|js)\/[^"]+\.js|config\.js|style\.css)(?:\?v=([^"]*))?"/g)];
    refs.forEach((m) => { if (m[2] !== bank.meta.bankVersion) err(`${page}: у ${m[1]} метка ?v=${m[2] || "(нет)"}, а версия банка ${bank.meta.bankVersion}`); });
  });

  return { errors, warns, quizByDir, correctPos, terms: terms.size };
}

// ---------- статистика и симуляция ----------

function pad(s, n) { s = String(s); return s.length >= n ? s : s + " ".repeat(n - s.length); }
function lpad(s, n) { s = String(s); return s.length >= n ? s : " ".repeat(n - s.length) + s; }

function coverageTable(bank) {
  const dirs = bank.directions.map((d) => d.id);
  const rows = bank.blocks.map((b) => {
    const c = Object.fromEntries(dirs.map((d) => [d, 0]));
    b.situations.forEach((s) => s.options.forEach((o) => c[o.dir]++));
    return { name: b.id, c };
  });
  const total = Object.fromEntries(dirs.map((d) => [d, rows.reduce((s, r) => s + r.c[d], 0)]));
  const lines = [pad("блок", 10) + dirs.map((d) => lpad(d, 7)).join("")];
  rows.forEach((r) => lines.push(pad(r.name, 10) + dirs.map((d) => lpad(r.c[d], 7)).join("")));
  lines.push(pad("всего", 10) + dirs.map((d) => lpad(total[d], 7)).join(""));
  return { text: lines.join("\n"), total };
}

// Ответы игрока на собранную партию: strategy(options, rng) возвращает выбранное направление.
function play(game, strategy, rng) {
  const picks = [];
  game.screens.forEach((s) => {
    if (s.type === "situation") {
      const offered = s.item.options.map((o) => o.dir);
      picks.push({ kind: "situation", block: s.block, offered, dir: strategy(offered, rng) });
    } else if (s.type === "quick") {
      const offered = [s.item.a.dir, s.item.b.dir];
      picks.push({ kind: "quick", offered, dir: strategy(offered, rng) });
    } else if (s.type === "case") {
      s.item.steps.forEach((st) => {
        const offered = st.options.map((o) => o.dir);
        picks.push({ kind: "case", offered, dir: strategy(offered, rng) });
      });
    }
  });
  return picks;
}

function simulate(bank, runs) {
  const dirs = bank.directions.map((d) => d.id);
  const out = [];
  variants(bank).forEach(({ label, device, mode: m }) => {
    const rng = engine.makeRng(20261028);
    const stats = {
      tries: 0, failed: 0, screens: 0,
      appearMin: Object.fromEntries(dirs.map((d) => [d, Infinity])),
      appearSum: Object.fromEntries(dirs.map((d) => [d, 0])),
      topRandom: Object.fromEntries(dirs.map((d) => [d, 0])),
      ties: 0,
      loyal: Object.fromEntries(dirs.map((d) => [d, 0])),
      badges: {}
    };
    for (let i = 0; i < runs; i++) {
      const game = engine.drawGame(bank, m.id, { rng, device });
      stats.tries += game.tries;
      if (game.minAppear < m.minPerDir) stats.failed++;
      stats.screens += game.screens.length;
      dirs.forEach((d) => {
        stats.appearMin[d] = Math.min(stats.appearMin[d], game.appear[d]);
        stats.appearSum[d] += game.appear[d];
      });

      // Игрок, который выбирает наугад: итог должен распределяться по всем направлениям поровну.
      const picks = play(game, (offered, r) => offered[Math.floor(r() * offered.length)], rng);
      const sc = engine.score(bank, picks);
      stats.topRandom[sc.top]++;
      if (sc.tied.length > 1) stats.ties++;
      const quizTotal = game.screens.filter((s) => s.type === "quiz").length;
      const quizCorrect = Array.from({ length: quizTotal }, () => (rng() < 0.6 ? 1 : 0)).reduce((a, b) => a + b, 0);
      engine.earnedBadges(bank, m.id, { picks, sc, quizCorrect, quizTotal, device })
        .forEach((b) => { stats.badges[b.id] = (stats.badges[b.id] || 0) + 1; });

      // «Верный» игрок: всегда выбирает своё направление, если оно есть среди вариантов.
      const fav = dirs[i % dirs.length];
      const loyalPicks = play(game, (offered, r) => (offered.includes(fav) ? fav : offered[Math.floor(r() * offered.length)]), rng);
      if (engine.score(bank, loyalPicks).top === fav) stats.loyal[fav]++;
    }
    out.push({ label, mode: m, stats });
  });
  return out;
}

function report(bank) {
  const res = check(bank);
  const dirs = bank.directions.map((d) => d.id);
  const situations = bank.blocks.reduce((s, b) => s + b.situations.length, 0);
  const steps = bank.cases.reduce((s, c) => s + c.steps.length, 0);

  console.log("ПРОФСИЛА · проверка банка\n");
  console.log(`Направлений: ${dirs.length} · блоков: ${bank.blocks.length} · ситуаций: ${situations} · быстрых выборов: ${bank.quick.items.length}`);
  console.log(`Кейсов: ${bank.cases.length} (${steps} шагов) · вопросов «Проверь себя»: ${bank.quiz.length} · терминов: ${res.terms} · сочетаний: ${bank.combos.length}`);
  console.log(`Вопросы по направлениям: ${dirs.map((d) => `${d} ${res.quizByDir[d] || 0}`).join(", ")}`);
  console.log(`Позиция верного ответа (A/B/C): ${res.correctPos.slice(0, 3).join(" / ")}`);
  console.log("\nКонтраст тёмного текста на цвете направления:");
  console.log("  " + bank.directions.map((d) => `${d.id} ${contrast(d.color, INK).toFixed(1)}`).join(" · "));

  const cov = coverageTable(bank);
  console.log("\nСколько раз направление встречается в вариантах ситуаций:\n" + cov.text);

  const RUNS = 20000;
  console.log(`\nСимуляция: по ${RUNS} случайных партий на режим\n`);
  simulate(bank, RUNS).forEach(({ label, mode, stats }) => {
    const r = (x) => (x / RUNS * 100).toFixed(1);
    console.log(`[${label}] ${mode.name}, ${mode.minutes} мин · экранов в партии: ${(stats.screens / RUNS).toFixed(1)}`);
    console.log(`  набор собирается с ${(stats.tries / RUNS).toFixed(2)} попытки в среднем; не удалось выдержать минимум ${mode.minPerDir}: ${stats.failed}`);
    console.log("  встреч направления за партию (мин / среднее): " +
      dirs.map((d) => `${d} ${stats.appearMin[d]}/${(stats.appearSum[d] / RUNS).toFixed(1)}`).join(" · "));
    console.log("  случайный игрок, главная сила, %: " + dirs.map((d) => `${d} ${r(stats.topRandom[d])}`).join(" · ") +
      ` · ничьи ${r(stats.ties)}`);
    const loyalRuns = RUNS / dirs.length;
    console.log("  игрок с любимым направлением получает его, %: " +
      dirs.map((d) => `${d} ${(stats.loyal[d] / loyalRuns * 100).toFixed(1)}`).join(" · "));
    const b = Object.keys(stats.badges);
    if (b.length) console.log("  достижения у случайного игрока, %: " + b.map((k) => `${k} ${r(stats.badges[k])}`).join(" · "));
    console.log("");
  });

  if (res.warns.length) {
    console.log(`Замечания (${res.warns.length}):`);
    res.warns.forEach((w) => console.log("  · " + w));
  }
  if (res.errors.length) {
    console.log(`\nОшибки (${res.errors.length}):`);
    res.errors.forEach((e) => console.log("  ✗ " + e));
    process.exitCode = 1;
  } else {
    console.log("\nОшибок нет.");
  }
}

// ---------- docs/BANK.md ----------

function toMarkdown(bank) {
  const dir = Object.fromEntries(bank.directions.map((d) => [d.id, d]));
  const tag = (id) => `**${dir[id].short}**`;
  const L = [];
  const situations = bank.blocks.reduce((s, b) => s + b.situations.length, 0);

  L.push("# ПРОФСИЛА — банк заданий");
  L.push("");
  L.push(`> Документ собран из \`game/content/*.js\` командой \`node tools/bank.js md\`. Правки вносятся в файлы банка, а этот документ пересобирается. Версия банка: ${bank.meta.bankVersion}.`);
  L.push("");
  L.push(`Что в банке: ситуаций — ${situations} в ${bank.blocks.length} блоках, быстрых выборов — ${bank.quick.items.length}, командных кейсов — ${bank.cases.length}, вопросов «Проверь себя» — ${bank.quiz.length}. Правильных ответов в ситуациях нет: каждый вариант ведёт к своему направлению.`);
  L.push("");
  L.push("## Содержание");
  L.push("");
  ["Режимы и правила выпадения", "Направления", "Сочетания двух сил", "Ситуации по блокам", "Быстрые выборы «Это или то»", "Командные кейсы", "Проверь себя", "Достижения"].forEach((h) => {
    L.push(`- [${h}](#${h.toLowerCase().replace(/[«»]/g, "").replace(/\s+/g, "-")})`);
  });
  L.push("");

  L.push("## Режимы и правила выпадения");
  L.push("");
  L.push("| Режим | Где | Время | Что в партии | Из каждого блока | Минимум встреч направления | Что показываем в итоге |");
  L.push("|---|---|---|---|---|---|---|");
  const sectionNames = {
    superpower: "суперсила", second: "вторая сила", combo: "сочетание", profile: "профиль", badges: "достижения",
    caseTeam: "роль в кейсе", ege: "предметы ЕГЭ", terms: "словарик", quiz: "звание за «Проверь себя»",
    fact: "«Знаешь ли ты»", tryNow: "«Попробуй сейчас»", catalog: "все профессии", more: "приглашение в стандарт"
  };
  variants(bank).forEach(({ place, mode: m }) => {
    L.push(`| ${m.name} | ${place} | ${m.minutes} мин | ${m.desc} | ${m.perBlock} | ${m.minPerDir} | ${m.result.map((r) => sectionNames[r]).join(", ")} |`);
  });
  L.push("");
  L.push(`Баллы: выбор в ситуации или кейсе +${bank.scoring.situationPoints}, быстрый выбор +${bank.scoring.quickPoints}. Итог направления — доля набранных баллов от баллов, которые оно могло набрать, поэтому направление, которое выпало реже, не проигрывает.`);
  L.push("");
  const pct = (x) => Math.round(x * 100);
  L.push("Звания за «Проверь себя»: " + bank.quizRanks.map((r, i) => {
    const next = bank.quizRanks[i + 1];
    const range = next ? `${pct(r.from)}–${pct(next.from) - 1}% верных` : `${pct(r.from)}% и выше`;
    return `${range} — «${r.title}»`;
  }).join("; ") + ".");
  L.push("");

  L.push("## Направления");
  L.push("");
  bank.directions.forEach((d) => {
    L.push(`### ${d.short} · ${d.name}`);
    L.push("");
    L.push(`Направление: ${d.code} «${d.tab}», ${d.level} · профиль: ${d.profiles.join("; ")} · цвет \`${d.color}\` · навык: ${d.skill}`);
    L.push("");
    L.push(`**Кто это.** ${d.about}`);
    L.push("");
    L.push(`**Текст на итоге.** ${d.you}`);
    L.push("");
    L.push(`**Задачи:** ${d.tasks.join("; ")}.`);
    L.push("");
    L.push(`**Где работают:** ${d.where.join(", ")}. **Кем можно стать:** ${d.roles.join(", ")}.`);
    L.push("");
    L.push(`**ЕГЭ:** ${d.ege.required.join(", ")} + один из предметов: ${d.ege.oneOf.join(", ")}.`);
    L.push("");
    L.push("**Знаешь ли ты:**");
    d.facts.forEach((f) => L.push(`- ${f}`));
    L.push("");
    L.push("**Попробуй сейчас:**");
    d.tryNow.forEach((f) => L.push(`- ${f}`));
    L.push("");
  });
  L.push(`> ${bank.egeNote.text} Статус: ${bank.egeNote.status}. Источники: ${bank.egeNote.sources.join("; ")}.`);
  L.push("");

  L.push("## Сочетания двух сил");
  L.push("");
  L.push("| Пара | Название | Описание |");
  L.push("|---|---|---|");
  bank.combos.forEach((c) => L.push(`| ${dir[c.dirs[0]].short} + ${dir[c.dirs[1]].short} | ${c.title} | ${c.text} |`));
  L.push("");

  L.push("## Ситуации по блокам");
  L.push("");
  bank.blocks.forEach((b) => {
    L.push(`### Блок «${b.title}»`);
    L.push("");
    L.push(`_${b.intro}_`);
    L.push("");
    b.situations.forEach((s) => {
      const absent = bank.directions.filter((d) => !s.options.some((o) => o.dir === d.id)).map((d) => d.short);
      L.push(`#### ${s.id} · ${s.title}`);
      L.push("");
      L.push(s.text);
      L.push("");
      s.options.forEach((o, i) => {
        L.push(`${"ABCD"[i]}. ${tag(o.dir)} ${o.text}  `);
        L.push(`   _${o.hint}_  `);
      });
      L.push("");
      L.push(`Термин: **${s.term.word}** — ${s.term.def}  `);
      L.push(`Вопрос классу: ${s.ask}  `);
      L.push(`Нет в этой ситуации: ${absent.join(", ")}`);
      L.push("");
    });
  });

  L.push("## Быстрые выборы «Это или то»");
  L.push("");
  L.push(`Вопрос на экране: «${bank.quick.prompt}»`);
  L.push("");
  L.push("| № | Вариант 1 | Вариант 2 |");
  L.push("|---|---|---|");
  bank.quick.items.forEach((q) => L.push(`| ${q.id} | ${tag(q.a.dir)} ${q.a.text} | ${tag(q.b.dir)} ${q.b.text} |`));
  L.push("");

  L.push("## Командные кейсы");
  L.push("");
  bank.cases.forEach((c) => {
    L.push(`### ${c.id} · ${c.title}`);
    L.push("");
    L.push(c.intro);
    L.push("");
    c.steps.forEach((st, i) => {
      L.push(`**Шаг ${i + 1}. ${st.title}.** ${st.text}`);
      L.push("");
      st.options.forEach((o, j) => {
        L.push(`${"ABCD"[j]}. ${tag(o.dir)} ${o.text}  `);
        L.push(`   _${o.hint}_  `);
      });
      L.push("");
    });
    L.push(`**Чем закончилось.** ${c.outro}`);
    L.push("");
    L.push(`**Вывод про команду.** ${c.team}`);
    L.push("");
    L.push(`Термин: **${c.term.word}** — ${c.term.def}  `);
    L.push(`Вопрос классу: ${c.ask}`);
    L.push("");
  });

  L.push("## Проверь себя");
  L.push("");
  bank.directions.forEach((d) => {
    L.push(`### ${d.short} · ${d.name}`);
    L.push("");
    bank.quiz.filter((q) => q.dir === d.id).forEach((q) => {
      L.push(`**${q.q}**`);
      L.push("");
      q.options.forEach((o, i) => L.push(`- ${i === q.correct ? "✅ " : ""}${o}`));
      L.push("");
      L.push(`_${q.explain}_${q.source ? ` Источник: ${q.source}.` : ""}`);
      L.push("");
    });
  });

  L.push("## Достижения");
  L.push("");
  L.push("| Название | Когда даётся | Режимы |");
  L.push("|---|---|---|");
  bank.badges.forEach((b) => L.push(`| ${b.title} | ${b.text}${b.phone && b.phone.text ? ` На телефоне: «${b.phone.text}»` : ""}${b.phone && b.phone.rule ? " На телефоне порог выше." : ""} | ${b.modes.join(", ")} |`));
  L.push("");

  return L.join("\n");
}

// ---------- запуск ----------

const cmd = process.argv[2] || "check";
const bank = loadBank();
if (cmd === "check") {
  report(bank);
} else if (cmd === "md") {
  const out = path.join(ROOT, "docs", "BANK.md");
  fs.writeFileSync(out, toMarkdown(bank));
  console.log("Собрано: " + path.relative(ROOT, out));
} else {
  console.log("Команды: check, md");
  process.exitCode = 1;
}
