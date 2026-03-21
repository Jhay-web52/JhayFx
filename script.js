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
     LIVE FOREX TICKER — Real rates via free currency API
     ============================================================ */
  const tickerTrack = document.getElementById("ticker-track");

  // Pair definitions: mode "inv" = 1/rate, "dir" = rate itself, "cross" = computed
  const PAIRS = [
    { pair: "EUR/USD", key: "eur", mode: "inv",   decimals: 5 },
    { pair: "GBP/USD", key: "gbp", mode: "inv",   decimals: 5 },
    { pair: "USD/JPY", key: "jpy", mode: "dir",   decimals: 3 },
    { pair: "AUD/USD", key: "aud", mode: "inv",   decimals: 5 },
    { pair: "USD/CAD", key: "cad", mode: "dir",   decimals: 5 },
    { pair: "EUR/GBP", key: null,  mode: "cross", decimals: 5, c: ["gbp", "eur"] },
    { pair: "USD/CHF", key: "chf", mode: "dir",   decimals: 5 },
    { pair: "XAU/USD", key: "xau", mode: "inv",   decimals: 2 },
    { pair: "BTC/USD", key: "btc", mode: "inv",   decimals: 0 },
    { pair: "NZD/USD", key: "nzd", mode: "inv",   decimals: 5 },
  ];

  const livePrice = {};  // current displayed price per pair
  const prevPrice = {};  // previous price for change arrow

  function calcFromRates(r, p) {
    if (p.mode === "inv")   return 1 / r[p.key];
    if (p.mode === "dir")   return r[p.key];
    if (p.mode === "cross") return r[p.c[0]] / r[p.c[1]];
  }

  // Fetch real rates (updates daily on the CDN, no API key needed)
  async function fetchRates() {
    try {
      const res  = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
      );
      const data = await res.json();
      const r    = data.usd;
      PAIRS.forEach((p) => {
        const price = parseFloat(calcFromRates(r, p).toFixed(p.decimals));
        prevPrice[p.pair] = livePrice[p.pair] ?? price;
        livePrice[p.pair] = price;
      });
      renderTicker();
    } catch (_) {
      // Fallback static prices if network fails
      if (!livePrice["EUR/USD"]) {
        const fb = {
          "EUR/USD": 1.08560, "GBP/USD": 1.27340, "USD/JPY": 149.850,
          "AUD/USD": 0.65230, "USD/CAD": 1.36870, "EUR/GBP": 0.85240,
          "USD/CHF": 0.89650, "XAU/USD": 2341.50, "BTC/USD": 67450,
          "NZD/USD": 0.60120,
        };
        PAIRS.forEach((p) => { livePrice[p.pair] = fb[p.pair]; prevPrice[p.pair] = fb[p.pair]; });
        renderTicker();
      }
    }
  }

  function buildItem(pair, price, prev, decimals) {
    const up   = price >= (prev ?? price);
    const diff = Math.abs(price - (prev ?? price)).toFixed(decimals);
    return `<span class="ticker-item">
      <span class="pair">${pair}</span>
      <span class="price">${price.toFixed(decimals)}</span>
      <span class="change ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${diff}</span>
    </span>`;
  }

  function renderTicker() {
    if (!tickerTrack) return;
    const html = PAIRS.map((p) =>
      buildItem(p.pair, livePrice[p.pair] || 0, prevPrice[p.pair], p.decimals)
    ).join("");
    tickerTrack.innerHTML = html + html; // duplicate for seamless CSS loop
  }

  // Apply subtle jitter every 3 s to simulate live movement between API refreshes
  function tickerJitter() {
    if (!tickerTrack) return;
    const items = tickerTrack.querySelectorAll(".ticker-item");
    const half  = items.length / 2;
    PAIRS.forEach((p, i) => {
      const prev = livePrice[p.pair];
      const pct  = 0.00015; // 0.015 % max swing per tick
      const next = parseFloat((prev * (1 + (Math.random() * pct * 2 - pct))).toFixed(p.decimals));
      const up   = next >= prev;
      const diff = Math.abs(next - prev).toFixed(p.decimals);
      livePrice[p.pair] = next;
      [items[i], items[i + half]].forEach((el) => {
        if (!el) return;
        el.querySelector(".price").textContent = next.toFixed(p.decimals);
        const ch = el.querySelector(".change");
        ch.textContent = `${up ? "▲" : "▼"} ${diff}`;
        ch.className   = `change ${up ? "up" : "down"}`;
      });
    });
  }

  // Fetch live rates immediately and refresh every 10 minutes
  fetchRates();
  setInterval(fetchRates, 10 * 60 * 1000);
  // Animate every 3 seconds
  setInterval(tickerJitter, 3000);

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

  /* ============================================================
     TRADES — Community Slideshow + Featured Grid
     ============================================================ */
  if (typeof window.supabase !== "undefined" && typeof SUPABASE_URL !== "undefined") {
    const { createClient } = window.supabase;
    const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    function getPublicUrl(path) {
      return db.storage.from("trades").getPublicUrl(path).data.publicUrl;
    }

    function escStr(str) {
      const d = document.createElement("div");
      d.appendChild(document.createTextNode(str || ""));
      return d.innerHTML;
    }

    // ── Lightbox ──────────────────────────────────────────────
    window.openTradeImage = function (url) {
      document.getElementById("lightbox-img").src = url;
      document.getElementById("lightbox").style.display = "flex";
    };
    function closeLightbox() { document.getElementById("lightbox").style.display = "none"; }
    document.getElementById("lightbox-close").addEventListener("click",   closeLightbox);
    document.getElementById("lightbox-overlay").addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

    // ── Community Trades Slideshow ────────────────────────────
    async function loadCommunityTrades() {
      const loadingEl = document.getElementById("community-loading");
      const emptyEl   = document.getElementById("community-empty");
      const wrap      = document.getElementById("community-slideshow");

      const { data, error } = await db
        .from("community_trades")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (loadingEl) loadingEl.style.display = "none";

      if (error || !data || !data.length) {
        if (emptyEl) emptyEl.style.display = "flex";
        return;
      }

      const track = document.getElementById("community-track");
      track.innerHTML = data.map((t) => `
        <div class="slide">
          <div class="slide-img" onclick="openTradeImage('${getPublicUrl(t.image_path)}')">
            <img src="${getPublicUrl(t.image_path)}" alt="${escStr(t.uploader_name)} trade" loading="lazy" />
            <div class="slide-expand"><i class="fas fa-expand-alt"></i></div>
          </div>
          <div class="slide-info">
            <div>
              <p class="slide-name"><i class="fas fa-user"></i> ${escStr(t.uploader_name)}</p>
              ${t.caption ? `<p class="slide-caption">${escStr(t.caption)}</p>` : ""}
            </div>
            <span class="slide-badge"><i class="fas fa-check"></i> Verified</span>
          </div>
        </div>
      `).join("");

      if (wrap) wrap.style.display = "block";
      buildSlideshow(data.length);
    }

    // ── Slideshow Engine ──────────────────────────────────────
    function buildSlideshow(count) {
      const track = document.getElementById("community-track");
      const dots  = document.getElementById("community-dots");
      const prev  = document.getElementById("community-prev");
      const next  = document.getElementById("community-next");
      const wrap  = document.getElementById("community-slideshow");

      if (count <= 1) {
        if (prev) prev.style.display = "none";
        if (next) next.style.display = "none";
        return;
      }

      let current = 0;
      let timer;

      for (let i = 0; i < count; i++) {
        const dot = document.createElement("button");
        dot.className = "dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Slide ${i + 1}`);
        dot.addEventListener("click", () => { goTo(i); resetTimer(); });
        dots.appendChild(dot);
      }

      function goTo(idx) {
        current = ((idx % count) + count) % count;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === current));
      }

      function startTimer() { timer = setInterval(() => goTo(current + 1), 5000); }
      function resetTimer()  { clearInterval(timer); startTimer(); }

      prev.addEventListener("click", () => { goTo(current - 1); resetTimer(); });
      next.addEventListener("click", () => { goTo(current + 1); resetTimer(); });
      wrap.addEventListener("mouseenter", () => clearInterval(timer));
      wrap.addEventListener("mouseleave",  startTimer);

      // Touch / swipe
      let touchStartX = 0;
      wrap.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
      wrap.addEventListener("touchend",   (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { goTo(current + (diff > 0 ? 1 : -1)); resetTimer(); }
      });

      goTo(0);
      startTimer();
    }

    // ── Featured Trades Grid ──────────────────────────────────
    async function loadFeaturedTrades() {
      const loadingEl = document.getElementById("featured-loading");
      const emptyEl   = document.getElementById("featured-empty");
      const grid      = document.getElementById("featured-trades-grid");

      const { data, error } = await db
        .from("featured_trades")
        .select("*")
        .order("display_order", { ascending: false });

      if (loadingEl) loadingEl.style.display = "none";

      if (error || !data || !data.length) {
        if (emptyEl) emptyEl.style.display = "flex";
        return;
      }

      grid.innerHTML = data.map((t) => {
        const url = getPublicUrl(t.image_path);
        return `
          <div class="trade-card" onclick="openTradeImage('${url}')">
            <div class="trade-card-img">
              <img src="${url}" alt="${escStr(t.title)}" loading="lazy" />
              <div class="trade-card-overlay"><i class="fas fa-expand-alt"></i></div>
            </div>
            <div class="trade-card-body">
              <h3 class="trade-card-title">${escStr(t.title)}</h3>
              ${t.description ? `<p class="trade-card-desc">${escStr(t.description)}</p>` : ""}
            </div>
          </div>`;
      }).join("");

      if (grid) grid.style.display = "grid";
    }

    // ── Weekly Signal Performance ─────────────────────────────
    async function loadWeeklyStats() {
      const now = new Date();
      const day = now.getDay();
      const daysFromMon = (day === 0 ? 6 : day - 1);
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysFromMon);
      monday.setHours(0, 0, 0, 0);

      const { data } = await db
        .from("signals")
        .select("status")
        .gte("created_at", monday.toISOString());

      const wins   = (data || []).filter((s) => s.status === "tp_hit").length;
      const losses = (data || []).filter((s) => s.status === "sl_hit").length;

      const wEl = document.getElementById("week-wins-home");
      const lEl = document.getElementById("week-losses-home");
      if (wEl) wEl.textContent = wins;
      if (lEl) lEl.textContent = losses;

      const bar = document.getElementById("weekly-perf-bar");
      if (bar) bar.style.display = "flex";
    }

    loadCommunityTrades();
    loadFeaturedTrades();
    loadWeeklyStats();
  }

});
