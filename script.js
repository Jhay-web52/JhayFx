document.addEventListener("DOMContentLoaded", () => {
  // ── Dynamic footer year ──────────────────────────────────────
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Hamburger menu ───────────────────────────────────────────
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const mobileNav = document.getElementById("mobile-nav");

  if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("open");
      hamburgerBtn.classList.toggle("open");
      hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // ── Smooth scroll + close mobile nav on link click ───────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
        if (mobileNav) mobileNav.classList.remove("open");
        if (hamburgerBtn) {
          hamburgerBtn.classList.remove("open");
          hamburgerBtn.setAttribute("aria-expanded", "false");
        }
      }
    });
  });

  // ── Scroll reveal with stagger for grid children ─────────────
  const revealEls = document.querySelectorAll(".reveal");

  // Add stagger delays for cards inside grid containers
  document
    .querySelectorAll(".services-grid, .pricing-grid, .brokers-grid, .stats-grid")
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
    { threshold: 0.1 }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  // ── Counter animation for stats ──────────────────────────────
  const counters = document.querySelectorAll(".stat-number");

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const suffix = el.dataset.suffix || "";
          const duration = 1800;
          const startTime = performance.now();

          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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

  // ── Active nav highlight on scroll ───────────────────────────
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === "#" + entry.target.id) {
              link.classList.add("active");
            }
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((section) => navObserver.observe(section));
});
