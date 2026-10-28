// ПРОФСИЛА · общий режим для проектора (design/Projector.dc.html, design/ProjectorResult.dc.html).
// Весь класс играет вместе: ведущий читает ситуацию, класс голосует поднятой рукой,
// ведущий отмечает вариант. Сцена рисуется в 1920×1080 и масштабируется под экран.
// Управление: 1–4 — вариант, ←/→ и PageUp/PageDown — назад/дальше (пульт-кликер),
// Backspace — отменить выбор, T — заново запустить таймер, F — во весь экран.

(function () {
  "use strict";

  var P = window.PROFSILA;
  var E = P.engine;
  var U = P.ui;
  var app = document.getElementById("app");
  var esc = U.esc, ICON = U.ICON, LETTERS = U.KEYS;
  var DIR = U.DIR, SIT = U.SIT, QUICK = U.QUICK, CASE = U.CASE, QUIZ = U.QUIZ, MODE = U.MODE;
  var TIMER = (P.classroom && P.classroom.timerSeconds) || 20;

  var MODE_LABEL = {
    blitz: { title: "Разминка", sub: "6 ситуаций и 4 быстрых выбора, без разборов" },
    std: { title: "Урок", sub: "12 ситуаций, 3 вопроса и подсказки о профессиях" },
    deep: { title: "Большой урок", sub: "12 ситуаций с разбором, командный кейс и 6 вопросов" }
  };

  var J = {
    active: false,
    screen: "setup",
    modeId: "std",
    voting: "quick",
    run: null,
    result: null,
    back: "setup",
    dialog: false,
    saved: null
  };
  var timerId = null, timeLeft = TIMER;

  function sized(icon, size) { return icon.replace(/width="\d+" height="\d+"/, 'width="' + size + '" height="' + size + '"'); }

  // ---------- сцена 1920×1080 ----------

  function fit() {
    var st = app.querySelector(".pj-stage");
    if (!st) return;
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    st.style.transform = "scale(" + s + ")";
  }
  window.addEventListener("resize", function () { if (J.active) fit(); });

  function toggleFullscreen() {
    var d = document;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen).call(d.documentElement);
    } catch (e) { /* браузер не разрешил полный экран */ }
  }

  // ---------- партия класса ----------

  function buildFlow(game) {
    var flow = [];
    game.screens.forEach(function (s) {
      if (s.type === "case") {
        flow.push({ t: "caseIntro", id: s.item.id });
        s.item.steps.forEach(function (_, k) { flow.push({ t: "caseStep", id: s.item.id, step: k }); });
        flow.push({ t: "caseOutro", id: s.item.id });
      } else {
        flow.push({ t: s.type, id: s.item.id, block: s.block || null });
      }
    });
    return flow;
  }

  function isQuestion(f) { return f.t === "situation" || f.t === "quick" || f.t === "caseStep" || f.t === "quiz"; }
  function counts(f) { return isQuestion(f) && f.t !== "quiz"; }

  function optionsOf(f) {
    if (f.t === "situation") return SIT[f.id].options;
    if (f.t === "quick") return [QUICK[f.id].a, QUICK[f.id].b];
    if (f.t === "caseStep") return CASE[f.id].steps[f.step].options;
    if (f.t === "quiz") return QUIZ[f.id].options.map(function (t) { return { text: t }; });
    return [];
  }

  function cur() { return J.run.flow[J.run.pos]; }
  function answer() { return J.run.answers[J.run.pos]; }
  function hands() {
    var r = J.run, f = cur();
    if (!r.hands[r.pos]) r.hands[r.pos] = optionsOf(f).map(function () { return 0; });
    return r.hands[r.pos];
  }
  function exact(f) { return J.voting === "exact" && f.t !== "quiz"; }

  function persist() {
    if (J.run) U.save(U.SS, "profsila.proj", { modeId: J.modeId, voting: J.voting, run: J.run });
  }

  function startRun() {
    var game = E.drawGame(P, J.modeId, { seed: U.rnd(2147483647), seen: U.seenList() });
    J.run = { flow: buildFlow(game), pos: 0, phase: "ask", answers: {}, hands: {} };
    J.saved = null;
    J.screen = "play";
    persist();
    enter();
  }

  // Показать текущий экран партии и запустить таймер, если это вопрос.
  function enter() {
    stopTimer();
    render();
    if (J.screen === "play" && J.run.phase === "ask" && isQuestion(cur())) startTimer();
  }

  function advance() {
    var r = J.run;
    r.pos += 1;
    if (r.pos >= r.flow.length) { finish(); return; }
    r.phase = r.answers[r.pos] ? "react" : "ask";
    persist();
    enter();
  }

  function forward() {
    var r = J.run, f = cur(), m = MODE[J.modeId];
    if (!isQuestion(f)) { advance(); return; }
    if (r.phase === "ask") {
      if (exact(f) && total(hands()) > 0) { finalize(); return; }
      if (f.t === "quiz") { r.answers[r.pos] = { k: null }; r.phase = "react"; persist(); enter(); return; }
      flash();
      return;
    }
    if (r.phase === "react" && f.t === "situation" && m.discussion) { r.phase = "discuss"; persist(); enter(); return; }
    advance();
  }

  function backward() {
    var r = J.run;
    if (r.phase === "discuss") { r.phase = "react"; persist(); enter(); return; }
    if (r.phase === "react") { cancel(); return; }
    if (r.pos === 0) return;
    r.pos -= 1;
    r.phase = r.answers[r.pos] ? "react" : "ask";
    persist();
    enter();
  }

  function cancel() {
    var r = J.run;
    if (r.phase !== "react") return;
    delete r.answers[r.pos];
    r.phase = "ask";
    persist();
    enter();
  }

  function skip() {
    var r = J.run;
    delete r.answers[r.pos];
    advance();
  }

  function total(list) { return list.reduce(function (s, n) { return s + n; }, 0); }

  function choose(k, remove) {
    var r = J.run, f = cur();
    if (!isQuestion(f)) return;
    var opts = optionsOf(f);
    if (k < 0 || k >= opts.length) return;
    if (f.t === "quiz") {
      if (r.phase !== "ask") return;
      r.answers[r.pos] = { k: k };
      r.phase = "react";
      persist(); enter();
      return;
    }
    if (exact(f)) {
      if (r.phase !== "ask") return;
      var h = hands();
      h[k] = Math.max(0, h[k] + (remove ? -1 : 1));
      persist();
      render();
      return;
    }
    if (r.phase === "react" && answer() && answer().k === k) { cancel(); return; }
    if (r.phase !== "ask") return;
    r.answers[r.pos] = { k: k, dir: opts[k].dir };
    r.phase = "react";
    persist(); enter();
  }

  // Точный подсчёт: побеждает вариант, за который больше рук; профиль учитывает все голоса.
  function finalize() {
    var r = J.run, f = cur(), h = hands(), opts = optionsOf(f), best = 0;
    h.forEach(function (n, k) { if (n > h[best]) best = k; });
    var votes = {};
    opts.forEach(function (o, k) { votes[o.dir] = (votes[o.dir] || 0) + h[k]; });
    r.answers[r.pos] = { k: best, dir: opts[best].dir, votes: votes, hands: h.slice() };
    r.phase = "react";
    persist(); enter();
  }

  function answeredCount() {
    var r = J.run;
    return r.flow.filter(function (f, i) { return counts(f) && r.answers[i]; }).length;
  }

  function finish() {
    stopTimer();
    var r = J.run, picks = [], quizCorrect = 0, quizTotal = 0;
    r.flow.forEach(function (f, i) {
      var a = r.answers[i];
      if (!a) return;
      if (f.t === "quiz") {
        if (a.k == null) return;
        quizTotal += 1;
        if (a.k === QUIZ[f.id].correct) quizCorrect += 1;
        return;
      }
      if (!counts(f)) return;
      picks.push({
        kind: f.t === "caseStep" ? "case" : f.t,
        dir: a.dir,
        offered: optionsOf(f).map(function (o) { return o.dir; }),
        block: f.block,
        votes: a.votes || null,
        ref: f.id,
        step: f.t === "caseStep" ? f.step : null
      });
    });
    var played = {};
    r.flow.forEach(function (f) { if (f.t !== "quick") played[f.id] = true; });
    U.save(U.LS, "profsila.seen", U.seenList().concat(Object.keys(played)).slice(-80));
    U.drop(U.SS, "profsila.proj");
    var sc = E.score(P, picks);
    J.result = {
      modeId: J.modeId, voting: J.voting, picks: picks, quizCorrect: quizCorrect, quizTotal: quizTotal,
      factIdx: U.rnd(DIR[sc.top].facts.length)
    };
    J.run = null;
    J.dialog = false;
    J.screen = "result";
    enter();
  }

  // ---------- таймер голосования ----------

  function startTimer() {
    stopTimer();
    timeLeft = TIMER;
    paintTimer();
    timerId = setInterval(function () {
      timeLeft -= 1;
      paintTimer();
      if (timeLeft <= 0) stopTimer();
    }, 1000);
  }
  function stopTimer() { clearInterval(timerId); timerId = null; }
  function paintTimer() {
    var el = document.getElementById("pj-timer");
    if (!el) return;
    var t = Math.max(0, timeLeft);
    el.querySelector("span").textContent = t > 0 ? "0:" + (t < 10 ? "0" : "") + t : "Время!";
    el.classList.toggle("late", t <= 0);
  }

  function flash() {
    var el = app.querySelector(".pj-wait");
    if (!el) return;
    el.classList.remove("nudge");
    void el.offsetWidth;
    el.classList.add("nudge");
  }

  // ---------- разметка ----------

  function logoWord(size, stacked) {
    return "<p class=\"pj-logo\" style=\"font-size:" + size + "px\">ПРОФ" + (stacked ? "<br>" : "") + "<span>СИЛА</span></p>";
  }

  function topBar(center, buttons) {
    return "<header class=\"pj-top\"><div class=\"row\" style=\"gap:16px\">" + logoWord(32) + "<span class=\"pj-badge\">Общий режим</span></div>" +
      "<div class=\"row\" style=\"gap:20px\">" + (center || "") + "</div>" +
      "<div class=\"row\" style=\"gap:12px\">" + (buttons || "") +
      "<button class=\"pj-icon press\" data-pj=\"full\" aria-label=\"Во весь экран (F)\" title=\"Во весь экран (F)\">" + ICON.full + "</button></div></header>";
  }

  function progress() {
    var r = J.run, qs = r.flow.filter(isQuestion), before = 0;
    for (var i = 0; i < r.pos; i++) if (isQuestion(r.flow[i])) before += 1;
    var f = cur(), now = isQuestion(f) ? before + 1 : before;
    var segs = qs.map(function (_, k) {
      var done = k < before || (k === before && isQuestion(f) && r.phase !== "ask");
      return "<span class=\"" + (done ? "done" : k === before && isQuestion(f) ? "now" : "") + "\"></span>";
    }).join("");
    return "<p class=\"pj-count\">Вопрос " + Math.max(now, 1) + " из " + qs.length + "</p>" +
      "<div class=\"pj-segs\" aria-hidden=\"true\" style=\"grid-template-columns:repeat(" + qs.length + ",minmax(0,1fr))\">" + segs + "</div>";
  }

  function playButtons() {
    return "<button class=\"pj-icon press\" data-pj=\"back\" aria-label=\"Назад (←)\" title=\"Назад (←)\">" + sized(ICON.back, 24) + "</button>" +
      "<button class=\"pj-icon press\" data-pj=\"skip\" aria-label=\"Пропустить\" title=\"Пропустить\">" + ICON.skip + "</button>" +
      "<button class=\"pj-icon press\" data-pj=\"menu\" aria-label=\"Закончить игру\" title=\"Закончить игру\">" + ICON.close + "</button>";
  }

  function tiles(f, cls) {
    var opts = optionsOf(f), a = answer(), isQuiz = f.t === "quiz", ex = exact(f);
    var h = ex ? (a && a.hands ? a.hands : hands()) : null, sum = h ? total(h) : 0;
    return "<div class=\"pj-tiles " + (cls || "") + "\">" + opts.map(function (o, k) {
      var state = "";
      if (isQuiz && a) {
        if (k === QUIZ[f.id].correct) state = " is-right";
        else if (k === a.k) state = " is-wrong";
        else state = " is-dim";
      } else if (a) {
        state = a.k === k ? " is-on" : " is-dim";
      }
      var mark = LETTERS[k];
      if (isQuiz && a && k === QUIZ[f.id].correct) mark = sized(ICON.check, 44);
      else if (isQuiz && a && k === a.k) mark = sized(ICON.cross, 44);
      var share = sum ? Math.round(h[k] / sum * 100) : 0;
      return "<button class=\"pj-tile press" + state + "\" data-pj=\"pick\" data-k=\"" + k + "\"" + (isQuiz && a ? " disabled" : "") + ">" +
        (ex && sum ? "<span class=\"pj-fill\" style=\"width:" + share + "%\" aria-hidden=\"true\"></span>" : "") +
        "<span class=\"pj-letter\">" + mark + "</span><span class=\"pj-text\">" + esc(o.text) + "</span>" +
        (ex ? "<span class=\"pj-hands\">" + sized(ICON.hand, 26) + "<b>" + h[k] + "</b>" +
          (a ? "<small>" + share + "%</small>" : "<span class=\"pj-minus\" data-pj=\"minus\" data-k=\"" + k + "\" role=\"button\" aria-label=\"Убрать руку\">" + ICON.minus + "</span>") + "</span>" : "") +
        "</button>";
    }).join("") + "</div>";
  }

  function waitBar(f) {
    var ex = exact(f), sum = ex ? total(hands()) : 0;
    var title = f.t === "quiz" ? "Кто знает ответ? Руки вверх!" : "Голосуйте поднятой рукой!";
    var sub = ex ? "Считаем руки: нажимайте 1–" + optionsOf(f).length + " или на вариант. Всего рук: " + sum :
      f.t === "quiz" ? "Отметьте вариант, за который больше рук, или нажмите → чтобы показать ответ" :
        "Ведущий нажимает вариант, за который подняли больше рук";
    return "<div class=\"pj-wait\"><div class=\"row\" style=\"gap:20px\"><span class=\"pj-wave\">" + ICON.hand + "</span>" +
      "<div><p class=\"pj-wait-title\">" + title + "</p><p class=\"pj-wait-sub\">" + sub + "</p></div></div>" +
      "<div class=\"row\" style=\"gap:16px\">" +
      (ex ? "<button class=\"pj-btn dark press\" data-pj=\"finalize\"" + (sum ? "" : " disabled") + ">Подвести итог</button>" : "") +
      (f.t === "quiz" && !ex ? "<button class=\"pj-btn press\" data-pj=\"reveal\">Показать ответ</button>" : "") +
      "<p class=\"pj-timer\" id=\"pj-timer\">" + ICON.clock + "<span>0:" + TIMER + "</span></p></div></div>";
  }

  function reactBanner(f) {
    var a = answer(), m = MODE[J.modeId], opts = optionsOf(f), o = opts[a.k], d = DIR[o.dir];
    var pts = f.t === "quick" ? P.scoring.quickPoints : f.t === "caseStep" ? P.scoring.casePoints : P.scoring.situationPoints;
    var who = a.hands ? "Больше всего рук за вариант " + LETTERS[a.k] + " (" + a.hands[a.k] + " из " + total(a.hands) + ")" : "Класс выбрал вариант " + LETTERS[a.k];
    var hint = m.hints && o.hint ? "<p class=\"pj-banner-hint\">" + esc(o.hint) + "</p>" : "";
    var nextText = f.t === "situation" && m.discussion ? "Разбор" : isLast() ? "Итог" : "Дальше";
    return "<div class=\"pj-banner\" style=\"background:" + d.color + "\" role=\"status\">" +
      "<div class=\"row\" style=\"gap:22px;align-items:flex-start\"><span class=\"pj-banner-ico popin\" style=\"color:" + d.color + "\">" + U.dirIcon(d, 40, 2.2) + "</span>" +
      "<div><p class=\"pj-banner-title\">+" + pts + " · " + esc(d.skill) + "</p>" +
      "<p class=\"pj-banner-sub\">" + who + " — это шаг к профессии «" + esc(d.name) + "»</p>" + hint + "</div></div>" +
      "<div class=\"row\" style=\"gap:12px;flex-shrink:0\"><button class=\"pj-btn ghost press\" data-pj=\"cancel\">Отменить</button>" +
      "<button class=\"pj-btn dark press\" data-pj=\"next\">" + nextText + ICON.arrow + "</button></div></div>";
  }

  function quizBanner(f) {
    var a = answer(), q = QUIZ[f.id], right = a.k === q.correct;
    var head = a.k == null ? "Правильный ответ — " + LETTERS[q.correct] : right ? "Верно!" : "Не совсем: правильный ответ — " + LETTERS[q.correct];
    return "<div class=\"pj-banner\" style=\"background:" + (a.k == null || right ? "var(--ok-soft)" : "var(--no-soft)") + "\" role=\"status\">" +
      "<div class=\"row\" style=\"gap:22px;align-items:flex-start\"><span class=\"pj-banner-ico\" style=\"background:" + (a.k == null || right ? "#138A57" : "var(--no)") + ";color:#FFFFFF\">" +
      sized(a.k == null || right ? ICON.check : ICON.cross, 40) + "</span>" +
      "<div><p class=\"pj-banner-title\">" + head + "</p><p class=\"pj-banner-hint\">" + esc(q.explain) + "</p></div></div>" +
      "<div class=\"row\" style=\"gap:12px;flex-shrink:0\"><button class=\"pj-btn dark press\" data-pj=\"next\">" + (isLast() ? "Итог" : "Дальше") + ICON.arrow + "</button></div></div>";
  }

  function isLast() { return J.run.pos === J.run.flow.length - 1; }

  function bottom(f) {
    var a = answer();
    if (J.run.phase === "ask" || !a) return waitBar(f);
    return f.t === "quiz" ? quizBanner(f) : reactBanner(f);
  }

  function textSize(s, big, small) { return s.length > 150 ? small : big; }

  function viewSituation(f) {
    var s = SIT[f.id], b = U.BLOCK[f.block];
    return "<div class=\"pj-main\">" + U.banner(f.block, s.title, b.title) +
      "<div><p class=\"pj-eyebrow\">Вопрос классу</p><h1 class=\"pj-q\" style=\"font-size:" + textSize(s.text, 48, 42) + "px\">" + esc(s.text) + "</h1></div></div>" +
      tiles(f) + "<div class=\"pj-bottom\">" + bottom(f) + "</div>";
  }

  function viewCaseStep(f) {
    var c = CASE[f.id], st = c.steps[f.step];
    return "<div class=\"pj-main\">" + U.banner("case", st.title, "Кейс · шаг " + (f.step + 1) + " из " + c.steps.length, c.title) +
      "<div><p class=\"pj-eyebrow\">Какую роль возьмёт класс?</p><h1 class=\"pj-q\">" + esc(st.text) + "</h1></div></div>" +
      tiles(f) + "<div class=\"pj-bottom\">" + bottom(f) + "</div>";
  }

  function viewQuick(f) {
    return "<div class=\"pj-quick-head\"><p class=\"pj-eyebrow\">Это или то</p><h1 class=\"pj-q\" style=\"font-size:64px\">" + esc(P.quick.promptClass || P.quick.prompt) + "</h1></div>" +
      tiles(f, "two") + "<div class=\"pj-bottom\">" + bottom(f) + "</div>";
  }

  function viewQuiz(f) {
    var q = QUIZ[f.id], d = DIR[q.dir];
    return "<div class=\"pj-quiz-head\"><div class=\"row\" style=\"gap:16px\">" + U.dirDot(d, 56) +
      "<div><p class=\"pj-eyebrow\" style=\"margin:0\">Проверь себя</p><p class=\"pj-wait-sub\" style=\"margin:4px 0 0\">Вопрос из мира: " + esc(d.tab.toLowerCase()) + "</p></div></div>" +
      "<h1 class=\"pj-q\" style=\"font-size:54px\">" + esc(q.q) + "</h1></div>" +
      tiles(f, "three") + "<div class=\"pj-bottom\">" + bottom(f) + "</div>";
  }

  function viewDiscuss(f) {
    var s = SIT[f.id], a = answer();
    return "<div class=\"pj-discuss-head\"><p class=\"pj-eyebrow\">Разбор · " + esc(s.title) + "</p>" +
      "<h1 class=\"pj-q\" style=\"font-size:44px\">Как поступил бы каждый специалист</h1></div>" +
      "<div class=\"pj-cards\">" + s.options.map(function (o, k) {
        var d = DIR[o.dir];
        return "<article class=\"pj-card" + (a && a.k === k ? " mine" : "") + "\">" +
          (a && a.k === k ? "<span class=\"pj-mine\">Выбор класса</span>" : "") +
          "<div class=\"row\" style=\"gap:16px\"><span class=\"pj-card-ico\" style=\"background:" + d.color + "\">" + U.dirIcon(d, 30, 2.2) + "</span>" +
          "<p class=\"pj-card-name\">" + LETTERS[k] + " · " + esc(d.name) + "</p>" +
          (a && a.hands ? "<span class=\"pj-hands\" style=\"margin-left:auto\">" + sized(ICON.hand, 26) + "<b>" + a.hands[k] + "</b></span>" : "") + "</div>" +
          "<p class=\"pj-card-opt\">" + esc(o.text) + "</p><p class=\"pj-card-hint\">" + esc(o.hint) + "</p></article>";
      }).join("") + "</div>" +
      "<div class=\"pj-bottom\"><div class=\"pj-ask\"><div><p class=\"pj-eyebrow\" style=\"margin:0 0 6px\">Обсудим</p><p class=\"pj-ask-q\">" + esc(s.ask) + "</p></div>" +
      "<button class=\"pj-btn dark press\" data-pj=\"next\">" + (isLast() ? "Итог" : "Дальше") + ICON.arrow + "</button></div></div>";
  }

  function viewCaseIntro(f) {
    var c = CASE[f.id];
    return "<div class=\"pj-case\"><div class=\"pj-case-card\"><p class=\"pj-eyebrow\" style=\"color:var(--lime)\">Командный кейс</p>" +
      "<h1>" + esc(c.title) + "</h1><p>" + esc(c.intro) + "</p></div>" +
      "<div class=\"pj-steps\"><p class=\"pj-eyebrow\">Три шага</p>" + c.steps.map(function (st, k) {
        return "<div class=\"row\" style=\"gap:20px\"><span class=\"pj-step-n\">" + (k + 1) + "</span><span class=\"pj-step-t\">" + esc(st.title) + "</span></div>";
      }).join("") + "<p class=\"pj-wait-sub\">На каждом шаге класс решает, какую роль взять в команде. Правильных ответов нет.</p>" +
      "<button class=\"pj-btn cta press\" data-pj=\"next\">Начать кейс" + ICON.arrow + "</button></div></div>";
  }

  function viewCaseOutro(f) {
    var c = CASE[f.id], r = J.run;
    var roles = r.flow.map(function (x, i) { return { x: x, a: r.answers[i] }; })
      .filter(function (z) { return z.x.t === "caseStep" && z.x.id === f.id && z.a; });
    return "<div class=\"pj-case\"><div class=\"pj-case-card\"><p class=\"pj-eyebrow\" style=\"color:var(--lime)\">Чем всё закончилось</p>" +
      "<h1>" + esc(c.title) + "</h1><p>" + esc(c.outro) + "</p><p class=\"pj-term\"><b>" + esc(c.term.word) + "</b> — " + esc(c.term.def) + "</p></div>" +
      "<div class=\"pj-steps\"><p class=\"pj-eyebrow\">Роли класса в команде</p>" + (roles.length ? roles.map(function (z) {
        var d = DIR[optionsOf(z.x)[z.a.k].dir];
        return "<div class=\"row\" style=\"gap:20px\"><span class=\"pj-step-n\" style=\"background:" + d.color + "\">" + (z.x.step + 1) + "</span>" +
          "<span class=\"pj-step-t\">" + esc(c.steps[z.x.step].title) + ": <span style=\"font-weight:500\">" + esc(d.name.toLowerCase()) + "</span></span></div>";
      }).join("") : "<p class=\"pj-wait-sub\">Шаги кейса пропущены.</p>") +
      "<p class=\"pj-team\">" + esc(c.team) + "</p>" +
      "<button class=\"pj-btn cta press\" data-pj=\"next\">" + (isLast() ? "Итог" : "Дальше") + ICON.arrow + "</button></div></div>";
  }

  function viewPlay() {
    var f = cur(), r = J.run, body;
    if (f.t === "caseIntro") body = viewCaseIntro(f);
    else if (f.t === "caseOutro") body = viewCaseOutro(f);
    else if (r.phase === "discuss") body = viewDiscuss(f);
    else if (f.t === "situation") body = viewSituation(f);
    else if (f.t === "caseStep") body = viewCaseStep(f);
    else if (f.t === "quick") body = viewQuick(f);
    else body = viewQuiz(f);
    return topBar(progress(), playButtons()) + body + (J.dialog ? viewDialog() : "");
  }

  function viewDialog() {
    var any = answeredCount() > 0;
    return "<div class=\"pj-overlay\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"pj-dlg\"><div class=\"pj-dialog\">" +
      "<p class=\"pj-dialog-title\" id=\"pj-dlg\">Закончить игру?</p>" +
      "<p class=\"pj-wait-sub\">Отвечено " + answeredCount() + " " + U.plural(answeredCount(), "ситуация", "ситуации", "ситуаций") + ". Итог можно подвести прямо сейчас.</p>" +
      "<button class=\"pj-btn cta press\" data-pj=\"finish\"" + (any ? "" : " disabled") + ">Подвести итог сейчас</button>" +
      "<button class=\"pj-btn ghost press\" data-pj=\"leave\">Выйти без итога</button>" +
      "<button class=\"pj-btn ghost press\" data-pj=\"close-dialog\">Продолжить игру</button></div></div>";
  }

  function viewSetup() {
    var resume = "";
    if (J.saved) {
      var sr = J.saved.run, done = sr.flow.filter(function (f, i) { return counts(f) && sr.answers[i]; }).length;
      resume = "<div class=\"pj-resume\"><p><b>Есть незаконченная игра класса</b> · " + esc(MODE_LABEL[J.saved.modeId].title.toLowerCase()) + ", отвечено " + done + "</p>" +
        "<button class=\"pj-btn dark press\" data-pj=\"resume\">Продолжить</button></div>";
    }
    return "<div class=\"pj-setup\"><div class=\"pj-setup-left\">" +
      "<div class=\"row\" style=\"gap:20px\"><img src=\"assets/logo-sei.svg\" alt=\"СЭИ\" style=\"width:120px\"><p class=\"pj-wait-sub\">" + esc(P.meta.orgFull) + "</p></div>" +
      "<div>" + logoWord(140, true) + "<span class=\"pj-badge big\">Общий режим</span></div>" +
      "<p class=\"pj-lead\">Весь класс играет вместе: читаем ситуацию, голосуем поднятой рукой, ведущий отмечает вариант большинства. В конце — суперсила класса.</p>" +
      "<div class=\"pj-keys\"><p class=\"pj-eyebrow\" style=\"margin:0\">Управление</p>" +
      "<p><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> вариант</p><p><kbd>→</kbd> или пульт — дальше, <kbd>←</kbd> — назад</p>" +
      "<p><kbd>Backspace</kbd> отменить выбор · <kbd>T</kbd> таймер заново · <kbd>F</kbd> во весь экран</p></div></div>" +
      "<div class=\"pj-setup-right\">" + resume +
      "<p class=\"pj-eyebrow\">Сколько времени</p><div class=\"pj-modes\">" + P.modes.map(function (m) {
        var L = MODE_LABEL[m.id];
        return "<button class=\"pj-mode press\" data-pj=\"mode\" data-id=\"" + m.id + "\" aria-pressed=\"" + (m.id === J.modeId) + "\">" +
          "<span class=\"t\">" + esc(m.minutes) + "</span><span class=\"n\">мин · " + esc(L.title.toLowerCase()) + "</span><span class=\"d\">" + esc(L.sub) + "</span></button>";
      }).join("") + "</div>" +
      "<p class=\"pj-eyebrow\">Как считаем голоса</p><div class=\"pj-votes\">" +
      "<button class=\"pj-mode press\" data-pj=\"voting\" data-id=\"quick\" aria-pressed=\"" + (J.voting === "quick") + "\"><span class=\"n\">Быстро</span><span class=\"d\">Ведущий нажимает вариант, за который подняли больше рук</span></button>" +
      "<button class=\"pj-mode press\" data-pj=\"voting\" data-id=\"exact\" aria-pressed=\"" + (J.voting === "exact") + "\"><span class=\"n\">Точно</span><span class=\"d\">Ведущий считает руки за каждый вариант — профиль класса честнее</span></button></div>" +
      "<button class=\"pj-btn cta big press\" data-pj=\"start\">" + sized(ICON.play, 34) + "Начать игру</button>" +
      "<div class=\"row\" style=\"justify-content:space-between\"><button class=\"pj-link\" data-pj=\"catalog\">" + ICON.grid + "Все профессии</button>" +
      "<button class=\"pj-link\" data-pj=\"personal\">Личный режим на телефоне →</button></div>" +
      "<p class=\"pj-wait-sub\" style=\"font-size:18px\">Работает без интернета. Регистрации и сбора данных нет.</p>" +
      "</div></div>";
  }

  function viewResult() {
    var res = J.result, sc = E.score(P, res.picks), top = DIR[sc.top], second = sc.second ? DIR[sc.second] : null;
    var rows = P.directions.slice().sort(function (a, b) { return sc.percent[b.id] - sc.percent[a.id]; });
    var max = Math.max.apply(null, rows.map(function (d) { return sc.percent[d.id]; })) || 1;
    var title = sc.double ? top.name + " и " + second.name : top.name;
    var combo = sc.combo;
    return topBar("<p class=\"pj-count\">Итог · " + res.picks.length + " " + U.plural(res.picks.length, "выбор", "выбора", "выборов") + " класса</p>",
      "<button class=\"pj-icon press\" data-pj=\"setup\" aria-label=\"На старт\" title=\"На старт\">" + ICON.close + "</button>") +
      "<div class=\"pj-result\"><div class=\"pj-result-left\">" +
      "<div class=\"pj-hero\" style=\"background:" + top.color + "\"><span class=\"pj-hero-ico popin\" style=\"color:" + top.color + "\">" + U.dirIcon(top, 80, 2) + "</span>" +
      "<div><p class=\"pj-eyebrow\" style=\"color:var(--ink)\">" + (sc.double ? "Двойная суперсила класса" : "Суперсила класса") + "</p>" +
      "<h1 style=\"font-size:" + (title.length > 30 ? 46 : 60) + "px\">" + esc(title) + "</h1><p class=\"pj-hero-text\">" + esc(top.about) + "</p></div></div>" +
      "<section class=\"pj-panel\"><div class=\"row\" style=\"justify-content:space-between;align-items:baseline\"><h2 class=\"pj-h2\">Профиль класса</h2>" +
      "<p class=\"pj-wait-sub\">" + (res.voting === "exact" ? "По голосам всех учеников" : "По выбору большинства") + "</p></div><ul class=\"pj-bars\">" +
      rows.map(function (d, k) {
        return "<li>" + U.dirDot(d, 44) + "<span class=\"pj-bar-name\">" + esc(d.name) + "</span>" +
          "<span class=\"pj-track\"><span class=\"bar\" style=\"width:" + Math.round(sc.percent[d.id] / max * 100) + "%;background:" + d.color + ";animation-delay:" + U.fx(0.2 + k * 0.08) + "s\"></span></span>" +
          "<span class=\"pj-bar-val\">" + sc.percent[d.id] + "%</span></li>";
      }).join("") + "</ul></section></div>" +
      "<div class=\"pj-result-right\">" +
      (second ? "<section class=\"pj-panel\"><p class=\"pj-eyebrow\" style=\"margin:0\">" + (sc.double ? "Сочетание двух сил" : "Вторая сила: " + esc(second.tab.toLowerCase())) + "</p>" +
        "<div class=\"row\" style=\"gap:10px\">" + U.dirDot(top, 52) + "<span class=\"pj-plus\">+</span>" + U.dirDot(second, 52) + "</div>" +
        (combo ? "<h2 class=\"pj-h2\" style=\"font-size:36px\">" + esc(combo.title) + "</h2><p class=\"pj-panel-text\">" + esc(combo.text) + "</p>" : "") + "</section>" : "") +
      "<section class=\"pj-panel fact\"><p class=\"pj-eyebrow\" style=\"margin:0\">Знаешь ли ты?</p><p class=\"pj-panel-text\">" + esc(top.facts[res.factIdx % top.facts.length]) + "</p></section>" +
      (res.quizTotal ? "<section class=\"pj-panel pj-panel-row\"><span class=\"pj-score\">" + res.quizCorrect + "/" + res.quizTotal + "</span>" +
        "<div><p class=\"pj-eyebrow\" style=\"margin:0\">Проверь себя</p><p class=\"pj-panel-text\">Класс ответил верно на " + res.quizCorrect + " " + U.plural(res.quizCorrect, "вопрос", "вопроса", "вопросов") + " из " + res.quizTotal + "</p></div></section>" : "") +
      "<div class=\"pj-actions\"><button class=\"pj-btn cta big press\" data-pj=\"setup\">" + sized(ICON.retry, 28) + "Новая игра</button>" +
      "<button class=\"pj-btn ghost big press\" data-pj=\"catalog\">" + ICON.grid + "Все профессии</button></div>" +
      "</div></div>";
  }

  function viewCatalog() {
    var topId = J.result ? E.score(P, J.result.picks).top : null;
    return topBar("<p class=\"pj-count\">Все профессии</p>", "<button class=\"pj-icon press\" data-pj=\"catalog-back\" aria-label=\"Назад\" title=\"Назад\">" + sized(ICON.back, 24) + "</button>") +
      "<div class=\"pj-catalog\">" + P.directions.map(function (d) {
        return "<article class=\"pj-prof\" style=\"background:" + d.color + "\">" + (d.id === topId ? "<span class=\"pj-mine\">Суперсила класса</span>" : "") +
          "<span class=\"pj-prof-ico\" style=\"color:" + d.color + "\">" + U.dirIcon(d, 34, 2.2) + "</span>" +
          "<h2" + (d.name.length > 26 ? " class=\"long\"" : "") + ">" + esc(d.name) + "</h2><p class=\"pj-prof-about\">" + esc(d.about) + "</p>" +
          "<p class=\"pj-prof-lbl\">Кем можно стать</p><p class=\"pj-prof-roles\">" + esc(d.roles.join(" · ")) + "</p>" +
          "<p class=\"pj-prof-lbl\">ЕГЭ</p><p class=\"pj-prof-roles\">" + esc(d.ege.required.join(", ")) + " + на выбор вуза</p></article>";
      }).join("") +
      "<article class=\"pj-prof pj-prof-note\"><p class=\"pj-prof-lbl\">Подсказка</p><p class=\"pj-prof-about\">Суперсилы можно совмещать. Сыграйте ещё раз — и сравните, как изменится профиль класса.</p>" +
      "<button class=\"pj-btn dark press\" data-pj=\"catalog-back\">" + ICON.back + "Назад</button></article></div>";
  }

  function render() {
    var html;
    if (J.screen === "setup") html = viewSetup();
    else if (J.screen === "play") html = viewPlay();
    else if (J.screen === "result") html = viewResult();
    else html = viewCatalog();
    app.innerHTML = "<div class=\"pj-viewport\"><div class=\"pj-stage\">" + html + "</div></div>";
    fit();
    paintTimer();
    var focus = app.querySelector(J.dialog ? ".pj-dialog .pj-btn" : ".pj-stage h1, .pj-stage h2");
    if (focus) { focus.setAttribute("tabindex", "-1"); try { focus.focus({ preventScroll: true }); } catch (e) { focus.focus(); } }
  }

  function go(screen) { stopTimer(); J.dialog = false; J.screen = screen; render(); }

  // ---------- события ----------

  app.addEventListener("click", function (e) {
    if (P.route !== "projector") return;
    var t = e.target.closest("[data-pj]");
    if (!t || t.disabled) return;
    var act = t.getAttribute("data-pj");
    switch (act) {
      case "full": toggleFullscreen(); break;
      case "mode": J.modeId = t.getAttribute("data-id"); render(); break;
      case "voting": J.voting = t.getAttribute("data-id"); render(); break;
      case "start": U.drop(U.SS, "profsila.proj"); startRun(); break;
      case "resume": J.modeId = J.saved.modeId; J.voting = J.saved.voting; J.run = J.saved.run; J.saved = null; J.screen = "play"; enter(); break;
      case "personal": location.hash = ""; break;
      case "catalog": J.back = J.screen; go("catalog"); break;
      case "catalog-back": go(J.back === "catalog" ? "setup" : J.back); break;
      case "setup": J.saved = U.load(U.SS, "profsila.proj", null); go("setup"); break;
      case "pick": choose(+t.getAttribute("data-k"), false); break;
      case "minus": e.stopPropagation(); choose(+t.getAttribute("data-k"), true); break;
      case "finalize": finalize(); break;
      case "reveal": forward(); break;
      case "cancel": cancel(); break;
      case "next": forward(); break;
      case "back": backward(); break;
      case "skip": skip(); break;
      case "menu": J.dialog = true; render(); break;
      case "close-dialog": J.dialog = false; render(); break;
      case "finish": finish(); break;
      case "leave": J.run = null; J.saved = null; U.drop(U.SS, "profsila.proj"); go("setup"); break;
    }
  }, true);

  document.addEventListener("keydown", function (e) {
    if (P.route !== "projector" || e.ctrlKey || e.metaKey || e.altKey) return;
    var code = e.code, key = e.key;
    if (code === "KeyF") { e.preventDefault(); toggleFullscreen(); return; }
    if (J.dialog) { if (key === "Escape") { J.dialog = false; render(); } return; }
    if (J.screen !== "play") return;
    var digit = /^(Digit|Numpad)([1-4])$/.exec(code);
    var letter = /^Key([A-D])$/.exec(code);
    if (digit || letter) {
      e.preventDefault();
      choose(digit ? +digit[2] - 1 : "ABCD".indexOf(letter[1]), e.shiftKey);
      return;
    }
    if (key === "ArrowRight" || key === "PageDown" || key === "Enter" || key === " ") { e.preventDefault(); forward(); return; }
    if (key === "ArrowLeft" || key === "PageUp") { e.preventDefault(); backward(); return; }
    if (key === "Backspace" || key === "Delete") { e.preventDefault(); cancel(); return; }
    if (code === "KeyT") { e.preventDefault(); if (J.run.phase === "ask" && isQuestion(cur())) startTimer(); }
  });

  P.projector = {
    mount: function () {
      P.route = "projector";
      J.active = true;
      document.body.classList.add("pj-mode");
      if (!J.run) {
        J.saved = U.load(U.SS, "profsila.proj", null);
        if (J.saved && !J.saved.run) J.saved = null;
      }
      if (J.screen === "play" && !J.run) J.screen = "setup";
      enter();
    },
    unmount: function () {
      J.active = false;
      stopTimer();
      document.body.classList.remove("pj-mode");
    }
  };
})();
