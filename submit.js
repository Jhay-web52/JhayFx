"use strict";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form        = document.getElementById("trade-submit-form");
const submitBtn   = document.getElementById("submit-btn");
const statusEl    = document.getElementById("form-status");
const dropZone    = document.getElementById("drop-zone");
const fileInput   = document.getElementById("screenshot");
const dropInner   = document.getElementById("drop-zone-inner");
const filePreview = document.getElementById("file-preview");
const previewImg  = document.getElementById("preview-img");
const removeBtn   = document.getElementById("remove-file");

let selectedFile = null;

/* ── Drop Zone ─────────────────────────────────────────────────────── */
dropZone.addEventListener("click", (e) => {
  if (!removeBtn.contains(e.target)) fileInput.click();
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragging");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragging");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) handleFile(file);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    setStatus("File too large — max 10 MB.", "error");
    return;
  }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    dropInner.style.display = "none";
    filePreview.style.display = "flex";
  };
  reader.readAsDataURL(file);
}

removeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  selectedFile = null;
  fileInput.value = "";
  previewImg.src = "";
  filePreview.style.display = "none";
  dropInner.style.display = "flex";
});

/* ── Form Submit ────────────────────────────────────────────────────── */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name    = document.getElementById("uploader-name").value.trim();
  const caption = document.getElementById("caption").value.trim();

  if (!name)         { setStatus("Please enter your name.", "error"); return; }
  if (!selectedFile) { setStatus("Please select a screenshot.", "error"); return; }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading\u2026';
  setStatus("", "");

  try {
    const ext      = selectedFile.name.split(".").pop().toLowerCase();
    const filename = `community/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadErr } = await db.storage
      .from("trades")
      .upload(filename, selectedFile, { cacheControl: "3600", upsert: false });
    if (uploadErr) throw uploadErr;

    const { error: dbErr } = await db.from("community_trades").insert({
      uploader_name: name,
      caption:       caption || null,
      image_path:    filename,
      status:        "pending",
    });
    if (dbErr) throw dbErr;

    // Notify admin via Supabase Edge Function (token stored server-side, never in code)
    db.functions.invoke("notify-telegram", { body: { name, caption: caption || "" } }).catch(() => {});

    form.style.display = "none";
    document.getElementById("success-state").style.display = "block";
  } catch (err) {
    console.error(err);
    setStatus("Upload failed — please try again.", "error");
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Trade';
  }
});

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className   = "form-status" + (type ? " " + type : "");
}
