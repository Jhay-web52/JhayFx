"use strict";

/* ============================================================
   LOGO — click to go home, triple-tap to open admin login
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  var logo = document.querySelector(".logo-container");
  if (!logo) return;

  logo.style.cursor = "pointer";

  var taps = 0;
  var tapTimer = null;

  logo.addEventListener("click", function () {
    taps++;
    clearTimeout(tapTimer);

    if (taps >= 3) {
      taps = 0;
      window.location.href = "admin.html";
      return;
    }

    tapTimer = setTimeout(function () {
      var path = window.location.pathname;
      var isHome = path === "/" || path.endsWith("/JhayFx/") ||
                   path.includes("index") || path.endsWith("/");
      if (isHome) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.location.href = "index.html";
      }
      taps = 0;
    }, 550);
  });
});
