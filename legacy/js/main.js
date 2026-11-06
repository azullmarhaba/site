/* ============================================================
   AZUL AGENCY — preloader, navbar, mobile menu, scroll spy
   ============================================================ */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     PRELOADER — plays the brand video, tracks progress, exits
     ---------------------------------------------------------- */
  var preloader = document.getElementById("preloader");
  var video = preloader ? preloader.querySelector(".preloader__video") : null;
  var fill = preloader ? preloader.querySelector(".preloader__fill") : null;
  var countEl = preloader ? preloader.querySelector("[data-preloader-count]") : null;
  var skipBtn = preloader ? preloader.querySelector("[data-preloader-skip]") : null;

  var MIN_SHOW_MS = prefersReducedMotion ? 400 : 2600;
  var HARD_TIMEOUT_MS = 8000;
  var startedAt = Date.now();
  var shownProgress = 0;
  var finished = false;

  function setProgress(value) {
    shownProgress = Math.max(shownProgress, Math.min(100, Math.round(value)));
    if (fill) fill.style.width = shownProgress + "%";
    if (countEl) countEl.textContent = String(shownProgress);
    if (preloader) preloader.setAttribute("aria-label", "Loading Azul Agency — " + shownProgress + "%");
  }

  function finishPreloader() {
    if (finished || !preloader) return;
    finished = true;
    setProgress(100);

    var wait = Math.max(0, MIN_SHOW_MS - (Date.now() - startedAt));
    window.setTimeout(function () {
      preloader.classList.add("is-done");
      preloader.setAttribute("aria-busy", "false");
      document.body.classList.remove("is-loading");
      window.setTimeout(function () {
        if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 900);
    }, wait);
  }

  if (preloader && video) {
    setProgress(4);

    if (prefersReducedMotion) {
      video.removeAttribute("autoplay");
      finishPreloader();
    } else {
      // Progress from playback time + buffered ranges.
      var tick = function () {
        if (finished) return;
        var duration = video.duration;
        var timeProgress = duration && isFinite(duration) ? (video.currentTime / duration) * 88 : 0;
        var bufferProgress = 0;
        if (video.buffered.length && duration && isFinite(duration)) {
          bufferProgress = (video.buffered.end(video.buffered.length - 1) / duration) * 88;
        }
        setProgress(Math.max(shownProgress, timeProgress, bufferProgress));
      };

      video.addEventListener("timeupdate", tick);
      video.addEventListener("progress", tick);

      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          // Autoplay blocked or decode failure — don't hold the user hostage.
          setProgress(100);
          finishPreloader();
        });
      }

      video.addEventListener("ended", finishPreloader);
      video.addEventListener("error", finishPreloader);
    }

    // Network never fully settles: hard cap so the site always opens.
    window.setTimeout(finishPreloader, HARD_TIMEOUT_MS);
  } else {
    finishPreloader();
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", function () {
      if (video) video.pause();
      finished = true;
      setProgress(100);
      preloader.classList.add("is-done");
      preloader.setAttribute("aria-busy", "false");
      document.body.classList.remove("is-loading");
      window.setTimeout(function () {
        if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 600);
    });
  }

  /* ----------------------------------------------------------
     NAVBAR — glass on scroll, hide/show, scroll progress
     ---------------------------------------------------------- */
  var nav = document.querySelector("[data-nav]");
  var progress = document.querySelector("[data-scroll-progress]");
  var lastScrollY = window.scrollY;
  var navTicking = false;

  function updateNav() {
    var y = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (nav) {
      nav.classList.toggle("is-scrolled", y > 24);
      // Hide when scrolling down (past hero), show when scrolling up.
      var goingDown = y > lastScrollY;
      nav.classList.toggle("is-hidden", goingDown && y > 240);
    }

    if (progress) {
      var pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
      progress.style.width = pct + "%";
    }

    lastScrollY = y;
    navTicking = false;
  }

  window.addEventListener("scroll", function () {
    if (!navTicking) {
      navTicking = true;
      window.requestAnimationFrame(updateNav);
    }
  }, { passive: true });
  updateNav();

  /* ----------------------------------------------------------
     SCROLL SPY — active nav link follows the visible section
     ---------------------------------------------------------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ----------------------------------------------------------
     MOBILE MENU — open/close, focus trap, Esc, scroll lock
     ---------------------------------------------------------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var menu = document.querySelector("[data-menu]");
  var menuLinks = menu ? Array.prototype.slice.call(menu.querySelectorAll("a")) : [];
  var lastFocused = null;

  function menuIsOpen() {
    return !!menu && menu.classList.contains("is-open");
  }

  function openMenu() {
    if (!menu || !toggle) return;
    lastFocused = document.activeElement;
    menu.hidden = false;
    // Next frame so the transition runs from the hidden state.
    window.requestAnimationFrame(function () {
      menu.classList.add("is-open");
    });
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("menu-open");
    if (menuLinks[0]) menuLinks[0].focus();
  }

  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("menu-open");
    window.setTimeout(function () {
      if (!menu.classList.contains("is-open")) menu.hidden = true;
    }, 400);
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      menuIsOpen() ? closeMenu() : openMenu();
    });

    // Close when clicking the backdrop (outside the panel).
    menu.addEventListener("click", function (event) {
      if (event.target === menu) closeMenu();
    });

    // Close after choosing an anchor.
    menuLinks.forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (!menuIsOpen()) return;

      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key === "Tab") {
        var focusables = [toggle].concat(menuLinks);
        var first = focusables[0];
        var last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    // If the viewport grows to desktop while the menu is open, reset it.
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (event) {
      if (event.matches && menuIsOpen()) closeMenu();
    });
  }

  /* ----------------------------------------------------------
     MISC
     ---------------------------------------------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
