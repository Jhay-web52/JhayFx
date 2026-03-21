"use strict";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ══════════════════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════════════════ */
const loginScreen = document.getElementById("login-screen");
const dashboard   = document.getElementById("dashboard");

document.getElementById("toggle-pw").addEventListener("click", () => {
  const pw   = document.getElementById("login-password");
  const icon = document.querySelector("#toggle-pw i");
  pw.type    = pw.type === "password" ? "text" : "password";
  icon.className = pw.type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn    = document.getElementById("login-btn");
  const status = document.getElementById("login-status");
  btn.disabled     = true;
  btn.textContent  = "Signing in\u2026";
  status.textContent = "";

  const { error } = await db.auth.signInWithPassword({
    email:    document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-password").value,
  });

  if (error) {
    status.textContent = error.message;
    status.className   = "form-status error";
    btn.disabled       = false;
    btn.textContent    = "Sign In";
  }
  // success handled by onAuthStateChange
});

document.getElementById("signout-btn").addEventListener("click", () => db.auth.signOut());

db.auth.onAuthStateChange((_event, session) => {
  if (session) {
    loginScreen.style.display = "none";
    dashboard.style.display   = "flex";
    loadPending();
  } else {
    loginScreen.style.display = "flex";
    dashboard.style.display   = "none";
    const btn = document.getElementById("login-btn");
    btn.disabled    = false;
    btn.textContent = "Sign In";
  }
});

/* ══════════════════════════════════════════════════════════════════════
   TAB NAVIGATION
══════════════════════════════════════════════════════════════════════ */
document.querySelectorAll(".sidebar-btn[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".sidebar-btn[data-tab]").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".admin-tab").forEach((t) => (t.style.display = "none"));
    btn.classList.add("active");
    document.getElementById(`tab-${tab}`).style.display = "block";
    if (tab === "pending")  loadPending();
    if (tab === "approved") loadApproved();
    if (tab === "featured") loadFeatured();
    if (tab === "signals")  loadSignals();
  });
});

document.getElementById("refresh-pending").addEventListener("click",  loadPending);
document.getElementById("refresh-approved").addEventListener("click", loadApproved);
document.getElementById("refresh-featured").addEventListener("click", loadFeatured);
document.getElementById("refresh-signals").addEventListener("click",  loadSignals);

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════ */
function getPublicUrl(path) {
  return db.storage.from("trades").getPublicUrl(path).data.publicUrl;
}

function fmtDate(str) {
  return new Date(str).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function esc(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str || ""));
  return d.innerHTML;
}

/* ══════════════════════════════════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════════════════════════════════ */
window.openLightbox = function (url) {
  document.getElementById("lightbox-img").src = url;
  document.getElementById("lightbox").style.display = "flex";
};

function closeLightbox() { document.getElementById("lightbox").style.display = "none"; }
document.getElementById("lightbox-close").addEventListener("click",   closeLightbox);
document.getElementById("lightbox-overlay").addEventListener("click", closeLightbox);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

/* ══════════════════════════════════════════════════════════════════════
   PENDING SUBMISSIONS
══════════════════════════════════════════════════════════════════════ */
async function loadPending() {
  const grid = document.getElementById("pending-grid");
  grid.innerHTML = loadingHTML();

  const { data, error } = await db
    .from("community_trades")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) { grid.innerHTML = errorHTML(error.message); return; }

  document.getElementById("pending-badge").textContent = data.length;

  if (!data.length) {
    grid.innerHTML = emptyHTML("fas fa-inbox", "No pending submissions.");
    return;
  }
  grid.innerHTML = data.map((t) => tradeCard(t, "pending")).join("");
}

/* ══════════════════════════════════════════════════════════════════════
   APPROVED TRADES
══════════════════════════════════════════════════════════════════════ */
async function loadApproved() {
  const grid = document.getElementById("approved-grid");
  grid.innerHTML = loadingHTML();

  const { data, error } = await db
    .from("community_trades")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) { grid.innerHTML = errorHTML(error.message); return; }

  if (!data.length) {
    grid.innerHTML = emptyHTML("fas fa-images", "No approved trades yet.");
    return;
  }
  grid.innerHTML = data.map((t) => tradeCard(t, "approved")).join("");
}

/* ── Card builder ─────────────────────────────────────────────────── */
function tradeCard(t, mode) {
  const url = getPublicUrl(t.image_path);

  const actions = mode === "pending"
    ? `<button class="action-btn approve-btn" onclick="setTradeStatus('${t.id}','approved')">
         <i class="fas fa-check"></i> Approve
       </button>
       <button class="action-btn reject-btn" onclick="setTradeStatus('${t.id}','rejected')">
         <i class="fas fa-times"></i> Reject
       </button>`
    : `<button class="action-btn reject-btn" onclick="setTradeStatus('${t.id}','rejected')">
         <i class="fas fa-ban"></i> Revoke
       </button>
       <button class="action-btn delete-btn" onclick="deleteCommunity('${t.id}','${encodeURIComponent(t.image_path)}')">
         <i class="fas fa-trash"></i> Delete
       </button>`;

  return `
    <div class="admin-card" id="card-${t.id}">
      <div class="admin-card-img" onclick="openLightbox('${url}')">
        <img src="${url}" alt="Trade screenshot" loading="lazy" />
        <span class="zoom-hint"><i class="fas fa-search-plus"></i></span>
      </div>
      <div class="admin-card-body">
        <p class="admin-card-name"><i class="fas fa-user"></i> ${esc(t.uploader_name)}</p>
        ${t.caption ? `<p class="admin-card-caption">${esc(t.caption)}</p>` : ""}
        <p class="admin-card-date"><i class="fas fa-clock"></i> ${fmtDate(t.created_at)}</p>
        <div class="admin-card-actions">${actions}</div>
      </div>
    </div>`;
}

/* ── Status update ────────────────────────────────────────────────── */
window.setTradeStatus = async function (id, status) {
  const card = document.getElementById(`card-${id}`);
  card.querySelectorAll(".action-btn").forEach((b) => (b.disabled = true));

  const { error } = await db.from("community_trades").update({ status }).eq("id", id);

  if (error) {
    alert("Error: " + error.message);
    card.querySelectorAll(".action-btn").forEach((b) => (b.disabled = false));
    return;
  }

  card.style.transition = "opacity 0.3s, transform 0.3s";
  card.style.opacity    = "0";
  card.style.transform  = "scale(0.95)";
  setTimeout(() => {
    card.remove();
    document.getElementById("pending-badge").textContent =
      document.querySelectorAll("#pending-grid .admin-card").length;
  }, 320);
};

/* ── Delete community trade ───────────────────────────────────────── */
window.deleteCommunity = async function (id, encodedPath) {
  if (!confirm("Delete this trade permanently? This cannot be undone.")) return;
  const imagePath = decodeURIComponent(encodedPath);
  await db.storage.from("trades").remove([imagePath]);
  const { error } = await db.from("community_trades").delete().eq("id", id);
  if (error) { alert("Error: " + error.message); return; }
  const card = document.getElementById(`card-${id}`);
  card.style.opacity = "0";
  setTimeout(() => card.remove(), 320);
};

/* ══════════════════════════════════════════════════════════════════════
   FEATURED TRADES — UPLOAD
══════════════════════════════════════════════════════════════════════ */
let featFile = null;

const featDropZone   = document.getElementById("feat-drop-zone");
const featFileInput  = document.getElementById("feat-screenshot");
const featDropInner  = document.getElementById("feat-drop-inner");
const featPreview    = document.getElementById("feat-file-preview");
const featPreviewImg = document.getElementById("feat-preview-img");
const featRemoveBtn  = document.getElementById("feat-remove");

featDropZone.addEventListener("click", (e) => {
  if (!featRemoveBtn.contains(e.target)) featFileInput.click();
});
featDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  featDropZone.classList.add("dragging");
});
featDropZone.addEventListener("dragleave", () => featDropZone.classList.remove("dragging"));
featDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  featDropZone.classList.remove("dragging");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) handleFeatFile(file);
});
featFileInput.addEventListener("change", () => {
  if (featFileInput.files[0]) handleFeatFile(featFileInput.files[0]);
});

function handleFeatFile(file) {
  if (file.size > 15 * 1024 * 1024) { alert("File too large — max 15 MB."); return; }
  featFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    featPreviewImg.src = e.target.result;
    featDropInner.style.display = "none";
    featPreview.style.display   = "flex";
  };
  reader.readAsDataURL(file);
}

featRemoveBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  featFile = null;
  featFileInput.value = "";
  featPreviewImg.src  = "";
  featPreview.style.display  = "none";
  featDropInner.style.display = "flex";
});

document.getElementById("featured-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn   = document.getElementById("feat-submit-btn");
  const title = document.getElementById("feat-title").value.trim();
  const desc  = document.getElementById("feat-desc").value.trim();

  if (!title)    { setFeatStatus("Title is required.", "error"); return; }
  if (!featFile) { setFeatStatus("Please select a screenshot.", "error"); return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading\u2026';
  setFeatStatus("", "");

  try {
    const ext  = featFile.name.split(".").pop().toLowerCase();
    const path = `featured/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await db.storage
      .from("trades")
      .upload(path, featFile, { cacheControl: "3600", upsert: false });
    if (upErr) throw upErr;

    const { error: dbErr } = await db.from("featured_trades").insert({
      title,
      description:   desc || null,
      image_path:    path,
      display_order: Date.now(),
    });
    if (dbErr) throw dbErr;

    setFeatStatus("Trade posted successfully!", "success");
    document.getElementById("feat-title").value = "";
    document.getElementById("feat-desc").value  = "";
    featRemoveBtn.click();
    loadFeatured();
  } catch (err) {
    setFeatStatus("Error: " + err.message, "error");
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="fas fa-plus"></i> Post Trade';
  }
});

function setFeatStatus(msg, type) {
  const el = document.getElementById("featured-status");
  el.textContent = msg;
  el.className   = "form-status" + (type ? " " + type : "");
}

/* ══════════════════════════════════════════════════════════════════════
   FEATURED TRADES — LIST
══════════════════════════════════════════════════════════════════════ */
async function loadFeatured() {
  const grid = document.getElementById("featured-grid");
  grid.innerHTML = loadingHTML();

  const { data, error } = await db
    .from("featured_trades")
    .select("*")
    .order("display_order", { ascending: false });

  if (error) { grid.innerHTML = errorHTML(error.message); return; }

  if (!data.length) {
    grid.innerHTML = emptyHTML("fas fa-star", "No featured trades posted yet.");
    return;
  }

  grid.innerHTML = data.map((t) => {
    const url = getPublicUrl(t.image_path);
    return `
      <div class="admin-card" id="feat-card-${t.id}">
        <div class="admin-card-img" onclick="openLightbox('${url}')">
          <img src="${url}" alt="Featured trade" loading="lazy" />
          <span class="zoom-hint"><i class="fas fa-search-plus"></i></span>
        </div>
        <div class="admin-card-body">
          <p class="admin-card-name"><i class="fas fa-star"></i> ${esc(t.title)}</p>
          ${t.description ? `<p class="admin-card-caption">${esc(t.description)}</p>` : ""}
          <p class="admin-card-date"><i class="fas fa-clock"></i> ${fmtDate(t.created_at)}</p>
          <div class="admin-card-actions">
            <button class="action-btn delete-btn"
              onclick="deleteFeatured('${t.id}','${encodeURIComponent(t.image_path)}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>`;
  }).join("");
}

window.deleteFeatured = async function (id, encodedPath) {
  if (!confirm("Delete this featured trade permanently?")) return;
  const imagePath = decodeURIComponent(encodedPath);
  await db.storage.from("trades").remove([imagePath]);
  const { error } = await db.from("featured_trades").delete().eq("id", id);
  if (error) { alert("Error: " + error.message); return; }
  const card = document.getElementById(`feat-card-${id}`);
  card.style.opacity = "0";
  setTimeout(() => card.remove(), 320);
};

/* ══════════════════════════════════════════════════════════════════════
   SIGNALS
══════════════════════════════════════════════════════════════════════ */
let selectedDirection = "BUY";

document.getElementById("dir-buy").addEventListener("click", () => {
  selectedDirection = "BUY";
  document.getElementById("dir-buy").classList.add("active");
  document.getElementById("dir-sell").classList.remove("active");
});
document.getElementById("dir-sell").addEventListener("click", () => {
  selectedDirection = "SELL";
  document.getElementById("dir-sell").classList.add("active");
  document.getElementById("dir-buy").classList.remove("active");
});

document.getElementById("signal-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn  = document.getElementById("sig-submit-btn");
  const pair  = document.getElementById("sig-pair").value.trim().toUpperCase();
  const entry = document.getElementById("sig-entry").value.trim();
  const sl    = document.getElementById("sig-sl").value.trim();
  const tp1   = document.getElementById("sig-tp1").value.trim();
  const tp2   = document.getElementById("sig-tp2").value.trim();
  const note  = document.getElementById("sig-note").value.trim();

  // Combine non-empty TPs into one comma-separated string
  const tp = [tp1, tp2].filter(Boolean).join(", ");

  if (!pair || !entry || !sl || !tp1) {
    setSigStatus("Please fill in all required fields.", "error");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting\u2026';
  setSigStatus("", "");

  const { error } = await db.from("signals").insert({
    pair,
    direction:   selectedDirection,
    entry,
    stop_loss:   sl,
    take_profit: tp,
    note:        note || null,
    status:      "active",
  });

  if (error) {
    setSigStatus("Error: " + error.message, "error");
  } else {
    setSigStatus("Signal posted!", "success");
    // Push notification to all subscribers
    db.functions.invoke("send-push", {
      body: {
        title: `📊 New Signal: ${pair} ${selectedDirection}`,
        message: `Entry: ${entry} | SL: ${sl} | TP: ${tp1}${tp2 ? " / " + tp2 : ""}${note ? " — " + note : ""}`,
        url: "signals.html",
      },
    }).catch(() => {});
    document.getElementById("signal-form").reset();
    ["sig-tp1","sig-tp2"].forEach((id) => { document.getElementById(id).value = ""; });
    selectedDirection = "BUY";
    document.getElementById("dir-buy").classList.add("active");
    document.getElementById("dir-sell").classList.remove("active");
    loadSignals();
  }

  btn.disabled  = false;
  btn.innerHTML = '<i class="fas fa-broadcast-tower"></i> Post Signal';
});

function setSigStatus(msg, type) {
  const el = document.getElementById("signal-status");
  el.textContent = msg;
  el.className   = "form-status" + (type ? " " + type : "");
}

async function loadSignals() {
  const list = document.getElementById("admin-signals-list");
  list.innerHTML = loadingHTML();

  const { data, error } = await db
    .from("signals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { list.innerHTML = errorHTML(error.message); return; }

  if (!data.length) {
    list.innerHTML = emptyHTML("fas fa-broadcast-tower", "No signals posted yet.");
    return;
  }

  const statusLabels = { active: "Active", tp_hit: "TP Hit", sl_hit: "SL Hit", closed: "Closed" };

  list.innerHTML = data.map((s) => `
    <div class="admin-signal-row" id="sig-row-${s.id}">
      <div class="admin-signal-info">
        <span class="signal-pair">${esc(s.pair)}</span>
        <span class="signal-direction ${s.direction === "BUY" ? "dir-buy" : "dir-sell"}">
          <i class="fas fa-arrow-${s.direction === "BUY" ? "up" : "down"}"></i> ${s.direction}
        </span>
        <span class="admin-sig-levels">
          E: ${esc(s.entry)} &nbsp;|&nbsp; SL: ${esc(s.stop_loss)} &nbsp;|&nbsp; TP: ${esc(s.take_profit)}
        </span>
        ${s.note ? `<span class="admin-sig-note">${esc(s.note)}</span>` : ""}
      </div>
      <div class="admin-signal-actions">
        ${s.status === "active" ? `
          <button class="action-btn approve-btn" onclick="updateSignal('${s.id}','tp_hit')">TP Hit</button>
          <button class="action-btn reject-btn"  onclick="updateSignal('${s.id}','sl_hit')">SL Hit</button>
          <button class="action-btn"             onclick="updateSignal('${s.id}','closed')" style="background:rgba(255,255,255,0.05);color:var(--text-secondary);border:1px solid var(--border-color)">Close</button>
        ` : `<span class="admin-sig-status-badge">${statusLabels[s.status] || s.status}</span>`}
        <button class="action-btn delete-btn" onclick="deleteSignal('${s.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join("");
}

window.updateSignal = async function (id, status) {
  const { error } = await db.from("signals").update({ status }).eq("id", id);
  if (error) { alert("Error: " + error.message); return; }
  loadSignals();
};

window.deleteSignal = async function (id) {
  if (!confirm("Delete this signal?")) return;
  const { error } = await db.from("signals").delete().eq("id", id);
  if (error) { alert("Error: " + error.message); return; }
  const row = document.getElementById(`sig-row-${id}`);
  row.style.opacity = "0";
  setTimeout(() => row.remove(), 320);
};

/* ══════════════════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════════════════ */
function loadingHTML() {
  return '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Loading\u2026</div>';
}
function errorHTML(msg) {
  return `<div class="admin-error"><i class="fas fa-exclamation-triangle"></i> ${esc(msg)}</div>`;
}
function emptyHTML(icon, text) {
  return `<div class="admin-empty"><i class="${icon}"></i><p>${text}</p></div>`;
}
