"use strict";

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

loadSignals();
