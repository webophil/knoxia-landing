/* KnoXia — comportement commun aux pages localisées */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var locale = document.documentElement.lang;
    document.querySelectorAll("[data-locale]").forEach(function (link) {
      if (link.getAttribute("data-locale") === locale) {
        link.setAttribute("aria-current", "page");
      }
    });
  });
})();
