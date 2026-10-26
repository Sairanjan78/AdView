/* ============================================================
   app.js – AdView Frontend Logic (Enhanced)
   ============================================================ */

let mode = "login";
let cfg;
let nonce;
let slot;
let granted = false;
let user;
let demoTimer;

const $ = (id) => document.getElementById(id);

// ─── API HELPER ────────────────────────────────────────────
async function api(url, body) {
  const isGet = body === undefined && (url === "/api/me" || url === "/api/config");
  const response = await fetch(url, {
    method: isGet ? "GET" : "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: isGet ? undefined : JSON.stringify(body || {})
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── TOAST NOTIFICATIONS ────────────────────────────────────
function showToast(message, type = "info", duration = 4000) {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const container = $("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span style="font-size:1rem">${icons[type]}</span> ${message}`;
  container.append(toast);
  setTimeout(() => {
    toast.style.animation = "toastOut 0.35s ease both";
    toast.addEventListener("animationend", () => toast.remove());
  }, duration);
}

// ─── STATUS MESSAGES ────────────────────────────────────────
function setStatus(text, type = "") {
  const el = $("status");
  el.textContent = text;
  el.className = type ? `status-${type}` : "";
}

function setAuthMsg(text, type = "") {
  const el = $("authmsg");
  el.textContent = text;
  el.className = type;
}

// ─── LOADING STATE ───────────────────────────────────────────
function setLoading(buttonEl, loading, text = "") {
  if (loading) {
    buttonEl.dataset.originalText = buttonEl.innerHTML;
    buttonEl.innerHTML = `<span class="spinner"></span>${text || "Loading…"}`;
    buttonEl.disabled = true;
  } else {
    buttonEl.innerHTML = buttonEl.dataset.originalText || text;
    buttonEl.disabled = false;
  }
}

// ─── OVERLAY ─────────────────────────────────────────────────
function showOverlay(show) {
  $("ad-overlay").classList.toggle("hidden", !show);
  document.body.style.overflow = show ? "hidden" : "";
}

function resetAdUi() {
  granted = false;
  $("watch").disabled = false;
  $("ad-complete").hidden = true;
  $("ad-bar").style.width = "0%";
  $("ad-stage-icon").textContent = "📺";
  if (demoTimer) {
    clearInterval(demoTimer);
    demoTimer = null;
  }
}

function endAdSession() {
  nonce = null;
  slot = null;
  showOverlay(false);
  resetAdUi();
}

// ─── AUTH TABS ───────────────────────────────────────────────
document.querySelectorAll("[data-mode]").forEach((button) => {
  button.onclick = () => {
    mode = button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-selected", item === button ? "true" : "false");
    });
    $("submit").textContent = mode === "login" ? "Sign in" : "Create account";
    $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
    setAuthMsg("");
  };
});

// ─── FORM SUBMIT ─────────────────────────────────────────────
$("form").onsubmit = async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const email = form.get("email");
  const password = form.get("password");

  if (!email || !password) {
    setAuthMsg("Please enter your email and password.", "error");
    return;
  }

  const btn = $("submit");
  setLoading(btn, true, mode === "login" ? "Signing in…" : "Creating account…");
  setAuthMsg("");

  try {
    await api("/api/" + mode, { email, password });
    setAuthMsg("");
    showToast(mode === "login" ? "Welcome back!" : "Account created successfully!", "success");
    await load();
  } catch (error) {
    setAuthMsg(error.message, "error");
    showToast(error.message, "error");
  } finally {
    setLoading(btn, false, mode === "login" ? "Sign in" : "Create account");
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────
$("logout").onclick = async () => {
  try {
    await api("/api/logout");
  } catch {
    /* already signed out */
  }
  $("dash").classList.add("hidden");
  $("auth").classList.remove("hidden");
  $("logout").hidden = true;
  $("balance").textContent = "0 points";
  user = null;
  showToast("You have been signed out.", "info");
};

// ─── LOAD CURRENT USER ────────────────────────────────────────
async function load() {
  cfg = await api("/api/config");
  try {
    const data = await api("/api/me");
    user = data.user;
    $("auth").classList.add("hidden");
    $("dash").classList.remove("hidden");
    $("logout").hidden = false;
    render(data);
  } catch {
    $("dash").classList.add("hidden");
    $("auth").classList.remove("hidden");
    $("logout").hidden = true;
  }
}

// ─── RENDER DASHBOARD ─────────────────────────────────────────
function render(data) {
  user = data.user;

  // Points with animated pulse
  const pts = $("points");
  const oldVal = parseInt(pts.textContent || "0");
  pts.textContent = user.points;
  if (user.points !== oldVal) {
    const bal = $("balance");
    bal.textContent = user.points + " points";
    bal.classList.remove("pulse");
    void bal.offsetWidth; // force reflow
    bal.classList.add("pulse");
  } else {
    $("balance").textContent = user.points + " points";
  }

  $("welcome").textContent = "Signed in as " + user.email;

  // Catalog
  $("catalog").replaceChildren();
  if (!cfg.catalog || cfg.catalog.length === 0) {
    $("catalog").innerHTML = `<p style="color:var(--text-dim);font-size:0.85rem;">No rewards available yet.</p>`;
  } else {
    cfg.catalog.forEach((item) => {
      const card = document.createElement("article");
      card.className = "item";
      card.setAttribute("role", "listitem");
      card.innerHTML = `
        <b>${escHtml(item.name)}</b>
        <p>${escHtml(item.description)}</p>
        <span class="points-badge">⭐ ${item.points} points</span>
      `;
      const button = document.createElement("button");
      button.className = "primary";
      button.type = "button";
      button.textContent = "Redeem";
      button.setAttribute("aria-label", `Redeem ${item.name} for ${item.points} points`);
      button.disabled = user.points < item.points;
      if (button.disabled) {
        button.title = `You need ${item.points - user.points} more points`;
      }
      button.onclick = () => redeem(item.id, item.name, item.points);
      card.append(button);
      $("catalog").append(card);
    });
  }

  // Activity feed
  const rows = [
    ...data.rewards.map((entry) => ({
      label: "Rewarded ad credited",
      points: entry.points,
      date: entry.created,
      type: "positive"
    })),
    ...data.redemptions.map((entry) => ({
      label: "Redeem: " + entry.item + " (" + entry.status + ")",
      points: -entry.points,
      date: entry.created,
      type: "negative"
    }))
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  $("activity").replaceChildren();
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "activity-empty";
    empty.innerHTML = `<div class="empty-icon">📊</div>No activity yet.<br><small>Watch an ad to earn your first points.</small>`;
    $("activity").append(empty);
    return;
  }

  rows.slice(0, 15).forEach((entry) => {
    const row = document.createElement("div");
    row.className = "activity-row";
    const label = document.createElement("span");
    label.className = "act-label";
    label.textContent = entry.label;
    const pts = document.createElement("span");
    pts.className = `act-points ${entry.type}`;
    pts.textContent = (entry.points > 0 ? "+" : "") + entry.points + " pts";
    const meta = document.createElement("span");
    meta.className = "act-meta";
    meta.textContent = formatDate(entry.date);
    row.append(label, pts, meta);
    $("activity").append(row);
  });
}

// ─── REDEEM ───────────────────────────────────────────────────
async function redeem(id, name, points) {
  if (!confirm(`Redeem "${name}" for ${points} points? This action cannot be undone. Fulfillment is subject to review.`)) return;
  try {
    await api("/api/redeem", { item: id });
    setStatus(`Redemption for "${name}" recorded. Status is pending review.`, "success");
    showToast(`Redeemed "${name}" for ${points} points!`, "success");
    await load();
  } catch (error) {
    setStatus(error.message, "error");
    showToast(error.message, "error");
  }
}

// ─── WATCH AD ─────────────────────────────────────────────────
async function startWatch() {
  if (slot || demoTimer) {
    showToast("An ad request is already active.", "info");
    return;
  }
  const btn = $("watch");
  setLoading(btn, true, "Preparing ad…");
  try {
    const issued = await api("/api/reward/nonce");
    nonce = issued.nonce;
    granted = false;
    if (cfg.demoMode || !cfg.adUnitPath) {
      startDemoAd();
      return;
    }
    startGamAd();
  } catch (error) {
    setStatus(error.message, "error");
    showToast(error.message, "error");
    resetAdUi();
  }
}

// ─── DEMO AD ──────────────────────────────────────────────────
function startDemoAd() {
  const btn = $("watch");
  btn.disabled = true;
  btn.innerHTML = btn.dataset.originalText || "▶ Watch optional ad";

  showOverlay(true);
  $("ad-title").textContent = "Demo Rewarded Ad";
  $("ad-copy").textContent = "Google Ad Manager is not configured — this is a local demo. Complete the clip to earn points, or close to skip.";
  $("ad-complete").hidden = true;
  $("ad-stage-icon").textContent = "🎬";
  setStatus("Demo ad playing. Reward credited only if you complete it.");

  let total = 10;
  let remaining = total;
  $("ad-timer").textContent = remaining + "s remaining";
  $("ad-bar").style.width = "0%";
  $("ad-progress-bar").setAttribute("aria-valuenow", "0");

  demoTimer = setInterval(() => {
    remaining -= 1;
    const pct = Math.min(100, Math.round(((total - remaining) / total) * 100));
    $("ad-bar").style.width = pct + "%";
    $("ad-progress-bar").setAttribute("aria-valuenow", String(pct));

    if (remaining <= 0) {
      clearInterval(demoTimer);
      demoTimer = null;
      $("ad-timer").textContent = "Ad finished! Claim your reward below.";
      $("ad-complete").hidden = false;
      $("ad-stage-icon").textContent = "🎉";
      $("ad-bar").style.width = "100%";
      return;
    }
    $("ad-timer").textContent = remaining + "s remaining";
  }, 1000);
}

// ─── REAL GAM AD ──────────────────────────────────────────────
function startGamAd() {
  showOverlay(false);
  setStatus("Preparing opt-in ad…");
  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    googletag.pubads().addEventListener("rewardedSlotReady", (event) => {
      if (event.slot === slot) {
        setStatus("Ad is ready. The provider will show its opt-in prompt.");
        event.makeRewardedVisible();
      }
    });
    googletag.pubads().addEventListener("rewardedSlotGranted", async (event) => {
      if (event.slot !== slot || granted) return;
      await creditReward("Reward granted! Your points have been credited.");
    });
    googletag.pubads().addEventListener("rewardedSlotClosed", (event) => {
      if (event.slot !== slot) return;
      if (!granted) {
        setStatus("Ad closed; no points credited.", "error");
        showToast("Ad closed before completion — no points credited.", "info");
      }
      googletag.destroySlots([slot]);
      endAdSession();
    });
    googletag.pubads().addEventListener("slotRenderEnded", (event) => {
      if (event.slot === slot && event.isEmpty) {
        setStatus("No ad available right now. Please try again later.", "error");
        showToast("No ad was available. Try again later.", "info");
        googletag.destroySlots([slot]);
        endAdSession();
      }
    });
    slot = googletag.defineOutOfPageSlot(cfg.adUnitPath, googletag.enums.OutOfPageFormat.REWARDED);
    if (!slot) {
      setStatus("Rewarded ads are not supported on this device. Falling back to demo.");
      showToast("Device not supported for live ads — using demo mode.", "info");
      startDemoAd();
      return;
    }
    slot.addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.display(slot);
    googletag.pubads().refresh([slot]);
  });
}

// ─── CREDIT REWARD ────────────────────────────────────────────
async function creditReward(successText) {
  if (granted) return;
  if (!nonce) {
    setStatus("This ad session expired. Watch again to earn points.", "error");
    showToast("Session expired — please watch a new ad.", "error");
    endAdSession();
    return;
  }
  granted = true;
  try {
    const result = await api("/api/reward/claim", { nonce });
    setStatus(successText, "success");
    showToast(`+${result.points || cfg.points} points credited to your account! 🎉`, "success");
    endAdSession();
    await load();
  } catch (error) {
    granted = false;
    setStatus(error.message, "error");
    showToast(error.message, "error");
  }
}

// ─── EVENT LISTENERS ──────────────────────────────────────────
$("watch").onclick = startWatch;

$("ad-complete").onclick = async () => {
  await creditReward("Reward granted! Your points have been credited.");
};

$("ad-close").onclick = () => {
  if (!granted) {
    setStatus("Ad closed; no points credited.", "error");
    showToast("Closed without completing — no points credited.", "info");
  }
  endAdSession();
};

// ─── UTILITY ──────────────────────────────────────────────────
function escHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// ─── INIT ──────────────────────────────────────────────────────
(async () => {
  try {
    cfg = await api("/api/config");
    await load();
  } catch {
    setStatus("Please register or sign in to get started.");
  }
})();
