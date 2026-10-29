// ПРОФСИЛА · выбор режима по адресу: index.html — личный, index.html#projector — общий.

(function () {
  "use strict";
  var P = window.PROFSILA;

  function route() {
    if (location.hash === "#projector") {
      P.personal.unmount();
      P.projector.mount();
    } else {
      P.projector.unmount();
      P.personal.mount();
    }
  }

  window.addEventListener("hashchange", route);
  route();
})();
