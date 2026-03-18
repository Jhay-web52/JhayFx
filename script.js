document.addEventListener("DOMContentLoaded", () => {

  /* ============================================================
     PRELOADER
     ============================================================ */
  const preloader = document.getElementById("preloader");
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (preloader) preloader.classList.add("hidden");
    }, 1800);
  });

  /* ============================================================
     DYNAMIC FOOTER YEAR
     ============================================================ */
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     HAMBURGER MENU
     ============================================================ */
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const mobileNav    = document.getElementById("mobile-nav");

  if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("open");
      hamburgerBtn.classList.toggle("open");
      hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  /* ============================================================
     SMOOTH SCROLL + CLOSE MOBILE NAV
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset  = document.querySelector(".header")?.offsetHeight || 0;
        const tickerH = document.querySelector(".ticker-bar")?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - offset - tickerH;
        window.scrollTo({ top, behavior: "smooth" });
        if (mobileNav) mobileNav.classList.remove("open");
        if (hamburgerBtn) {
          hamburgerBtn.classList.remove("open");
          hamburgerBtn.setAttribute("aria-expanded", "false");
        }
      }
    });
  });

  /* ============================================================
     SCROLL EVENTS — progress bar, header, back-to-top, active nav
     ============================================================ */
  const progressBar = document.getElementById("scroll-progress");
  const header      = document.getElementById("header");
  const backToTop   = document.getElementById("back-to-top");
  const sections    = document.querySelectorAll("section[id]");
  const navLinks    = document.querySelectorAll(".nav-links a");

  function onScroll() {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const progress   = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    // Progress bar
    if (progressBar) progressBar.style.width = progress + "%";

    // Header state
    if (header) header.classList.toggle("scrolled", scrollTop > 60);

    // Back to top
    if (backToTop) backToTop.classList.toggle("visible", scrollTop > 400);

    // Active nav
    let currentId = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      if (scrollTop >= sectionTop) currentId = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + currentId) link.classList.add("active");
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // run on load

  // Back to top click
  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ============================================================
     SCROLL REVEAL (Intersection Observer)
     ============================================================ */
  const revealEls = document.querySelectorAll(".reveal");

  // Stagger grid children
  document
    .querySelectorAll(".services-grid, .pricing-grid, .brokers-grid, .stats-grid, .testimonials-grid")
    .forEach((grid) => {
      grid.querySelectorAll(".reveal").forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.1}s`;
      });
    });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ============================================================
     COUNTER ANIMATION
     ============================================================ */
  const counters = document.querySelectorAll(".stat-number");

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const suffix = el.dataset.suffix || "";
          const duration  = 1800;
          const startTime = performance.now();

          const animate = (now) => {
            const elapsed  = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            el.textContent = Math.floor(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
          counterObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => counterObserver.observe(el));

  /* ============================================================
     TYPEWRITER EFFECT
     ============================================================ */
  const typewriterEl = document.getElementById("typewriter");
  if (typewriterEl) {
    const words = [
      "Forex",
      "Currency Pairs",
      "Gold & Commodities",
      "Prop Firm Accounts",
      "the Financial Markets",
    ];
    let wordIndex = 0;
    let charIndex = 0;
    let deleting  = false;

    const TYPE_SPEED   = 90;
    const DELETE_SPEED = 50;
    const PAUSE_TIME   = 2000;
    const START_DELAY  = 1000;

    function type() {
      const currentWord = words[wordIndex];

      if (!deleting) {
        typewriterEl.textContent = currentWord.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === currentWord.length) {
          deleting = true;
          setTimeout(type, PAUSE_TIME);
          return;
        }
      } else {
        typewriterEl.textContent = currentWord.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          deleting   = false;
          wordIndex  = (wordIndex + 1) % words.length;
        }
      }

      setTimeout(type, deleting ? DELETE_SPEED : TYPE_SPEED);
    }

    setTimeout(type, START_DELAY);
  }

  /* ============================================================
     LIVE FOREX TICKER
     ============================================================ */
  const tickerTrack = document.getElementById("ticker-track");

  const pairs = [
    { pair: "EUR/USD", price: 1.08560, decimals: 5 },
    { pair: "GBP/USD", price: 1.27340, decimals: 5 },
    { pair: "USD/JPY", price: 149.850, decimals: 3 },
    { pair: "AUD/USD", price: 0.65230, decimals: 5 },
    { pair: "USD/CAD", price: 1.36870, decimals: 5 },
    { pair: "EUR/GBP", price: 0.85240, decimals: 5 },
    { pair: "USD/CHF", price: 0.89650, decimals: 5 },
    { pair: "XAU/USD", price: 2024.30, decimals: 2 },
    { pair: "BTC/USD", price: 67450.00, decimals: 2 },
    { pair: "NZD/USD", price: 0.60120, decimals: 5 },
  ];

  // Randomly fluctuate a price slightly
  function jitter(price, decimals) {
    const delta = price * (Math.random() * 0.0006 - 0.0003);
    return parseFloat((price + delta).toFixed(decimals));
  }

  function buildTickerItem(pair, price, decimals, prevPrice) {
    const up  = price >= prevPrice;
    const dir = up ? "▲" : "▼";
    const cls = up ? "up" : "down";
    const diff = Math.abs(price - prevPrice).toFixed(decimals);
    return `<span class="ticker-item">
      <span class="pair">${pair}</span>
      <span class="price">${price.toFixed(decimals)}</span>
      <span class="change ${cls}">${dir} ${diff}</span>
    </span>`;
  }

  function renderTicker() {
    if (!tickerTrack) return;
    const html = pairs.map((p) => buildTickerItem(p.pair, p.price, p.decimals, p.price)).join("");
    // Duplicate for seamless loop
    tickerTrack.innerHTML = html + html;
  }

  // Update prices every 3 seconds with subtle fluctuations
  function updateTicker() {
    if (!tickerTrack) return;
    const items = tickerTrack.querySelectorAll(".ticker-item");
    const half  = items.length / 2;

    pairs.forEach((p, i) => {
      const prevPrice = p.price;
      p.price = jitter(p.price, p.decimals);
      const up  = p.price >= prevPrice;
      const dir = up ? "▲" : "▼";
      const cls = up ? "up" : "down";
      const diff = Math.abs(p.price - prevPrice).toFixed(p.decimals);

      // Update both copies (the duplicate for the loop)
      [items[i], items[i + half]].forEach((item) => {
        if (!item) return;
        item.querySelector(".price").textContent = p.price.toFixed(p.decimals);
        const change = item.querySelector(".change");
        change.textContent  = `${dir} ${diff}`;
        change.className    = `change ${cls}`;
      });
    });
  }

  renderTicker();
  setInterval(updateTicker, 3000);

  /* ============================================================
     FAQ ACCORDION
     ============================================================ */
  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item   = btn.closest(".faq-item");
      const isOpen = item.classList.contains("open");

      // Close all
      document.querySelectorAll(".faq-item.open").forEach((openItem) => {
        openItem.classList.remove("open");
        openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });

      // Open clicked (unless it was already open)
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

});
