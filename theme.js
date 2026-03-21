"use strict";

/* ── Apply saved theme before first paint ─────────────────── */
(function () {
  var t = localStorage.getItem("jhfx-theme") || "dark";
  document.documentElement.setAttribute("data-theme", t);
})();

/* ── Theme toggle wiring ──────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  function getTheme()  { return document.documentElement.getAttribute("data-theme") || "dark"; }
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("jhfx-theme", t);
    updateIcons(t);
  }
  function updateIcons(t) {
    document.querySelectorAll(".theme-toggle i").forEach(function (i) {
      i.className = t === "light" ? "fas fa-sun" : "fas fa-moon";
    });
  }

  updateIcons(getTheme());

  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTheme(getTheme() === "dark" ? "light" : "dark");
    });
  });
});
