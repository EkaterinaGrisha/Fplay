// ПРОФСИЛА · движок: собирает партию из банка заданий и считает итог.
// Работает в браузере (PROFSILA.engine) и в Node (module.exports) — на нём же
// гоняются автопроверки банка в tools/bank.js.

(function (root) {
  "use strict";

  // Генератор случайных чисел с зерном: одинаковое зерно даёт одинаковую партию.
  function makeRng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, rng) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function sample(list, k, rng) {
    return shuffle(list, rng).slice(0, k);
  }

  // Берёт k элементов, сначала из ещё не сыгранных на этом устройстве.
  function sampleFresh(list, k, rng, seen) {
    var fresh = list.filter(function (x) { return !seen[x.id]; });
    if (fresh.length >= k) return sample(fresh, k, rng);
    var old = list.filter(function (x) { return seen[x.id]; });
    return shuffle(fresh, rng).concat(sample(old, k - fresh.length, rng));
  }

  function findMode(bank, modeId) {
    for (var i = 0; i < bank.modes.length; i++) {
      if (bank.modes[i].id === modeId) return bank.modes[i];
    }
    throw new Error("Нет режима " + modeId);
  }

  function dirIds(bank) {
    return bank.directions.map(function (d) { return d.id; });
  }

  // Вопросы «Проверь себя» из разных направлений.
  function pickQuiz(bank, count, rng, seen) {
    var byDir = {};
    bank.quiz.forEach(function (q) { (byDir[q.dir] = byDir[q.dir] || []).push(q); });
    var dirs = shuffle(Object.keys(byDir), rng);
    var out = [];
    for (var i = 0; i < count; i++) {
      var pool = byDir[dirs[i % dirs.length]];
      var taken = out.map(function (q) { return q.id; });
      var left = pool.filter(function (q) { return taken.indexOf(q.id) < 0; });
      out.push(sampleFresh(left, 1, rng, seen)[0]);
    }
    return out;
  }

  function drawOnce(bank, mode, rng, seen) {
    var appear = {};
    dirIds(bank).forEach(function (d) { appear[d] = 0; });

    var blocks = shuffle(bank.blocks, rng).map(function (block) {
      var items = sampleFresh(block.situations, mode.perBlock, rng, seen);
      items.forEach(function (s) { s.options.forEach(function (o) { appear[o.dir]++; }); });
      return { block: block, items: items };
    });

    var quick = sample(bank.quick.items, mode.quick || 0, rng);
    quick.forEach(function (q) { appear[q.a.dir]++; appear[q.b.dir]++; });

    var cases = sampleFresh(bank.cases, mode.cases || 0, rng, seen);
    cases.forEach(function (c) {
      c.steps.forEach(function (st) { st.options.forEach(function (o) { appear[o.dir]++; }); });
    });

    var quiz = pickQuiz(bank, mode.quiz || 0, rng, seen);

    // Последовательность экранов.
    var screens = [];
    if (mode.layout === "alternate") {
      var all = [];
      blocks.forEach(function (b) { b.items.forEach(function (s) { all.push({ type: "situation", block: b.block.id, item: s }); }); });
      all.forEach(function (scr, i) {
        screens.push(scr);
        if (quick[i]) screens.push({ type: "quick", item: quick[i] });
      });
      quiz.forEach(function (q) { screens.push({ type: "quiz", item: q }); });
    } else {
      var quizAfter = mode.quizAfterBlocks || [];
      var qi = 0;
      blocks.forEach(function (b, i) {
        b.items.forEach(function (s) { screens.push({ type: "situation", block: b.block.id, item: s }); });
        if (mode.caseAfterBlock === i + 1) cases.forEach(function (c) { screens.push({ type: "case", item: c }); });
        if (quizAfter.indexOf(i + 1) >= 0 && quiz[qi]) screens.push({ type: "quiz", item: quiz[qi++] });
      });
    }

    var min = Infinity;
    Object.keys(appear).forEach(function (d) { if (appear[d] < min) min = appear[d]; });
    return { mode: mode.id, screens: screens, appear: appear, minAppear: min };
  }

  // Собирает партию. opts: { seed, rng, seen: ["m1", ...], maxTries }.
  function drawGame(bank, modeId, opts) {
    opts = opts || {};
    var mode = findMode(bank, modeId);
    var rng = opts.rng || makeRng(opts.seed != null ? opts.seed : Date.now());
    var seen = {};
    (opts.seen || []).forEach(function (id) { seen[id] = true; });
    var maxTries = opts.maxTries || 200;
    var best = null;
    for (var t = 1; t <= maxTries; t++) {
      var game = drawOnce(bank, mode, rng, seen);
      game.tries = t;
      if (game.minAppear >= mode.minPerDir) return game;
      if (!best || game.minAppear > best.minAppear) best = game;
    }
    return best;
  }

  // Порядок вариантов на телефоне перемешивается, на проекторе — нет.
  function shuffledOptions(options, rng) {
    return shuffle(options, rng || Math.random);
  }

  // picks — ответы игрока по порядку:
  //   { kind: "situation" | "case" | "quick", dir: "fin", offered: ["fin", "mark", ...], block: "money" }
  // В общем режиме с подсчётом рук у ответа есть votes: { fin: 9, mark: 4, ... } —
  // тогда баллы делятся между направлениями пропорционально голосам.
  function score(bank, picks) {
    var pts = {
      situation: bank.scoring.situationPoints,
      "case": bank.scoring.casePoints,
      quick: bank.scoring.quickPoints
    };
    var dirs = dirIds(bank);
    var got = {}, possible = {}, chosen = {}, last = {};
    dirs.forEach(function (d) { got[d] = 0; possible[d] = 0; chosen[d] = 0; last[d] = -1; });

    picks.forEach(function (p, i) {
      var w = pts[p.kind];
      p.offered.forEach(function (d) { possible[d] += w; });
      var hands = 0;
      if (p.votes) p.offered.forEach(function (d) { hands += p.votes[d] || 0; });
      if (hands > 0) p.offered.forEach(function (d) { got[d] += w * (p.votes[d] || 0) / hands; });
      else got[p.dir] += w;
      chosen[p.dir] += 1;
      last[p.dir] = i;
    });

    var share = {};
    dirs.forEach(function (d) { share[d] = possible[d] ? got[d] / possible[d] : 0; });

    var ranking = dirs.slice().sort(function (a, b) {
      return (share[b] - share[a]) || (got[b] - got[a]) || (last[b] - last[a]);
    });

    // Проценты профиля: доли нормируются к 100, остаток раздаётся по наибольшим дробям.
    var total = dirs.reduce(function (s, d) { return s + share[d]; }, 0) || 1;
    var raw = dirs.map(function (d) { return { d: d, v: share[d] / total * 100 }; });
    var percent = {};
    var used = 0;
    raw.forEach(function (r) { percent[r.d] = Math.floor(r.v); used += percent[r.d]; });
    raw.sort(function (a, b) { return (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)); });
    for (var k = 0; k < 100 - used; k++) percent[raw[k % raw.length].d] += 1;

    var top = ranking[0];
    var tied = ranking.filter(function (d) { return Math.abs(share[d] - share[top]) < 1e-9; });
    var second = share[ranking[1]] > 0 ? ranking[1] : null;

    return {
      got: got, possible: possible, chosen: chosen, share: share, percent: percent,
      ranking: ranking, top: top, second: second, tied: tied,
      double: tied.length === 2,
      combo: second ? findCombo(bank, top, second) : null
    };
  }

  function findCombo(bank, a, b) {
    for (var i = 0; i < bank.combos.length; i++) {
      var c = bank.combos[i].dirs;
      if ((c[0] === a && c[1] === b) || (c[0] === b && c[1] === a)) return bank.combos[i];
    }
    return null;
  }

  // state: { picks, sc (результат score), quizCorrect, quizTotal }
  function earnedBadges(bank, modeId, state) {
    var sc = state.sc;
    var totalPicks = state.picks.length;
    return bank.badges.filter(function (b) {
      if (b.modes.indexOf(modeId) < 0) return false;
      var r = b.rule;
      switch (r.type) {
        case "allDirs":
          return Object.keys(sc.chosen).every(function (d) { return sc.chosen[d] > 0; });
        case "focus":
          return totalPicks > 0 && sc.chosen[sc.top] / totalPicks >= r.share;
        case "spread":
          return Object.keys(sc.percent).every(function (d) { return sc.percent[d] <= r.maxShare * 100; });
        case "quizPerfect":
          return state.quizTotal >= r.minQuestions && state.quizCorrect === state.quizTotal;
        case "blockDir":
          return state.picks.filter(function (p) { return p.block === r.block && p.dir === r.dir; }).length >= r.min;
        case "caseRoles":
          var seen = {};
          state.picks.forEach(function (p) { if (p.kind === "case") seen[p.dir] = true; });
          return Object.keys(seen).length >= r.min;
        default:
          return false;
      }
    });
  }

  function quizRank(bank, correct, total) {
    if (!total) return null;
    var part = correct / total;
    var rank = bank.quizRanks[0];
    bank.quizRanks.forEach(function (r) { if (part >= r.from) rank = r; });
    return rank;
  }

  // Термины для «Словарика игры»: из сыгранных ситуаций и кейса.
  function termsOf(game) {
    var out = [];
    game.screens.forEach(function (s) {
      if ((s.type === "situation" || s.type === "case") && s.item.term) out.push(s.item.term);
    });
    return out;
  }

  var api = {
    makeRng: makeRng,
    shuffle: shuffle,
    drawGame: drawGame,
    shuffledOptions: shuffledOptions,
    score: score,
    findCombo: findCombo,
    earnedBadges: earnedBadges,
    quizRank: quizRank,
    termsOf: termsOf
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) {
    root.PROFSILA = root.PROFSILA || {};
    root.PROFSILA.engine = api;
  }
})(typeof window !== "undefined" ? window : null);
