/* KnoXia — interactions landing page (vanilla JS) */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    /* Année dynamique */
    var yearEl = document.getElementById("year");
    if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

    /* Header densifié au scroll */
    var header = document.getElementById("siteHeader");
    function onScroll() {
      if (!header) return;
      if (window.scrollY > 12) { header.classList.add("scrolled"); }
      else { header.classList.remove("scrolled"); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* Menu mobile */
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("mainNav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      });
      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    /* Apparition au scroll */
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add("visible"); });
    }

    /* Léger parallaxe sur le visuel du hero */
    var parallax = document.querySelector("[data-parallax]");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (parallax && !reduceMotion) {
      var ticking = false;
      window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          var offset = Math.min(window.scrollY, 500) * 0.06;
          parallax.style.transform = "translateY(" + offset + "px)";
          ticking = false;
        });
      }, { passive: true });
    }

    /* FAQ : un seul panneau ouvert à la fois */
    var faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (item.open) {
          faqItems.forEach(function (other) {
            if (other !== item) { other.removeAttribute("open"); }
          });
        }
      });
    });
  });
})();
