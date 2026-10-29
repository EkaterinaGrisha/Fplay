// ПРОФСИЛА · личный режим: экраны игры на телефоне.
// Старт → персонаж → ситуации, быстрые выборы, вопросы, кейс → итог → все профессии.
// Всё считается в браузере. В localStorage хранится только список сыгранных заданий,
// в sessionStorage — незаконченная партия, чтобы её можно было продолжить.

(function () {
  "use strict";

  var P = window.PROFSILA;
  var E = P.engine;
  var app = document.getElementById("app");
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ---------- справочники из банка ----------

  var DIR = {}, BLOCK = {}, SIT = {}, QUICK = {}, CASE = {}, QUIZ = {}, MODE = {};
  P.directions.forEach(function (d) { DIR[d.id] = d; });
  P.blocks.forEach(function (b) {
    BLOCK[b.id] = b;
    b.situations.forEach(function (s) { SIT[s.id] = s; });
  });
  P.quick.items.forEach(function (q) { QUICK[q.id] = q; });
  P.cases.forEach(function (c) { CASE[c.id] = c; });
  P.quiz.forEach(function (q) { QUIZ[q.id] = q; });
  // Личный режим играет телефонные настройки длительности (поле phone в modes.js).
  P.modes.forEach(function (m) { MODE[m.id] = E.modeFor(P, m.id, "phone"); });

  // ---------- персонажи (как в макете design/Character.dc.html) ----------

  var AV_NAMES = ["Лиса в наушниках", "Енот в шапке", "Панда в очках-звёздах", "Кот в панаме", "Сова в шарфе", "Медведь в кепке", "Зайка с бантом", "Пингвин в гоглах", "Лягушка в короне", "Аксолотль в очках-сердечках", "Капибара в бандане", "Ленивец с маской для сна", "Дракончик в очках", "Единорог с цветком", "Йети в меховых наушниках", "Привидение в колпаке", "Пришелец в тёмных очках", "Циклоп в кепке с пропеллером", "Осьминог в бескозырке", "Ёжик в венке", "Тигрёнок с повязкой", "Коала с жвачкой", "Слайм с вишенкой", "Фениксёнок с наушниками"];
  var ADJ = ["Смелый", "Хитрый", "Неутомимый", "Весёлый", "Спокойный", "Дерзкий", "Мудрый", "Быстрый", "Сияющий", "Загадочный", "Отважный", "Внимательный"];
  var NOUN = ["Аналитик", "Стратег", "Исследователь", "Изобретатель", "Навигатор", "Комбинатор", "Мечтатель", "Капитан", "Тактик", "Первопроходец", "Архитектор", "Сыщик"];
  var BULB = ["#FF9F40", "#3DDC97", "#FF5FA2", "#4C7DFF", "#B285FF", "#5B2FD6"];
  var PIECE = ["#5B2FD6", "#FF5FA2", "#3DDC97", "#FF9F40", "#4C7DFF", "#B285FF"];

  // Оформление баннеров ситуаций по блокам (до появления иллюстраций).
  var BLOCK_LOOK = {
    money: { bg: "#DFF8EC", c: "#3DDC97", ic: ["M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M3 7l12-4v4", "M16 14h2"] },
    business: { bg: "#FFEBD6", c: "#FF9F40", ic: ["M4 10v10h16V10", "M3 10l2-6h14l2 6z", "M10 20v-5h4v5"] },
    safety: { bg: "#E1E9FF", c: "#4C7DFF", ic: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z", "M12 8v5", "M12 16.5h.01"] },
    city: { bg: "#FFE3EF", c: "#FF5FA2", ic: ["M2 21h20", "M4 21V9l6-4v16", "M10 21V11l8 3v7"] },
    tech: { bg: "#F0E6FF", c: "#C99BFF", ic: ["M7 7h10v10H7z", "M10 3v4M14 3v4M10 17v4M14 17v4", "M3 10h4M3 14h4M17 10h4M17 14h4"] },
    people: { bg: "#DDF6F9", c: "#2EC4D6", ic: ["M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"] },
    "case": { bg: "#F3FFC7", c: "#D7FF45", ic: ["M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M3 20a6 6 0 0 1 12 0", "M16 5a3 3 0 0 1 0 6", "M21 20a6 6 0 0 0-4-5.6"] }
  };

  // ---------- мелкие помощники ----------

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c];
    });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  // ["Физика", "Химия", "Информатика"] → «Физика, Химия или Информатика».
  function orList(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " или " + a[a.length - 1]; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function fx(n) { return Math.round(n * 10) / 10; }
  function avatarSrc(i) { return "avatars/a" + pad2((((i % 24) + 24) % 24) + 1) + ".svg"; }
  function nick() { return ADJ[S.adj] + " " + NOUN[S.noun]; }

  function store(kind) {
    try { var s = window[kind]; var k = "__profsila"; s.setItem(k, "1"); s.removeItem(k); return s; } catch (e) { return null; }
  }
  var LS = store("localStorage");
  var SS = store("sessionStorage");
  function load(s, key, fallback) {
    if (!s) return fallback;
    try { var v = s.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(s, key, val) { if (s) try { s.setItem(key, JSON.stringify(val)); } catch (e) { /* хранилище недоступно — играем без него */ } }
  function drop(s, key) { if (s) try { s.removeItem(key); } catch (e) { /* то же */ } }

  function svg(paths, size, sw, extra) {
    return "<svg width=\"" + size + "\" height=\"" + size + "\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"" + sw +
      "\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"" + (extra || "") + ">" +
      paths.filter(Boolean).map(function (p) { return "<path d=\"" + p + "\"></path>"; }).join("") + "</svg>";
  }
  function dirIcon(d, size, sw) { return svg([d.icon.a, d.icon.b, d.icon.c], size, sw || 2.2); }
  function dirDot(d, size, r) {
    size = size || 28;
    return "<span class=\"dir-tile\" style=\"width:" + size + "px;height:" + size + "px;border-radius:" + (r || Math.round(size / 3)) + "px;background:" + d.color + "\">" +
      dirIcon(d, Math.round(size * 0.57), 2.4) + "</span>";
  }

  var ICON = {
    back: svg(["M15 5l-7 7 7 7"], 20, 2.4),
    home: svg(["M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"], 20, 2.2),
    arrow: svg(["M5 12h14M13 6l6 6-6 6"], 22, 2.6),
    retry: svg(["M20 11a8 8 0 1 0-2.3 5.7", "M20 4v7h-7"], 22, 2.6),
    grid: "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"2\"></rect></svg>",
    play: "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M7 4.5v15l13-7.5z\" fill=\"currentColor\"></path></svg>",
    pause: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"6\" y=\"5\" width=\"4\" height=\"14\" rx=\"1.5\" fill=\"currentColor\"></rect><rect x=\"14\" y=\"5\" width=\"4\" height=\"14\" rx=\"1.5\" fill=\"currentColor\"></rect></svg>",
    lock: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5\" y=\"11\" width=\"14\" height=\"10\" rx=\"2\"></rect><path d=\"M8 11V7a4 4 0 0 1 8 0v4\"></path></svg>",
    info: svg(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 11v5M12 8h.01"], 16, 2),
    star: svg(["M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"], 16, 2),
    dice: "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"4\"></rect><circle cx=\"8.5\" cy=\"8.5\" r=\"1.3\" fill=\"currentColor\"></circle><circle cx=\"15.5\" cy=\"15.5\" r=\"1.3\" fill=\"currentColor\"></circle><circle cx=\"15.5\" cy=\"8.5\" r=\"1.3\" fill=\"currentColor\"></circle><circle cx=\"8.5\" cy=\"15.5\" r=\"1.3\" fill=\"currentColor\"></circle><circle cx=\"12\" cy=\"12\" r=\"1.3\" fill=\"currentColor\"></circle></svg>",
    check: svg(["M5 12.5l4.5 4.5L19 7.5"], 20, 3),
    cross: svg(["M6 6l12 12M18 6L6 18"], 20, 3),
    chevron: svg(["M6 9l6 6 6-6"], 20, 2.4),
    cap: svg(["M2 9l10-5 10 5-10 5z", "M6 11v5c3 2.5 9 2.5 12 0v-5"], 20, 2.2),
    book: svg(["M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z", "M4 21V5", "M9 7h6"], 20, 2.2),
    bulb: svg(["M9.5 18.5h5", "M10.5 21h3", "M9 15.5v-1a6 6 0 1 1 6 0v1z"], 20, 2.2),
    target: svg(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M12 12h.01"], 20, 2.2),
    medal: svg(["M8 3l4 6 4-6", "M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", "M12 13l1 2h2l-1.5 1.5.5 2-2-1-2 1 .5-2L9 15h2z"], 22, 1.8),
    users: svg(BLOCK_LOOK["case"].ic, 20, 2.2),
    screen: svg(["M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M8 20h8M12 16v4"], 18, 2),
    skip: svg(["M6 5l7 7-7 7M17 5v14"], 24, 2.4),
    close: svg(["M6 6l12 12M18 6L6 18"], 24, 2.4),
    full: svg(["M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"], 24, 2.4),
    hand: svg(["M8 13V5.5a1.5 1.5 0 0 1 3 0V12", "M11 11.5v-8a1.5 1.5 0 0 1 3 0V12", "M14 11.5V5a1.5 1.5 0 0 1 3 0v7", "M17 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1.5a6 6 0 0 1-4.6-2.2L4 15.5a1.6 1.6 0 0 1 2.4-2l1.6 1.5"], 40, 2),
    clock: svg(["M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M12 9v4l2.5 2M9 2h6"], 30, 2.4),
    minus: svg(["M6 12h12"], 22, 3),
    download: svg(["M12 4v11", "M7 10l5 5 5-5", "M5 20h14"], 24, 2.2),
    qr: svg(["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"], 24, 2),
    print: svg(["M7 9V3h10v6", "M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2", "M7 14h10v7H7z"], 24, 2)
  };
  var KEYS = ["A", "B", "C", "D"];

  // ---------- состояние ----------

  var S = {
    screen: "start",
    modeId: "std",
    av: rnd(24), adj: rnd(ADJ.length), noun: rnd(NOUN.length),
    spinning: false,
    paused: false,
    run: null,
    result: null,
    back: "start",
    saved: null
  };
  var autoTimer = null;
  var AUTO_S = (P.personal && P.personal.autoNextSeconds) || 6;
  var spinTimer = null;

  // Аватары грузятся заранее, чтобы слот-машина не мигала пустым окном.
  for (var a = 0; a < 24; a++) new Image().src = avatarSrc(a);

  // Партию, сохранённую прошлой версией банка, не продолжаем: в ней могут быть старые направления.
  var savedRun = load(SS, "profsila.run", null);
  if (savedRun && savedRun.v === P.meta.bankVersion && savedRun.run && savedRun.run.items) S.saved = savedRun;

  function persist() {
    if (!S.run) return;
    save(SS, "profsila.run", { v: P.meta.bankVersion, modeId: S.modeId, av: S.av, adj: S.adj, noun: S.noun, run: S.run });
  }

  // ---------- навигация ----------

  function go(screen) {
    clearTimeout(autoTimer);
    S.screen = screen;
    S.paused = false;
    render(true);
  }

  // Кнопка «назад» на телефоне во время партии открывает паузу, а не закрывает игру.
  function guardHistory() {
    try { history.pushState({ profsila: 1 }, ""); } catch (e) { /* file:// в старых браузерах */ }
  }
  window.addEventListener("popstate", function () {
    if (P.route !== "personal") return;
    if (S.screen === "play") {
      S.paused = true;
      guardHistory();
      render(false);
    } else if (S.screen === "catalog") {
      go(S.back);
    }
  });

  // ---------- партия ----------

  function seenList() { return load(LS, "profsila.seen", []); }

  function startRun() {
    var game = E.drawGame(P, S.modeId, { seed: rnd(2147483647), seen: seenList(), device: "phone" });
    S.run = {
      items: game.screens.map(function (s) { return { type: s.type, id: s.item.id, block: s.block || null }; }),
      i: 0,
      cs: -1,
      phase: game.screens[0].type === "case" ? "intro" : "ask",
      picks: [],
      quizCorrect: 0,
      quizTotal: 0,
      order: {},
      last: null,
      answer: null
    };
    S.saved = null;
    persist();
    guardHistory();
    go("play");
  }

  function cur() {
    var it = S.run.items[S.run.i];
    var obj = it.type === "situation" ? SIT[it.id] : it.type === "quick" ? QUICK[it.id] : it.type === "quiz" ? QUIZ[it.id] : CASE[it.id];
    return { type: it.type, id: it.id, block: it.block, obj: obj };
  }

  function unitsTotal() {
    return S.run.items.reduce(function (n, it) { return n + (it.type === "case" ? CASE[it.id].steps.length : 1); }, 0);
  }
  function unitsDone() { return S.run.picks.length + S.run.quizTotal; }

  // Варианты текущего вопроса в перемешанном порядке; порядок запоминается, чтобы не прыгал.
  function currentOptions() {
    var r = S.run, c = cur(), key = r.i + ":" + r.cs, list;
    if (c.type === "situation") list = c.obj.options;
    else if (c.type === "case") list = c.obj.steps[r.cs].options;
    else if (c.type === "quick") list = [c.obj.a, c.obj.b];
    else list = c.obj.options.map(function (t, k) { return { text: t, k: k }; });
    if (!r.order[key]) r.order[key] = E.shuffle(list.map(function (_, k) { return k; }), Math.random);
    return r.order[key].map(function (k) { return { o: list[k], k: k }; });
  }

  function pick(pos) {
    var r = S.run, c = cur();
    if (r.phase !== "ask") return;
    var chosen = currentOptions()[pos];
    if (!chosen) return;
    if (c.type === "quiz") {
      r.answer = chosen.k;
      r.quizTotal += 1;
      if (chosen.k === c.obj.correct) r.quizCorrect += 1;
      r.phase = "answered";
    } else {
      var offered, kind = c.type, block = null;
      if (c.type === "situation") { offered = c.obj.options.map(function (o) { return o.dir; }); block = c.block; }
      else if (c.type === "case") { offered = c.obj.steps[r.cs].options.map(function (o) { return o.dir; }); }
      else { offered = [c.obj.a.dir, c.obj.b.dir]; }
      r.picks.push({ kind: kind, dir: chosen.o.dir, offered: offered, block: block, ref: c.id, step: c.type === "case" ? r.cs : null });
      r.last = { dir: chosen.o.dir, k: chosen.k };
      r.phase = "react";
    }
    persist();
    render(true);
  }

  function next() {
    clearTimeout(autoTimer);
    var r = S.run, c = cur();
    if (c.type === "case" && r.phase === "intro") { r.cs = 0; r.phase = "ask"; }
    else if (c.type === "case" && r.phase === "react") {
      if (r.cs < c.obj.steps.length - 1) { r.cs += 1; r.phase = "ask"; } else { r.phase = "outro"; }
    } else {
      r.i += 1;
      r.cs = -1;
      r.answer = null;
      r.last = null;
      if (r.i >= r.items.length) { finish(); return; }
      r.phase = r.items[r.i].type === "case" ? "intro" : "ask";
    }
    persist();
    render(true);
  }

  function finish() {
    var r = S.run;
    var sc = E.score(P, r.picks);
    var top = DIR[sc.top];
    var res = {
      modeId: S.modeId,
      av: S.av, adj: S.adj, noun: S.noun,
      picks: r.picks,
      items: r.items,
      quizCorrect: r.quizCorrect,
      quizTotal: r.quizTotal,
      factIdx: rnd(top.facts.length),
      tryIdx: rnd(top.tryNow.length)
    };
    var seen = seenList().concat(r.items.filter(function (it) { return it.type !== "quick"; }).map(function (it) { return it.id; }));
    save(LS, "profsila.seen", seen.slice(-80));
    drop(SS, "profsila.run");
    save(SS, "profsila.result", res);
    S.run = null;
    S.result = res;
    go("result");
  }

  // ---------- общие куски разметки ----------

  function header() {
    var total = unitsTotal(), done = unitsDone();
    var asking = S.run.phase === "ask" || S.run.phase === "intro";
    var shown = Math.min(asking ? done + 1 : done, total);
    var segs = "";
    for (var k = 0; k < total; k++) segs += "<span class=\"" + (k < done ? "done" : (k === done && asking ? "now" : "")) + "\"></span>";
    return "<div class=\"stack\">" +
      "<div class=\"player\"><img src=\"" + avatarSrc(S.av) + "\" alt=\"\"><div class=\"who\"><p>Игрок</p><p>" + esc(nick()) + "</p></div>" +
      "<p class=\"pill\"><span class=\"sr-only\">Вопрос </span><b>" + shown + "</b> из " + total + "</p>" +
      "<button class=\"icon-btn press\" data-act=\"pause\" aria-label=\"Пауза\">" + ICON.pause + "</button></div>" +
      "<div class=\"segs\" aria-hidden=\"true\" style=\"grid-template-columns:repeat(" + total + ",minmax(0,1fr))\">" + segs + "</div></div>";
  }

  function banner(lookId, title, tagText, eyebrow) {
    var L = BLOCK_LOOK[lookId];
    var art = "<svg class=\"art\" viewBox=\"0 0 342 132\" preserveAspectRatio=\"xMaxYMid slice\" aria-hidden=\"true\">" +
      "<rect width=\"342\" height=\"132\" fill=\"" + L.bg + "\"></rect>" +
      "<circle cx=\"300\" cy=\"62\" r=\"86\" fill=\"" + L.c + "\" opacity=\".35\"></circle>" +
      "<circle cx=\"236\" cy=\"128\" r=\"26\" fill=\"" + L.c + "\" opacity=\".3\"></circle>" +
      "<path d=\"M228 94 Q229.2 102.8 238 104 Q229.2 105.2 228 114 Q226.8 105.2 218 104 Q226.8 102.8 228 94 Z\" fill=\"#5B2FD6\"></path>" +
      "<circle cx=\"326\" cy=\"116\" r=\"4\" fill=\"#141033\" opacity=\".5\"></circle>" +
      "<rect x=\"252\" y=\"30\" width=\"68\" height=\"68\" rx=\"20\" fill=\"#FFFFFF\" stroke=\"#141033\" stroke-width=\"3\"></rect>" +
      "<g transform=\"translate(266 44) scale(1.67)\" fill=\"none\" stroke=\"#141033\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" +
      L.ic.map(function (p) { return "<path d=\"" + p + "\"></path>"; }).join("") + "</g></svg>";
    return "<div class=\"scene in1\">" + art +
      (eyebrow ? "<p class=\"eyebrow kind\" style=\"color:#2A2450\">" + esc(eyebrow) + "</p>" : "") +
      "<p class=\"scene-title" + (title.length > 24 ? " long" : "") + "\">" + esc(title) + "</p>" +
      "<span class=\"tag\">" + esc(tagText) + "</span></div>";
  }

  function optionButtons(list, from) {
    return list.map(function (x, k) {
      var pos = (from || 0) + k;
      return "<button class=\"opt press\" data-act=\"pick\" data-pos=\"" + pos + "\">" +
        "<span class=\"key\">" + KEYS[pos] + "</span><span class=\"txt\">" + esc(x.o.text) + "</span></button>";
    }).join("");
  }

  function burst(d, small) {
    var rays = "";
    for (var k = 0; k < 16; k++) {
      var a = k / 16 * Math.PI * 2, r1 = k % 2 ? 116 : 112, r2 = k % 2 ? 132 : 142;
      rays += "<line x1=\"" + fx(145 + Math.cos(a) * r1) + "\" y1=\"" + fx(145 + Math.sin(a) * r1) + "\" x2=\"" + fx(145 + Math.cos(a) * r2) +
        "\" y2=\"" + fx(145 + Math.sin(a) * r2) + "\" stroke=\"" + d.color + "\" stroke-width=\"" + (k % 2 ? 4 : 7) + "\" stroke-linecap=\"round\" opacity=\".85\"></line>";
    }
    rays += "<circle cx=\"145\" cy=\"145\" r=\"104\" fill=\"none\" stroke=\"" + d.color + "\" stroke-width=\"2\" stroke-dasharray=\"4 10\" opacity=\".9\"></circle>";
    var cols = [d.color, "#5B2FD6", "#141033"], pieces = "";
    for (var p = 0; p < 14; p++) {
      pieces += "<div style=\"transform:rotate(" + fx(p * 360 / 14 + 6) + "deg)\"><span class=\"piece\" style=\"width:" + (p % 3 === 0 ? 16 : 10) +
        "px;height:" + (p % 3 === 0 ? 6 : 10) + "px;border-radius:" + (p % 2 ? "50%" : "3px") + ";background:" + cols[p % 3] + "\"></span></div>";
    }
    return "<div class=\"burst-wrap" + (small ? " small" : "") + "\">" +
      "<svg class=\"rays\" viewBox=\"0 0 290 290\" aria-hidden=\"true\">" + rays + "</svg>" +
      "<div class=\"pieces\" aria-hidden=\"true\">" + pieces + "</div>" +
      "<div class=\"tile pop\" style=\"background:" + d.color + "\">" + dirIcon(d, small ? 64 : 84, 2) + "</div></div>";
  }

  // ---------- экраны ----------

  function viewStart() {
    var m = MODE[S.modeId];
    var av = [
      { i: 0, s: 84, st: "left:0;top:10px;transform:rotate(-8deg)", c: "bob" },
      { i: 16, s: 58, st: "left:136px;top:18px;transform:rotate(5deg)", c: "bob3" },
      { i: 9, s: 96, st: "right:0;top:0;transform:rotate(7deg)", c: "bob2" },
      { i: 3, s: 62, st: "left:-14px;top:332px;transform:rotate(10deg)", c: "bob2" },
      { i: 23, s: 68, st: "right:-14px;top:326px;transform:rotate(-6deg)", c: "bob" }
    ].map(function (a) {
      return "<div style=\"position:absolute;" + a.st + "\"><img class=\"av " + a.c + "\" src=\"" + avatarSrc(a.i) + "\" alt=\"\" style=\"position:static;width:" + a.s + "px;height:" + a.s + "px\"></div>";
    }).join("");
    var resume = "";
    if (S.saved) {
      var sr = S.saved.run, total = sr.items.reduce(function (n, it) { return n + (it.type === "case" ? CASE[it.id].steps.length : 1); }, 0);
      resume = "<div class=\"resume\"><p><b>Есть незаконченная партия</b><br><span class=\"muted\">" + esc(MODE[S.saved.modeId].name) + " · пройдено " +
        (sr.picks.length + sr.quizTotal) + " из " + total + "</span></p>" +
        "<button class=\"btn press\" style=\"width:auto;min-height:44px;padding:0 14px\" data-act=\"resume\">Продолжить</button></div>";
    }
    return "<div class=\"screen\" tabindex=\"-1\">" +
      "<div class=\"brand\"><img src=\"assets/logo-sei.svg\" alt=\"СЭИ\"><p>" + esc(P.meta.orgFull) + "</p></div>" +
      "<div class=\"grow\" style=\"display:flex;align-items:center\"><div class=\"hero\">" + av +
      "<svg class=\"spark\" viewBox=\"0 0 342 384\" aria-hidden=\"true\">" +
      "<path class=\"tw\" d=\"M106 86 Q107.5 96.5 118 98 Q107.5 99.5 106 110 Q104.5 99.5 94 98 Q104.5 96.5 106 86 Z\" fill=\"#5B2FD6\"></path>" +
      "<path class=\"tw2\" d=\"M226 98 Q227 105 234 106 Q227 107 226 114 Q225 107 218 106 Q225 105 226 98 Z\" fill=\"#FF5FA2\"></path>" +
      "<path class=\"tw2\" d=\"M24 128 Q25 134 31 135 Q25 136 24 142 Q23 136 17 135 Q23 134 24 128 Z\" fill=\"#3DDC97\"></path>" +
      "<path class=\"tw\" d=\"M326 117 Q327.5 126.5 337 128 Q327.5 129.5 326 139 Q324.5 129.5 315 128 Q324.5 126.5 326 117 Z\" fill=\"#B285FF\"></path>" +
      "<circle cx=\"10\" cy=\"162\" r=\"5\" fill=\"#FF9F40\"></circle><circle cx=\"334\" cy=\"262\" r=\"4\" fill=\"#4C7DFF\"></circle></svg>" +
      "<div class=\"copy\"><p class=\"badge-top\">игра-профориентация</p>" +
      "<h1 class=\"logo-word\" data-focus tabindex=\"-1\">ПРОФ<br><span>СИЛА</span></h1>" +
      "<p class=\"lead\" style=\"margin-top:18px;max-width:250px\">Пройди жизненные ситуации и узнай свою профессию-суперсилу</p></div></div></div>" +
      resume +
      "<div class=\"stack\" style=\"gap:10px\"><p style=\"font-size:14px;font-weight:600;color:var(--muted)\" id=\"modes-label\">Сколько у тебя времени?</p>" +
      "<div class=\"modes\" role=\"group\" aria-labelledby=\"modes-label\">" + P.modes.map(function (x) {
        return "<button class=\"mode press\" data-act=\"mode\" data-id=\"" + x.id + "\" aria-pressed=\"" + (x.id === S.modeId) + "\">" +
          "<span class=\"t\">" + esc(x.minutes) + "</span><span class=\"n\">мин · " + esc(x.name) + "</span></button>";
      }).join("") + "</div>" +
      "<p class=\"note\" aria-live=\"polite\" style=\"min-height:18px\">" + esc(m.desc) + "</p></div>" +
      "<button class=\"btn btn-cta big press\" data-act=\"play\">" + ICON.play + "Играть</button>" +
      "<div class=\"row\" style=\"justify-content:space-between;flex-wrap:wrap;row-gap:0\">" +
      "<button class=\"link-btn\" data-act=\"catalog\">" + ICON.grid + "Все профессии</button>" +
      "<button class=\"link-btn\" data-act=\"projector\">" + ICON.screen + "Для проектора</button></div>" +
      "<p class=\"row note\" style=\"gap:6px;font-size:12px;margin-top:-8px\">" + ICON.lock + "Без регистрации и сбора данных</p>" +
      "</div>";
  }

  function viewCharacter() {
    var bulbs = function (offset) {
      var out = "";
      for (var k = 0; k < 9; k++) out += "<span class=\"" + (k % 2 ? "bulb-a" : "bulb-b") + "\" style=\"background:" + BULB[(k + offset) % BULB.length] + "\"></span>";
      return out;
    };
    var pieces = "";
    if (!S.spinning) {
      for (var k = 0; k < 12; k++) {
        pieces += "<div style=\"transform:rotate(" + (k * 30 + 8) + "deg)\"><span class=\"piece\" style=\"width:" + (k % 3 === 0 ? 14 : 10) + "px;height:" + (k % 3 === 0 ? 6 : 10) +
          "px;border-radius:" + (k % 2 ? "50%" : "3px") + ";background:" + PIECE[k % PIECE.length] + ";animation-delay:" + ((k % 4) * 0.03) + "s;animation-duration:.9s\"></span></div>";
      }
    }
    return "<div class=\"screen\" tabindex=\"-1\">" +
      "<div class=\"row\" style=\"justify-content:space-between\"><button class=\"icon-btn press\" data-act=\"home\" aria-label=\"Назад\">" + ICON.back + "</button>" +
      "<h1 class=\"title\" data-focus tabindex=\"-1\">Кто ты сегодня?</h1><span style=\"width:44px\"></span></div>" +
      "<div class=\"slot" + (S.spinning ? " fast" : "") + "\">" +
      "<div class=\"bulbs\">" + bulbs(0) + "</div>" +
      "<div class=\"window\"><div class=\"reel " + (S.spinning ? "spin" : "land") + "\" id=\"reel\">" +
      "<img class=\"side\" id=\"av-prev\" src=\"" + avatarSrc(S.av - 1) + "\" alt=\"\">" +
      "<img id=\"av-cur\" src=\"" + avatarSrc(S.av) + "\" alt=\"Твой персонаж: " + esc(AV_NAMES[S.av]) + "\">" +
      "<img class=\"side\" id=\"av-next\" src=\"" + avatarSrc(S.av + 1) + "\" alt=\"\"></div>" +
      "<svg class=\"arrows\" viewBox=\"0 0 236 262\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><path d=\"M0 119 L13 131 L0 143 Z\" fill=\"#5B2FD6\"></path><path d=\"M236 119 L223 131 L236 143 Z\" fill=\"#5B2FD6\"></path></svg>" +
      "<div class=\"pieces\" aria-hidden=\"true\">" + pieces + "</div></div>" +
      "<div class=\"bulbs\">" + bulbs(3) + "</div>" +
      "<svg class=\"lever" + (S.spinning ? " pull" : "") + "\" width=\"26\" height=\"110\" viewBox=\"0 0 26 110\" aria-hidden=\"true\"><rect x=\"10\" y=\"18\" width=\"6\" height=\"84\" rx=\"3\" fill=\"#8A82C2\"></rect><circle cx=\"13\" cy=\"13\" r=\"12\" fill=\"#FF5FA2\"></circle><circle cx=\"9\" cy=\"9\" r=\"3.5\" fill=\"#FFFFFF\" opacity=\".6\"></circle><rect x=\"2\" y=\"96\" width=\"22\" height=\"14\" rx=\"5\" fill=\"#141033\"></rect></svg>" +
      "</div>" +
      "<div class=\"stack center\" style=\"gap:8px\" aria-live=\"polite\"><p class=\"eyebrow\">Твой ник</p>" +
      "<p class=\"nick" + (S.spinning ? " nick-spin" : "") + "\" id=\"nick\"><span>" + esc(ADJ[S.adj]) + "</span><br>" + esc(NOUN[S.noun]) + "</p></div>" +
      "<p class=\"free-note\">" + ICON.info + "Персонаж выпадает случайно и не влияет на результат</p>" +
      "<div class=\"stack push\"><button class=\"btn press\" data-act=\"reroll\"" + (S.spinning ? " disabled" : "") + ">" + ICON.dice + "Другой персонаж</button>" +
      "<button class=\"btn btn-cta press\" data-act=\"go\"" + (S.spinning ? " disabled" : "") + ">Поехали" + ICON.arrow + "</button></div>" +
      "</div>";
  }

  function viewSituation(c) {
    var r = S.run, b = BLOCK[c.block];
    var num = r.items.slice(0, r.i + 1).filter(function (it) { return it.type === "situation"; }).length;
    return "<div class=\"screen\" tabindex=\"-1\">" + header() +
      banner(c.block, c.obj.title, "Ситуация " + num + " · " + b.title) +
      "<h1 class=\"prompt in2\" data-focus tabindex=\"-1\">" + esc(c.obj.text) + "</h1>" +
      "<div class=\"opts in3\">" + optionButtons(currentOptions()) + "</div>" +
      "<p class=\"free-note in4 push\">" + ICON.star + "Правильных ответов нет — выбирай то, что ближе тебе</p>" +
      "</div>";
  }

  function viewCaseStep(c) {
    var r = S.run, st = c.obj.steps[r.cs];
    return "<div class=\"screen\" tabindex=\"-1\">" + header() +
      banner("case", st.title, "Кейс · шаг " + (r.cs + 1) + " из " + c.obj.steps.length, c.obj.title) +
      "<h1 class=\"prompt in2\" data-focus tabindex=\"-1\">" + esc(st.text) + "</h1>" +
      "<div class=\"opts in3\">" + optionButtons(currentOptions()) + "</div>" +
      "<p class=\"free-note in4 push\">" + ICON.users + "Выбери, какую роль ты возьмёшь в команде</p>" +
      "</div>";
  }

  function viewQuick(c) {
    var list = currentOptions();
    return "<div class=\"screen\" tabindex=\"-1\">" + header() +
      "<div class=\"stack in1\" style=\"gap:6px\"><p class=\"eyebrow\">Это или то</p><h1 class=\"title\" style=\"font-size:24px\" data-focus tabindex=\"-1\">" + esc(P.quick.prompt) + "</h1></div>" +
      "<div class=\"duel in2\">" +
      optionButtons([list[0]], 0) +
      "<span class=\"or\" aria-hidden=\"true\">или</span>" +
      optionButtons([list[1]], 1) +
      "</div>" +
      "<p class=\"free-note push\">" + ICON.star + "Не думай долго — выбирай первое, что нравится</p>" +
      "</div>";
  }

  function viewQuiz(c) {
    var r = S.run, q = c.obj, d = DIR[q.dir], list = currentOptions(), answered = r.phase === "answered";
    var opts = list.map(function (x, pos) {
      var cls = "", mark = KEYS[pos];
      if (answered) {
        if (x.k === q.correct) { cls = "is-right"; mark = ICON.check; }
        else if (x.k === r.answer) { cls = "is-wrong"; mark = ICON.cross; }
        else cls = "is-dim";
      }
      return "<button class=\"opt press " + cls + "\" data-act=\"pick\" data-pos=\"" + pos + "\"" + (answered ? " disabled" : "") + ">" +
        "<span class=\"key\">" + mark + "</span><span class=\"txt\">" + esc(x.o.text) +
        (answered && x.k === q.correct ? "<span class=\"sr-only\"> — верный ответ</span>" : "") +
        (answered && x.k === r.answer && x.k !== q.correct ? "<span class=\"sr-only\"> — твой ответ</span>" : "") + "</span></button>";
    }).join("");
    var right = r.answer === q.correct;
    var verdict = answered ?
      "<div class=\"card tight verdict in1\" role=\"status\"><span class=\"mark\" style=\"background:" + (right ? "#138A57" : "var(--no)") + "\">" + (right ? ICON.check : ICON.cross) + "</span>" +
      "<div class=\"stack\" style=\"gap:4px\"><p style=\"font-family:var(--display);font-weight:800;font-size:17px\">" + (right ? "Верно!" : "Не совсем") + "</p>" +
      "<p style=\"font-size:15px;line-height:1.45\">" + esc(q.explain) + "</p></div></div>" : "";
    return "<div class=\"screen\" tabindex=\"-1\">" + header() +
      "<div class=\"row in1\" style=\"gap:10px\">" + dirDot(d, 32) + "<div><p class=\"eyebrow\">Проверь себя</p><p class=\"note\">Вопрос из мира: " + esc(d.tab.toLowerCase()) + "</p></div></div>" +
      "<h1 class=\"prompt in2\"" + (answered ? "" : " data-focus") + " tabindex=\"-1\">" + esc(q.q) + "</h1>" +
      "<div class=\"opts in3\">" + opts + "</div>" + verdict +
      (answered ? "<button class=\"btn btn-cta press push\" data-act=\"next\" data-focus>" + nextLabel() + ICON.arrow + "</button>" :
        "<p class=\"free-note push\">" + ICON.info + "На профиль не влияет — это для эрудиции</p>") +
      "</div>";
  }

  function nextLabel() {
    var r = S.run, c = cur();
    var lastItem = r.i === r.items.length - 1;
    if (c.type === "case" && r.phase === "react" && r.cs < c.obj.steps.length - 1) return "Дальше";
    if (lastItem && (c.type !== "case" || r.phase === "outro")) return "К итогу";
    return "Дальше";
  }

  function viewReaction(c) {
    var r = S.run, m = MODE[S.modeId], d = DIR[r.last.dir];
    var quick = c.type === "quick";
    var pts = quick ? P.scoring.quickPoints : c.type === "case" ? P.scoring.casePoints : P.scoring.situationPoints;
    var showHint = m.hints && !quick;
    var auto = !showHint;
    var hintText = "", others = "", ask = "";
    if (showHint) {
      var opts = c.type === "case" ? c.obj.steps[r.cs].options : c.obj.options;
      hintText = opts[r.last.k].hint;
      if (m.discussion) {
        others = "<details class=\"others\"><summary>Как поступили бы другие" + ICON.chevron + "</summary><ul>" +
          opts.filter(function (o, k) { return k !== r.last.k; }).map(function (o) {
            return "<li>" + dirDot(DIR[o.dir], 28) + "<span><b>" + esc(o.text) + ".</b> " + esc(o.hint) + "</span></li>";
          }).join("") + "</ul></details>";
        if (c.type === "situation") ask = "<div class=\"ask\"><p class=\"eyebrow\">Подумай</p><p>" + esc(c.obj.ask) + "</p></div>";
      }
    }
    return "<div class=\"screen\" tabindex=\"-1\">" + header() +
      "<div class=\"grow stack\" style=\"justify-content:center;gap:14px\">" + burst(d, showHint || quick) +
      "<p class=\"plus rise\" style=\"text-shadow:5px 5px 0 " + d.color + "\" aria-hidden=\"true\">+" + pts + "</p>" +
      "<p class=\"plus-line rise2\" data-focus tabindex=\"-1\"><span class=\"sr-only\">Плюс " + pts + ". </span>" + esc(d.plus) + "</p>" +
      "<p class=\"dir-chip rise3\"><span class=\"dot\" style=\"background:" + d.color + "\">" + dirIcon(d, 16, 2.4) + "</span>" + esc(d.name) + "</p></div>" +
      (showHint ? "<div class=\"card tight hint rise3\">" + dirDot(d, 32) + "<p>" + esc(hintText) + "</p></div>" : "") +
      others + ask +
      "<div class=\"stack push\" style=\"gap:10px\">" +
      (auto ? "<div class=\"timer" + (reduced ? "" : " run") + "\" aria-hidden=\"true\"><div style=\"animation-duration:" + (AUTO_S - 0.4) + "s\"></div></div>" : "") +
      "<button class=\"btn btn-cta press\" data-act=\"next\">" + nextLabel() + ICON.arrow + "</button>" +
      (auto ? "<p class=\"note center\" style=\"font-size:12px\">Следующий вопрос откроется сам через " + AUTO_S + " " + plural(AUTO_S, "секунду", "секунды", "секунд") + "</p>" : "") +
      "</div></div>";
  }

  function viewCaseIntro(c) {
    return "<div class=\"screen\" tabindex=\"-1\">" + header() +
      "<div class=\"case-card in1\"><p class=\"eyebrow\">Командный кейс</p><h1 data-focus tabindex=\"-1\">" + esc(c.obj.title) + "</h1><p>" + esc(c.obj.intro) + "</p></div>" +
      "<div class=\"card in2\"><ol class=\"steps-list\">" + c.obj.steps.map(function (st, k) {
        return "<li><span class=\"n\">" + (k + 1) + "</span>" + esc(st.title) + "</li>";
      }).join("") + "</ol></div>" +
      "<p class=\"note in3\">В каждом шаге выбери, какую роль возьмёшь в команде. Здесь тоже нет правильных ответов.</p>" +
      "<button class=\"btn btn-cta press push\" data-act=\"next\">Начать кейс" + ICON.arrow + "</button></div>";
  }

  function viewCaseOutro(c) {
    var r = S.run;
    var mine = r.picks.filter(function (p) { return p.kind === "case" && p.ref === c.id; });
    return "<div class=\"screen\" tabindex=\"-1\">" + header() +
      "<div class=\"case-card in1\"><p class=\"eyebrow\">Чем всё закончилось</p><h1 data-focus tabindex=\"-1\">" + esc(c.obj.title) + "</h1><p>" + esc(c.obj.outro) + "</p></div>" +
      "<div class=\"card stack in2\"><p class=\"sec-title\">Твои роли в команде</p><ul class=\"numbered\">" + mine.map(function (p) {
        var d = DIR[p.dir];
        return "<li><span class=\"n\" style=\"background:" + d.color + "\">" + (p.step + 1) + "</span><span><b>" + esc(c.obj.steps[p.step].title) + ":</b> " + esc(d.name.toLowerCase()) + "</span></li>";
      }).join("") + "</ul><p style=\"font-size:15px;line-height:1.45\">" + esc(c.obj.team) + "</p></div>" +
      "<div class=\"ask in3\"><p class=\"eyebrow\">Новое слово</p><p>" + esc(c.obj.term.word) + " — <span style=\"font-weight:500\">" + esc(c.obj.term.def) + "</span></p></div>" +
      "<button class=\"btn btn-cta press push\" data-act=\"next\">" + nextLabel() + ICON.arrow + "</button></div>";
  }

  function viewPlay() {
    var c = cur(), r = S.run, html;
    if (c.type === "case") {
      html = r.phase === "intro" ? viewCaseIntro(c) : r.phase === "outro" ? viewCaseOutro(c) : r.phase === "react" ? viewReaction(c) : viewCaseStep(c);
    } else if (c.type === "quiz") {
      html = viewQuiz(c);
    } else if (r.phase === "react") {
      html = viewReaction(c);
    } else {
      html = c.type === "quick" ? viewQuick(c) : viewSituation(c);
    }
    if (S.paused) {
      html += "<div class=\"overlay\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"pause-title\"><div class=\"card\">" +
        "<p class=\"sec-title\" id=\"pause-title\" data-focus tabindex=\"-1\">Пауза</p>" +
        "<p class=\"note\">Прогресс сохранится, пока открыта эта вкладка.</p>" +
        "<button class=\"btn btn-cta press\" data-act=\"unpause\">Продолжить</button>" +
        "<button class=\"btn press\" data-act=\"exit\">Выйти на старт</button></div></div>";
    }
    return html;
  }

  // ---------- итог ----------

  function resultSections(res) {
    var m = MODE[res.modeId];
    var sc = E.score(P, res.picks);
    var top = DIR[sc.top];
    var second = sc.second ? DIR[sc.second] : null;
    var answered = res.picks.length;
    var out = {};

    var title = sc.double ? top.name + " и " + second.name : top.name;
    out.superpower =
      "<div class=\"result-hero\" style=\"background:" + top.color + "\">" +
      "<svg class=\"deco\" viewBox=\"0 0 342 300\" preserveAspectRatio=\"xMidYMin slice\" aria-hidden=\"true\"><circle cx=\"306\" cy=\"40\" r=\"56\" fill=\"none\" stroke=\"#141033\" stroke-opacity=\".12\" stroke-width=\"14\"></circle><circle cx=\"24\" cy=\"210\" r=\"34\" fill=\"none\" stroke=\"#141033\" stroke-opacity=\".12\" stroke-width=\"10\"></circle><path d=\"M50 52 Q51.8 64.2 64 66 Q51.8 67.8 50 80 Q48.2 67.8 36 66 Q48.2 64.2 50 52 Z\" fill=\"#141033\" fill-opacity=\".85\"></path><path d=\"M318 104 Q319 111 326 112 Q319 113 318 120 Q317 113 310 112 Q317 111 318 104 Z\" fill=\"#FFFFFF\"></path></svg>" +
      "<img class=\"me drop\" src=\"" + avatarSrc(res.av) + "\" alt=\"Твой персонаж\">" +
      "<span class=\"tag\">" + esc(ADJ[res.adj] + " " + NOUN[res.noun]) + "</span>" +
      "<p class=\"eyebrow\" style=\"position:relative;margin-top:6px;color:var(--ink)\">" + (sc.double ? "Двойная суперсила" : "Твоя профессия-суперсила") + "</p>" +
      "<h2 class=\"" + (title.length > 22 ? "long" : "") + "\" data-focus tabindex=\"-1\">" + esc(title) + "</h2>" +
      "<p class=\"you\">" + esc(top.you) + "</p>" +
      "<p class=\"share\">" + dirIcon(top, 16, 2.4) + (sc.double ? "Поровну по " + sc.percent[sc.top] + "% у двух направлений" : sc.percent[sc.top] + "% профиля — в этом направлении") + "</p></div>" +
      "<section class=\"card stack\"><p class=\"sec-title\">Чем можно заниматься</p><ol class=\"numbered\">" + top.tasks.map(function (t, k) {
        return "<li><span class=\"n\" style=\"background:" + top.color + "\">" + (k + 1) + "</span><span>" + esc(t) + "</span></li>";
      }).join("") + "</ol></section>";

    if (m.resultNote) {
      out.more = "<section class=\"card stack\" style=\"box-shadow:inset 0 0 0 2px var(--accent)\"><p class=\"sec-title\">Хочешь точнее?</p><p style=\"font-size:15px;line-height:1.45\">" + esc(m.resultNote) + "</p>" +
        "<button class=\"btn press\" data-act=\"try-std\">" + ICON.play + "Сыграть стандарт</button></section>";
    }

    if (second) {
      var combo = sc.combo;
      out.second = "<section class=\"card combo\"><p class=\"eyebrow\">" + (sc.double ? "Сочетание двух сил" : "Вторая сила: " + esc(second.tab.toLowerCase())) + "</p>" +
        "<div class=\"pair\">" + dirDot(top, 36) + "<span class=\"plus-sign\">+</span>" + dirDot(second, 36) + "</div>" +
        (combo ? "<h3>" + esc(combo.title) + "</h3><p style=\"font-size:15px;line-height:1.45\">" + esc(combo.text) + "</p>" : "") + "</section>";
    }

    var rows = P.directions.slice().sort(function (a, b) { return sc.percent[b.id] - sc.percent[a.id]; });
    var max = Math.max.apply(null, rows.map(function (d) { return sc.percent[d.id]; })) || 1;
    out.profile = "<section class=\"card stack\" style=\"gap:16px\" aria-labelledby=\"chart-title\"><div><p class=\"sec-title\" id=\"chart-title\">Твой профиль</p>" +
      "<p class=\"sec-sub\">Доля баллов за " + answered + " " + plural(answered, "выбор", "выбора", "выборов") + " по " + dirCount(true) + " направлениям</p></div><ul class=\"bars\">" +
      rows.map(function (d, k) {
        return "<li><div class=\"row\" style=\"gap:10px\">" + dirDot(d, 28) + "<span class=\"lbl\">" + esc(d.name) + "</span><span class=\"val\">" + sc.percent[d.id] + "%</span></div>" +
          "<div class=\"track\" aria-hidden=\"true\"><div class=\"fill bar\" style=\"width:" + Math.round(sc.percent[d.id] / max * 100) + "%;background:" + d.color + ";animation-delay:" + fx(0.15 + k * 0.08) + "s\"></div></div></li>";
      }).join("") + "</ul></section>";

    var badges = E.earnedBadges(P, res.modeId, { picks: res.picks, sc: sc, quizCorrect: res.quizCorrect, quizTotal: res.quizTotal, device: "phone" });
    if (badges.length) {
      out.badges = "<section class=\"card stack\"><p class=\"sec-title\">Достижения</p><ul class=\"badges\">" + badges.map(function (b) {
        return "<li><span class=\"medal\">" + ICON.medal + "</span><div><b>" + esc(b.title) + "</b><span>" + esc(b.text) + "</span></div></li>";
      }).join("") + "</ul></section>";
    }

    var caseItem = res.items.filter(function (it) { return it.type === "case"; })[0];
    if (caseItem) {
      var cs = CASE[caseItem.id];
      var roles = res.picks.filter(function (p) { return p.kind === "case"; });
      out.caseTeam = "<section class=\"card stack\"><p class=\"eyebrow\">Командный кейс</p><p class=\"sec-title\">" + esc(cs.title) + "</p><ul class=\"numbered\">" +
        roles.map(function (p) {
          var d = DIR[p.dir];
          return "<li><span class=\"n\" style=\"background:" + d.color + "\">" + (p.step + 1) + "</span><span><b>" + esc(cs.steps[p.step].title) + ":</b> " + esc(d.name.toLowerCase()) + "</span></li>";
        }).join("") + "</ul><p style=\"font-size:15px;line-height:1.45\">" + esc(cs.team) + "</p></section>";
    }

    out.ege = "<section class=\"card stack\"><div class=\"row\" style=\"gap:10px\"><span class=\"dir-tile\" style=\"width:36px;height:36px;border-radius:12px;background:var(--lime)\">" + ICON.cap + "</span>" +
      "<p class=\"sec-title\">Что сдавать для поступления</p></div>" +
      "<p style=\"font-size:14px;color:var(--muted)\">" + esc(top.code + " «" + top.tab + "» · " + top.level) + "</p>" +
      "<div class=\"subjects\">" + top.ege.required.map(function (s) { return "<span class=\"req\">" + esc(s) + "</span>"; }).join("") + "</div>" +
      "<p style=\"font-size:14px;font-weight:600\">и один предмет на выбор:</p>" +
      "<div class=\"subjects\">" + top.ege.oneOf.map(function (s) { return "<span class=\"opt-s\">" + esc(s) + "</span>"; }).join("") + "</div>" +
      "<p class=\"note\">" + esc(P.egeNote.text) + "</p></section>";

    var terms = [];
    res.items.forEach(function (it) {
      if (it.type === "situation") terms.push(SIT[it.id].term);
      if (it.type === "case") terms.push(CASE[it.id].term);
    });
    var termLi = function (t) { return "<li><b>" + esc(t.word) + "</b> — " + esc(t.def) + "</li>"; };
    out.terms = "<section class=\"card stack\"><div class=\"row\" style=\"gap:10px\"><span class=\"dir-tile\" style=\"width:36px;height:36px;border-radius:12px;background:var(--plate)\">" + ICON.book + "</span>" +
      "<div><p class=\"sec-title\">Словарик игры</p><p class=\"sec-sub\" style=\"margin:0\">" + terms.length + " " + plural(terms.length, "слово", "слова", "слов") + ", которыми пользуются специалисты</p></div></div>" +
      "<ul class=\"terms\">" + terms.slice(0, 3).map(termLi).join("") + "</ul>" +
      (terms.length > 3 ? "<details class=\"others\" style=\"box-shadow:none;background:var(--hover)\"><summary>Ещё " + (terms.length - 3) + ICON.chevron + "</summary><ul class=\"terms\">" + terms.slice(3).map(termLi).join("") + "</ul></details>" : "") +
      "</section>";

    var rank = E.quizRank(P, res.quizCorrect, res.quizTotal);
    if (rank) {
      out.quiz = "<section class=\"card rank\"><span class=\"score\">" + res.quizCorrect + "/" + res.quizTotal + "</span><div class=\"stack\" style=\"gap:4px\">" +
        "<p class=\"eyebrow\">Проверь себя</p><p class=\"sec-title\">" + esc(rank.title) + "</p><p style=\"font-size:14px;line-height:1.4\">" + esc(rank.text) + "</p></div></section>";
    }

    out.fact = "<section class=\"card fact stack\"><div class=\"row\" style=\"gap:10px\"><span class=\"dir-tile\" style=\"width:36px;height:36px;border-radius:12px;background:" + top.color + "\">" + ICON.bulb + "</span>" +
      "<p class=\"sec-title\">Знаешь ли ты?</p></div><p style=\"font-size:15px;line-height:1.5\">" + esc(top.facts[res.factIdx % top.facts.length]) + "</p></section>";

    out.tryNow = "<section class=\"card try stack\"><div class=\"row\" style=\"gap:10px\"><span class=\"dir-tile\" style=\"width:36px;height:36px;border-radius:12px;background:var(--lime)\">" + ICON.target + "</span>" +
      "<p class=\"sec-title\">Попробуй уже сегодня</p></div><p style=\"font-size:15px;line-height:1.5\">" + esc(top.tryNow[res.tryIdx % top.tryNow.length]) + "</p></section>";

    out.catalog = "";
    return { html: out, sc: sc };
  }

  // «пять направлений», «по пяти направлениям»: число направлений берётся из банка.
  function dirCount(gen) {
    var n = P.directions.length, w = { 4: ["четыре", "четырём"], 5: ["пять", "пяти"], 6: ["шесть", "шести"], 7: ["семь", "семи"], 8: ["восемь", "восьми"] }[n];
    return w ? w[gen ? 1 : 0] : String(n);
  }

  function plural(n, one, few, many) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  }

  function viewResult() {
    var res = S.result;
    var m = MODE[res.modeId];
    var built = resultSections(res);
    var total = res.picks.length + res.quizTotal;
    var body = m.result.map(function (k) { return built.html[k] || ""; }).join("");
    return "<div class=\"screen\" tabindex=\"-1\" style=\"gap:20px\">" +
      "<div class=\"row\" style=\"justify-content:space-between\"><button class=\"icon-btn press\" data-act=\"home\" aria-label=\"На старт\">" + ICON.home + "</button>" +
      "<p class=\"title\">Итог игры</p><p class=\"pill\" style=\"font-size:13px;padding:9px 12px\"><b>" + total + "</b> из " + total + "</p></div>" +
      body +
      "<div class=\"stack\"><button class=\"btn btn-cta press\" data-act=\"again\">" + ICON.retry + "Сыграть ещё</button>" +
      "<button class=\"btn press\" data-act=\"catalog\">" + ICON.grid + "Все профессии</button></div>" +
      "<p class=\"note center\">Это подсказка, а не приговор. Сыграй ещё раз, выбери по-другому — и сравни суперсилы с друзьями.</p>" +
      "</div>";
  }

  // ---------- все профессии ----------

  function viewCatalog() {
    var topId = S.result ? E.score(P, S.result.picks).top : null;
    var n = P.directions.length;
    return "<div class=\"screen\" tabindex=\"-1\" style=\"gap:18px\">" +
      "<div class=\"row\"><button class=\"icon-btn press\" data-act=\"back\" aria-label=\"Назад\">" + ICON.back + "</button>" +
      "<p style=\"font-size:13px;font-weight:600;color:var(--muted)\">" + (S.back === "result" ? "Назад к итогу" : "На старт") + "</p></div>" +
      "<div><h1 class=\"display\" style=\"font-size:30px;line-height:1.1\" data-focus tabindex=\"-1\">Все профессии</h1>" +
      "<p class=\"lead\" style=\"margin-top:8px;font-size:15px;line-height:1.45\">" + cap(dirCount()) + " " + plural(n, "направление", "направления", "направлений") + " СЭИ. Выбирай любое — суперсилы можно совмещать.</p></div>" +
      "<nav class=\"chips\" aria-label=\"Направления\">" + P.directions.map(function (d) {
        return "<a href=\"#p-" + d.id + "\" data-act=\"jump\" data-id=\"" + d.id + "\"><span style=\"background:" + d.color + "\">" + dirIcon(d, 15, 2.6) + "</span>" + esc(d.tab) + "</a>";
      }).join("") + "</nav>" +
      P.directions.map(function (d, k) {
        return "<article class=\"prof\" id=\"p-" + d.id + "\" style=\"background:" + d.color + "\">" +
          (d.id === topId ? "<span class=\"tag mine\">Твоя суперсила</span>" : "") +
          "<div class=\"head\"><span class=\"ico\" style=\"color:" + d.color + "\">" + dirIcon(d, 28, 2.2) + "</span><span class=\"num\">" + pad2(k + 1) + " / " + pad2(n) + "</span></div>" +
          "<h2>" + esc(d.name) + "</h2>" +
          "<p class=\"code\">" + esc(d.code + " " + d.tab + " · " + d.level) + "<br>" + plural(d.profiles.length, "Профиль", "Профили", "Профили") + ": " + esc(d.profiles.join("; ")) + "</p>" +
          "<p class=\"about\">" + esc(d.about) + "</p>" +
          "<p class=\"lbl\">Примеры задач</p><ul class=\"tasks\">" + d.tasks.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
          "<p class=\"lbl\">Где работают</p><div class=\"where\">" + d.where.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" +
          "<p class=\"lbl\">Кем можно стать</p><ul class=\"tasks\">" + d.roles.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
          "<div class=\"inner\"><p class=\"eyebrow\">ЕГЭ для поступления</p><div class=\"subjects\">" +
          d.ege.required.map(function (s) { return "<span class=\"req\">" + esc(s) + "</span>"; }).join("") + "</div>" +
          "<p style=\"font-size:13px;font-weight:600\">+ один на выбор: " + esc(orList(d.ege.oneOf).toLowerCase()) + "</p></div>" +
          "</article>";
      }).join("") +
      "<p class=\"note\">" + esc(P.egeNote.text) + "</p>" +
      "<button class=\"btn press\" data-act=\"back\">" + ICON.back + (S.back === "result" ? "Назад к итогу" : "На старт") + "</button>" +
      "</div>";
  }

  // ---------- отрисовка ----------

  function render(scrollTop) {
    clearTimeout(autoTimer);
    var html;
    if (S.screen === "start") html = viewStart();
    else if (S.screen === "character") html = viewCharacter();
    else if (S.screen === "play") html = viewPlay();
    else if (S.screen === "result") html = viewResult();
    else html = viewCatalog();
    app.innerHTML = html;
    if (scrollTop) window.scrollTo(0, 0);
    var f = app.querySelector(S.paused ? ".overlay [data-focus]" : "[data-focus]") || app.querySelector(".screen");
    if (f) try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }

    // В блице реакция на выбор сама переходит дальше.
    if (S.screen === "play" && !S.paused && S.run.phase === "react" && app.querySelector(".timer")) {
      autoTimer = setTimeout(next, AUTO_S * 1000);
    }
  }

  // Слот-машина: во время прокрутки меняем только картинки и ник, не весь экран.
  function spin() {
    if (S.spinning) return;
    var finalAv = rnd(24);
    if (finalAv === S.av) finalAv = (finalAv + 7) % 24;
    var finalAdj = rnd(ADJ.length), finalNoun = rnd(NOUN.length);
    if (reduced) { S.av = finalAv; S.adj = finalAdj; S.noun = finalNoun; render(false); return; }
    S.spinning = true;
    render(false);
    var ticks = 0;
    clearInterval(spinTimer);
    spinTimer = setInterval(function () {
      ticks += 1;
      if (ticks < 16) {
        S.av = (S.av + 1) % 24; S.adj = (S.adj + 1) % ADJ.length; S.noun = (S.noun + 1) % NOUN.length;
        var prev = document.getElementById("av-prev"), curI = document.getElementById("av-cur"), nxt = document.getElementById("av-next"), nk = document.getElementById("nick");
        if (!curI) { clearInterval(spinTimer); S.spinning = false; return; }
        prev.src = avatarSrc(S.av - 1); curI.src = avatarSrc(S.av); nxt.src = avatarSrc(S.av + 1);
        nk.innerHTML = "<span>" + esc(ADJ[S.adj]) + "</span><br>" + esc(NOUN[S.noun]);
      } else {
        clearInterval(spinTimer);
        S.av = finalAv; S.adj = finalAdj; S.noun = finalNoun;
        S.spinning = false;
        if (S.screen === "character") render(false);
      }
    }, 70);
  }

  // ---------- события ----------

  app.addEventListener("click", function (e) {
    if (P.route !== "personal") return;
    var t = e.target.closest("[data-act]");
    if (!t || t.disabled) return;
    var act = t.getAttribute("data-act");
    switch (act) {
      case "projector": location.hash = "projector"; break;
      case "mode": S.modeId = t.getAttribute("data-id"); render(false); break;
      case "play": drop(SS, "profsila.run"); S.saved = null; go("character"); spin(); break;
      case "resume":
        S.modeId = S.saved.modeId; S.av = S.saved.av; S.adj = S.saved.adj; S.noun = S.saved.noun;
        S.run = S.saved.run; S.saved = null; guardHistory(); go("play"); break;
      case "reroll": spin(); break;
      case "go": startRun(); break;
      case "home":
        clearInterval(spinTimer); S.spinning = false;
        if (S.run) { S.saved = load(SS, "profsila.run", null); S.run = null; }
        go("start"); break;
      case "pick": pick(+t.getAttribute("data-pos")); break;
      case "next": next(); break;
      case "pause": S.paused = true; render(false); break;
      case "unpause": S.paused = false; render(false); break;
      case "exit": S.saved = load(SS, "profsila.run", null); S.run = null; go("start"); break;
      case "again": go("start"); break;
      case "try-std": S.modeId = "std"; go("character"); spin(); break;
      case "catalog": S.back = S.screen; go("catalog"); break;
      case "back": go(S.back || "start"); break;
      case "jump": {
        e.preventDefault();
        var el = document.getElementById("p-" + t.getAttribute("data-id"));
        if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        break;
      }
    }
  });

  // Клавиатура и пульт-кликер: 1–4 выбирают вариант, Esc — пауза.
  document.addEventListener("keydown", function (e) {
    if (P.route !== "personal" || S.screen !== "play" || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "Escape") { S.paused = !S.paused; render(false); return; }
    if (S.paused) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && S.run.phase === "ask") {
      var btn = app.querySelector(".opt[data-pos=\"" + (n - 1) + "\"]");
      if (btn) { e.preventDefault(); btn.click(); }
    }
  });

  // Общие помощники для общего режима (js/projector.js).
  P.ui = {
    esc: esc, svg: svg, dirIcon: dirIcon, dirDot: dirDot, banner: banner, ICON: ICON, KEYS: KEYS,
    load: load, save: save, drop: drop, LS: LS, SS: SS, rnd: rnd, fx: fx, plural: plural, orList: orList,
    seenList: seenList, reduced: reduced,
    DIR: DIR, BLOCK: BLOCK, SIT: SIT, QUICK: QUICK, CASE: CASE, QUIZ: QUIZ, MODE: MODE
  };

  // Запуск — из js/main.js, который выбирает режим по адресу страницы.
  P.personal = {
    mount: function () {
      P.route = "personal";
      document.body.classList.remove("pj-mode");
      render(true);
    },
    unmount: function () {
      clearTimeout(autoTimer);
      clearInterval(spinTimer);
      S.spinning = false;
    }
  };
})();
