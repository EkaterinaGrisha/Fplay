// ПРОФСИЛА · QR-код со ссылкой на игру. Рисуется прямо в браузере, интернет не нужен.
// Кодирует js/vendor/qrcode.js — QR Code Generator for JavaScript, © 2009 Kazuhiko Arase, лицензия MIT.

(function () {
  "use strict";

  var P = window.PROFSILA = window.PROFSILA || {};

  // Адрес для QR: из config.js, а если его нет и игра открыта с сайта — адрес текущей страницы.
  function playUrl() {
    var u = P.config && P.config.playUrl;
    if (u) return u;
    if (/^https?:/.test(location.protocol)) return location.href.split("#")[0];
    return "";
  }

  function shortUrl(u) { return u.replace(/^https?:\/\//, "").replace(/\/$/, ""); }

  // SVG с квадратными модулями и белым полем в 4 модуля вокруг — так код читают любые камеры.
  function svg(text, label) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
    var q = qrcode(0, "M");
    q.addData(text);
    q.make();
    var n = q.getModuleCount(), m = 4, size = n + m * 2, d = "";
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += "M" + (c + m) + " " + (r + m) + "h1v1h-1z";
    }
    return "<svg class=\"qr\" viewBox=\"0 0 " + size + " " + size + "\" role=\"img\" aria-label=\"" + (label || "QR-код") +
      "\" shape-rendering=\"crispEdges\"><rect width=\"" + size + "\" height=\"" + size + "\" fill=\"#FFFFFF\"></rect>" +
      "<path d=\"" + d + "\" fill=\"#141033\"></path></svg>";
  }

  P.qr = { playUrl: playUrl, shortUrl: shortUrl, svg: svg };
})();
