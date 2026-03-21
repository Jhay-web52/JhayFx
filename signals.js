"use strict";

/* ── Service Worker ─────────────────────────────────────── */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
}

/* ── OneSignal init ─────────────────────────────────────── */
if (typeof ONESIGNAL_APP_ID !== "undefined" && ONESIGNAL_APP_ID) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(function (OneSignal) {
    OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: "sw.js",
      serviceWorkerParam: { scope: "./" },
    });
    // Bell button
    const bellBtn = document.getElementById("push-bell-btn");
    if (bellBtn) {
      bellBtn.addEventListener("click", () => {
        OneSignal.Slidedown.promptPush();
      });
      OneSignal.User.PushSubscription.addEventListener("change", (e) => {
        if (e.current.optedIn) {
          bellBtn.innerHTML = '<i class="fas fa-bell"></i> Alerts On';
          bellBtn.classList.add("bell-on");
        }
      });
    }
  });
}

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allSignals = [];

/* ── Load signals ─────────────────────────────────────────────────── */
async function loadSignals() {
  const { data, error } = await db
    .from("signals")
    .select("*")
    .order("created_at", { ascending: false });

  document.getElementById("signals-loading").style.display = "none";

  if (error || !data || !data.length) {
    document.getElementById("signals-empty").style.display = "flex";
    return;
  }

  allSignals = data;
  renderSignals("all");
  document.getElementById("signals-cta").style.display = "flex";
}

/* ── Render ───────────────────────────────────────────────────────── */
function renderSignals(filter) {
  const grid = document.getElementById("signals-grid");
  const filtered = filter === "all"
    ? allSignals
    : allSignals.filter((s) => s.status === filter);

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="signals-no-result">
        <i class="fas fa-filter"></i>
        <p>No ${filter.replace("_", " ")} signals.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((s) => signalCard(s)).join("");
}

/* ── Signal card ──────────────────────────────────────────────────── */
function signalCard(s) {
  const isBuy      = s.direction === "BUY";
  const statusMap  = {
    active: { label: "Active",  cls: "status-active" },
    tp_hit: { label: "TP Hit",  cls: "status-tp"     },
    sl_hit: { label: "SL Hit",  cls: "status-sl"     },
    closed: { label: "Closed",  cls: "status-closed" },
  };
  const { label, cls } = statusMap[s.status] || statusMap.closed;
  const timeAgo = getTimeAgo(s.created_at);

  return `
    <div class="signal-card ${isBuy ? "buy" : "sell"} ${s.status === "active" ? "signal-active" : ""}">
      <div class="signal-card-header">
        <div class="signal-pair-wrap">
          <span class="signal-pair">${esc(s.pair)}</span>
          <span class="signal-direction ${isBuy ? "dir-buy" : "dir-sell"}">
            <i class="fas fa-arrow-${isBuy ? "up" : "down"}"></i> ${s.direction}
          </span>
        </div>
        <span class="signal-status ${cls}">
          ${s.status === "active" ? '<span class="pulse-dot"></span>' : ""}
          ${label}
        </span>
      </div>

      <div class="signal-levels">
        <div class="signal-level">
          <span class="level-label">Entry</span>
          <span class="level-value">${esc(s.entry)}</span>
        </div>
        <div class="signal-level">
          <span class="level-label">Stop Loss</span>
          <span class="level-value sl-value">${esc(s.stop_loss)}</span>
        </div>
        ${buildTpLevels(s.take_profit)}
      </div>

      ${s.note ? `<p class="signal-note"><i class="fas fa-comment-alt"></i> ${esc(s.note)}</p>` : ""}

      <p class="signal-time"><i class="fas fa-clock"></i> ${timeAgo}</p>
    </div>`;
}

/* ── Filter buttons ───────────────────────────────────────────────── */
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderSignals(btn.dataset.filter);
  });
});

/* ── TP levels builder ────────────────────────────────────────────── */
function buildTpLevels(tpStr) {
  const tps = (tpStr || "").split(",").map((t) => t.trim()).filter(Boolean);
  return tps.map((val, i) => `
    <div class="signal-level">
      <span class="level-label">TP ${tps.length > 1 ? i + 1 : ""}</span>
      <span class="level-value tp-value">${esc(val)}</span>
    </div>`).join("");
}

/* ── Helpers ──────────────────────────────────────────────────────── */
function esc(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str || ""));
  return d.innerHTML;
}

function getTimeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ── Weekly performance ───────────────────────────────────── */
async function loadWeeklySignalStats() {
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

  const wEl = document.getElementById("sig-week-wins");
  const lEl = document.getElementById("sig-week-losses");
  if (wEl) wEl.textContent = wins;
  if (lEl) lEl.textContent = losses;

  const bar = document.getElementById("signals-week-perf");
  if (bar) bar.style.display = "flex";
}

loadSignals();
loadWeeklySignalStats();
loadPerformanceChart();

/* ── Signal Performance Chart ─────────────────────────────── */
async function loadPerformanceChart() {
  if (typeof Chart === "undefined") return;

  // Fetch last 8 weeks of closed signals
  const since = new Date();
  since.setDate(since.getDate() - 56);

  const { data } = await db
    .from("signals")
    .select("status, created_at")
    .in("status", ["tp_hit", "sl_hit"])
    .gte("created_at", since.toISOString());

  if (!data || !data.length) return;

  // Group by week (Monday start)
  const weekMap = {};
  data.forEach((s) => {
    const d = new Date(s.created_at);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const mon = new Date(d);
    mon.setDate(d.getDate() - diff);
    mon.setHours(0, 0, 0, 0);
    const key = mon.toISOString().slice(0, 10);
    if (!weekMap[key]) weekMap[key] = { wins: 0, losses: 0 };
    if (s.status === "tp_hit") weekMap[key].wins++;
    else weekMap[key].losses++;
  });

  const weeks  = Object.keys(weekMap).sort();
  if (!weeks.length) return;

  const labels  = weeks.map((w) => {
    const d = new Date(w);
    return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  });
  const wins    = weeks.map((w) => weekMap[w].wins);
  const losses  = weeks.map((w) => weekMap[w].losses);

  const section = document.getElementById("perf-chart-section");
  if (section) section.style.display = "block";

  const ctx = document.getElementById("perf-chart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Wins (TP Hit)",
          data: wins,
          backgroundColor: "rgba(0, 212, 160, 0.65)",
          borderColor: "rgba(0, 212, 160, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Losses (SL Hit)",
          data: losses,
          backgroundColor: "rgba(255, 82, 82, 0.65)",
          borderColor: "rgba(255, 82, 82, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: "#a0aec0", font: { size: 12 }, boxWidth: 12 },
        },
        tooltip: {
          backgroundColor: "#232340",
          titleColor: "#ffffff",
          bodyColor: "#a0aec0",
          borderColor: "rgba(255,255,255,0.07)",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: { color: "#a0aec0", font: { size: 11 } },
          grid:  { color: "rgba(255,255,255,0.04)" },
        },
        y: {
          ticks: { color: "#a0aec0", stepSize: 1, font: { size: 11 } },
          grid:  { color: "rgba(255,255,255,0.04)" },
          min: 0,
        },
      },
    },
  });
}
