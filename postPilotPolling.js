/**
 * PostPilot Poll Widget + Link Locker
 * Renders rating polls (movies/series) and vote polls (sports events)
 * from marker divs injected by PostPilot autopilot.
 * Also renders link locker from #unlock-link divs.
 *
 * Marker div formats:
 *   Movie/Series: <div id="poll-tmdb-12345" data-type="rating" data-title="Movie Name"></div>
 *   Sports Event: <div id="poll-event-2337375" data-type="vote" data-team-a="Liverpool" data-team-b="Man City" data-league="FA Cup"></div>
 *   Link Locker:  <div id="unlock-link">HEX_ENCRYPTED_URL</div>
 *
 * Drop this script anywhere in your Blogspot theme (before </body>).
 */

(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  // POLL WIDGET
  // ═══════════════════════════════════════════════════════════════════════════

  const API = "https://daily-sports-events.mhshakil555.workers.dev";
  const STORAGE_KEY = "dp_poll_votes";

  // ── Poll Styles ────────────────────────────────────────────────────────────

  const POLL_CSS = `
.dp-poll {
  font-family: inherit;
  background: #1a1a2e;
  border: 1px solid #2d2d4e;
  border-radius: 14px;
  padding: 22px 24px 20px;
  margin: 28px 0;
  color: #e0e0e0;
  max-width: 560px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  position: relative;
  overflow: hidden;
}
.dp-poll::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff6b35, #f7c948);
  border-radius: 14px 14px 0 0;
}
.dp-poll-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #ff6b35;
  margin-bottom: 10px;
}
.dp-poll-badge svg { width: 12px; height: 12px; fill: #ff6b35; }
.dp-poll-title {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 18px;
  line-height: 1.4;
}
.dp-stars {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.dp-star {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #3a3a5c;
  padding: 2px;
  line-height: 1;
  transition: color 0.15s, transform 0.12s;
}
.dp-star:hover, .dp-star.hover { color: #f7c948; transform: scale(1.18); }
.dp-star.selected { color: #f7c948; }
.dp-star.dimmed { color: #3a3a5c; }
.dp-rating-meta {
  font-size: 12px;
  color: #888;
  margin-bottom: 14px;
}
.dp-rating-meta strong { color: #f7c948; font-size: 16px; font-weight: 700; }
.dp-teams {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.dp-team-btn {
  border: 2px solid #2d2d4e;
  border-radius: 10px;
  background: #12122a;
  color: #e0e0e0;
  padding: 12px 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.12s;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  line-height: 1.3;
  word-break: break-word;
}
.dp-team-btn:hover { border-color: #ff6b35; transform: translateY(-2px); }
.dp-team-btn.selected-a { border-color: #ff6b35; background: rgba(255,107,53,0.12); color: #ff6b35; }
.dp-team-btn.selected-b { border-color: #4fb8ff; background: rgba(79,184,255,0.12); color: #4fb8ff; }
.dp-vs { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #555; text-align: center; }
.dp-league-tag { font-size: 10px; color: #666; text-align: center; margin-bottom: 14px; letter-spacing: 0.5px; }
.dp-bars { display: flex; flex-direction: column; gap: 10px; }
.dp-bar-row { display: flex; align-items: center; gap: 10px; }
.dp-bar-label { font-size: 11px; color: #aaa; min-width: 28px; text-align: right; flex-shrink: 0; }
.dp-bar-track { flex: 1; background: #12122a; border-radius: 6px; height: 8px; overflow: hidden; }
.dp-bar-fill { height: 100%; border-radius: 6px; transition: width 0.5s cubic-bezier(.4,0,.2,1); }
.dp-bar-fill.orange { background: linear-gradient(90deg, #ff6b35, #f7a635); }
.dp-bar-fill.blue   { background: linear-gradient(90deg, #4fb8ff, #6f88ff); }
.dp-bar-pct { font-size: 11px; color: #888; min-width: 32px; flex-shrink: 0; }
.dp-total { font-size: 11px; color: #555; margin-top: 12px; text-align: center; }
.dp-poll-loading { display: flex; align-items: center; gap: 8px; color: #555; font-size: 13px; min-height: 60px; }
.dp-spinner {
  width: 16px; height: 16px;
  border: 2px solid #2d2d4e;
  border-top-color: #ff6b35;
  border-radius: 50%;
  animation: dp-spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes dp-spin { to { transform: rotate(360deg); } }
.dp-voted-check { font-size: 11px; color: #4caf7d; margin-top: 10px; display: flex; align-items: center; gap: 5px; }
.dp-error { font-size: 12px; color: #ff6b5b; margin-top: 8px; }
.dp-submit-btn {
  margin-top: 14px;
  padding: 10px 20px;
  background: linear-gradient(90deg, #ff6b35, #f7a635);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.12s;
  display: none;
}
.dp-submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
.dp-submit-btn.visible { display: inline-block; }
.dp-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

  // ── Locker Styles ──────────────────────────────────────────────────────────

  const LOCKER_CSS = [
    '.locker-box{background:#fff;border-radius:10px;padding:20px;text-align:center;margin:15px auto;max-width:400px;width:100%;box-shadow:0 5px 20px rgba(0,0,0,0.08);border:1px solid #f0f3f5;font-family:sans-serif;box-sizing:border-box;}',
    '.locker-box h3{margin:0 0 8px;color:#2d3436;font-size:18px;font-weight:700;}',
    '.locker-box p{margin:0 0 20px;color:#636e72;font-size:13px;line-height:1.4;}',
    '.locker-progress-wrap{width:100%;height:8px;background:#f1f2f6;border-radius:10px;overflow:hidden;margin-bottom:15px;}',
    '.locker-progress-bar{width:0%;height:100%;background:#0984e3;transition:width 0.3s ease;}',
    '.locker-status-row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px;font-weight:bold;color:#2d3436;}',
    '.locker-btn{background:#0984e3;color:#fff;border:none;padding:12px 25px;border-radius:6px;font-weight:700;cursor:pointer;width:100%;font-size:14px;text-transform:uppercase;font-family:sans-serif;transition:0.2s;}',
    '.locker-btn:disabled{background:#b2bec3;cursor:not-allowed;}',
    '.locker-btn-success{background:#00b894;}',
    '.locker-warning{display:none;background:#fff9db;color:#e67e22;padding:8px;border-radius:6px;font-size:11px;font-weight:bold;border:1px solid #ffe066;margin-top:10px;}',
  ].join('');

  // ── Locker Config ──────────────────────────────────────────────────────────

  var adList = [
    "https://spreadpreferencetelevision.com/wd2ty9hdks?key=3e4233c2961536215d9a80e154be33b9",
    "https://spreadpreferencetelevision.com/tba2ybi8y?key=e9181f1e0055b64f2438c9cf18ca8880",
    "https://spreadpreferencetelevision.com/varcnk2z?key=25e685626a3523b38c951f6afb1341e6",
    "https://spreadpreferencetelevision.com/x2fusvgn?key=2531ef9b0b688c0f6205ee45da3c50de",
  ];

  var SECRET_KEY = "XP_DekhoPrimeBlog2027";
  var WAIT_TIME = 20;

  var statusTexts = [
    "Syncing Node...",
    "Verifying View...",
    "Encrypting Connection...",
    "BDIX Routing Check...",
    "Finalizing Protocol..."
  ];

  // ── Shared style injector ──────────────────────────────────────────────────

  function injectAllStyles() {
    if (!document.getElementById("dp-poll-styles")) {
      const s = document.createElement("style");
      s.id = "dp-poll-styles";
      s.textContent = POLL_CSS;
      document.head.appendChild(s);
    }
    if (!document.getElementById("locker-styles")) {
      const s = document.createElement("style");
      s.id = "locker-styles";
      s.textContent = LOCKER_CSS;
      document.head.appendChild(s);
    }
  }

  // ── Poll utilities ─────────────────────────────────────────────────────────

  function getVotedPolls() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  }
  function markVoted(pollId, value) {
    try {
      const votes = getVotedPolls();
      votes[pollId] = value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
    } catch {}
  }
  function hasVoted(pollId) { return pollId in getVotedPolls(); }
  function getUserVote(pollId) { return getVotedPolls()[pollId] ?? null; }

  async function apiGet(id) {
    const r = await fetch(`${API}/poll/${encodeURIComponent(id)}`);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  }
  async function apiPost(id, body) {
    const r = await fetch(`${API}/poll/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  }
  function pct(count, total) {
    if (!total) return 0;
    return Math.round((count / total) * 100);
  }
  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function showVotedCheck(container, msg) {
    const existing = container.querySelector(".dp-voted-check");
    if (existing) existing.remove();
    const el = document.createElement("div");
    el.className = "dp-voted-check";
    el.innerHTML = `<span>✓</span> ${escHtml(msg)} — thanks!`;
    container.appendChild(el);
  }
  function showError(container, msg) {
    const existing = container.querySelector(".dp-error");
    if (existing) existing.remove();
    const el = document.createElement("div");
    el.className = "dp-error";
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  // ── Rating widget ──────────────────────────────────────────────────────────

  function buildRatingWidget(container, pollId, title) {
    let voted = hasVoted(pollId);
    const userVote = getUserVote(pollId);

    container.innerHTML = `
      <div class="dp-poll-badge">
        <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
        Rate this
      </div>
      <div class="dp-poll-title">${escHtml(title)}</div>
      <div class="dp-stars" id="${pollId}-stars"></div>
      <div class="dp-rating-meta" id="${pollId}-meta">Loading ratings…</div>
      <button class="dp-submit-btn" id="${pollId}-submit">Submit Rating</button>
      <div class="dp-bars" id="${pollId}-bars" style="display:none"></div>
      <div class="dp-total" id="${pollId}-total"></div>
    `;

    const starsEl  = container.querySelector(`#${pollId}-stars`);
    const metaEl   = container.querySelector(`#${pollId}-meta`);
    const submitBtn = container.querySelector(`#${pollId}-submit`);
    const barsEl   = container.querySelector(`#${pollId}-bars`);
    const totalEl  = container.querySelector(`#${pollId}-total`);

    let selected = userVote ? Number(userVote) : 0;
    let hovering = 0;

    for (let i = 1; i <= 10; i++) {
      const btn = document.createElement("button");
      btn.className = "dp-star";
      btn.textContent = "★";
      btn.title = `${i}/10`;
      btn.dataset.val = i;
      btn.disabled = voted;
      if (!voted) {
        btn.addEventListener("mouseenter", () => { hovering = i; updateStarDisplay(starsEl, selected, hovering); });
        btn.addEventListener("mouseleave", () => { hovering = 0; updateStarDisplay(starsEl, selected, 0); });
        btn.addEventListener("click", () => {
          selected = i;
          updateStarDisplay(starsEl, selected, 0);
          metaEl.innerHTML = `You selected <strong>${i}/10</strong>`;
          submitBtn.classList.add("visible");
        });
      }
      starsEl.appendChild(btn);
    }

    if (voted && selected) updateStarDisplay(starsEl, selected, 0);

    submitBtn.addEventListener("click", async () => {
      if (!selected || voted || hasVoted(pollId)) return;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
      try {
        const poll = await apiPost(pollId, { type: "rating", value: selected });
        markVoted(pollId, selected);
        voted = true;
        starsEl.querySelectorAll(".dp-star").forEach(b => b.disabled = true);
        submitBtn.classList.remove("visible");
        renderRatingResults(barsEl, totalEl, metaEl, poll, selected);
        showVotedCheck(container, `You rated ${selected}/10`);
      } catch {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Rating";
        showError(container, "Failed to submit — please try again.");
      }
    });

    apiGet(pollId).then(poll => {
      if (poll) {
        renderRatingResults(barsEl, totalEl, metaEl, poll, userVote ? Number(userVote) : null);
        if (voted) showVotedCheck(container, `You rated ${userVote}/10`);
      } else {
        metaEl.textContent = voted ? `You rated ${userVote}/10 — be the first!` : "Be the first to rate!";
      }
    }).catch(() => {
      metaEl.textContent = voted ? `You rated ${userVote}/10` : "Rate this now!";
    });
  }

  function updateStarDisplay(starsEl, selected, hovering) {
    starsEl.querySelectorAll(".dp-star").forEach(btn => {
      const v = Number(btn.dataset.val);
      btn.classList.remove("selected", "dimmed", "hover");
      if (hovering) btn.classList.add(v <= hovering ? "hover" : "dimmed");
      else if (selected) btn.classList.add(v <= selected ? "selected" : "dimmed");
    });
  }

  function renderRatingResults(barsEl, totalEl, metaEl, poll, userVote) {
    const total = poll.total || 0;
    let weightedSum = 0;
    for (const [k, v] of Object.entries(poll.votes || {})) weightedSum += Number(k) * Number(v);
    const avg = total ? (weightedSum / total).toFixed(1) : "—";
    metaEl.innerHTML = total ? `Community average: <strong>${avg}/10</strong>` : "No ratings yet";
    barsEl.style.display = "flex";
    barsEl.innerHTML = "";
    for (let i = 10; i >= 1; i--) {
      const count = poll.votes?.[String(i)] || 0;
      const p = pct(count, total);
      const isUser = userVote === i;
      const row = document.createElement("div");
      row.className = "dp-bar-row";
      row.innerHTML = `
        <span class="dp-bar-label" style="${isUser ? "color:#f7c948;font-weight:700" : ""}">${i}★</span>
        <div class="dp-bar-track"><div class="dp-bar-fill orange" style="width:0%"></div></div>
        <span class="dp-bar-pct">${p}%</span>
      `;
      barsEl.appendChild(row);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        row.querySelector(".dp-bar-fill").style.width = p + "%";
      }));
    }
    totalEl.textContent = total ? `${total.toLocaleString()} vote${total !== 1 ? "s" : ""}` : "";
  }

  // ── Vote widget ────────────────────────────────────────────────────────────

  function buildVoteWidget(container, pollId, teamA, teamB, league) {
    const voted = hasVoted(pollId);
    const userVote = getUserVote(pollId);

    container.innerHTML = `
      <div class="dp-poll-badge">
        <svg viewBox="0 0 24 24" style="fill:#ff6b35"><path d="M18 3a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m-6 4L6.62 9.28A2 2 0 0 0 6 11v5h2v6h4v-6h2l-1-5m-1-2a2 2 0 0 0-2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2Z"/></svg>
        Who wins?
      </div>
      <div class="dp-poll-title">Match Prediction</div>
      ${league ? `<div class="dp-league-tag">🏆 ${escHtml(league)}</div>` : ""}
      <div class="dp-teams">
        <button class="dp-team-btn${userVote === "a" ? " selected-a" : ""}" id="${pollId}-btn-a" ${voted ? "disabled" : ""}>${escHtml(teamA)}</button>
        <div class="dp-vs">VS</div>
        <button class="dp-team-btn${userVote === "b" ? " selected-b" : ""}" id="${pollId}-btn-b" ${voted ? "disabled" : ""}>${escHtml(teamB)}</button>
      </div>
      <div class="dp-bars" id="${pollId}-bars" style="display:none"></div>
      <div class="dp-total" id="${pollId}-total"></div>
    `;

    const btnA   = container.querySelector(`#${pollId}-btn-a`);
    const btnB   = container.querySelector(`#${pollId}-btn-b`);
    const barsEl = container.querySelector(`#${pollId}-bars`);
    const totalEl = container.querySelector(`#${pollId}-total`);

    async function castVote(value) {
      btnA.disabled = true; btnB.disabled = true;
      try {
        const poll = await apiPost(pollId, { type: "vote", teamA, teamB, value });
        markVoted(pollId, value);
        renderVoteResults(barsEl, totalEl, poll, teamA, teamB, value);
        showVotedCheck(container, `Voted for ${value === "a" ? teamA : teamB}`);
      } catch {
        btnA.disabled = voted; btnB.disabled = voted;
        showError(container, "Failed to submit — please try again.");
      }
    }

    if (!voted) {
      btnA.addEventListener("click", () => castVote("a"));
      btnB.addEventListener("click", () => castVote("b"));
    }

    apiGet(pollId).then(poll => {
      if (poll) {
        renderVoteResults(barsEl, totalEl, poll, teamA, teamB, userVote);
        if (voted) showVotedCheck(container, `Voted for ${userVote === "a" ? teamA : teamB}`);
      }
    }).catch(() => {});
  }

  function renderVoteResults(barsEl, totalEl, poll, teamA, teamB, userVote) {
    const total = poll.total || 0;
    const aP = pct(poll.votes?.a || 0, total);
    const bP = pct(poll.votes?.b || 0, total);
    barsEl.style.display = "flex";
    barsEl.innerHTML = `
      <div class="dp-bar-row">
        <span class="dp-bar-label" style="min-width:80px;text-align:left;font-size:12px;${userVote === "a" ? "color:#ff6b35;font-weight:700" : ""}">${escHtml(teamA)}</span>
        <div class="dp-bar-track"><div class="dp-bar-fill orange" style="width:0%"></div></div>
        <span class="dp-bar-pct">${aP}%</span>
      </div>
      <div class="dp-bar-row">
        <span class="dp-bar-label" style="min-width:80px;text-align:left;font-size:12px;${userVote === "b" ? "color:#4fb8ff;font-weight:700" : ""}">${escHtml(teamB)}</span>
        <div class="dp-bar-track"><div class="dp-bar-fill blue" style="width:0%"></div></div>
        <span class="dp-bar-pct">${bP}%</span>
      </div>
    `;
    totalEl.textContent = total ? `${total.toLocaleString()} vote${total !== 1 ? "s" : ""}` : "";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      barsEl.querySelectorAll(".dp-bar-fill")[0].style.width = aP + "%";
      barsEl.querySelectorAll(".dp-bar-fill")[1].style.width = bP + "%";
    }));
  }

  // ── Locker: XOR decrypt ────────────────────────────────────────────────────

  function xorDecrypt(hex, key) {
    var result = "";
    for (var i = 0; i < hex.length; i += 2) {
      var code = parseInt(hex.substr(i, 2), 16) ^ key.charCodeAt((i / 2) % key.length);
      result += String.fromCharCode(code);
    }
    return result;
  }

  // ── Locker: render UI ──────────────────────────────────────────────────────

  function renderLocker(target, destinationURL) {
    target.style.display = 'block';
    target.innerHTML =
      '<div class="locker-box">' +
        '<div class="lk-start">' +
          '<div style="font-size:32px;margin-bottom:8px;">🔒</div>' +
          '<h3>Link Encrypted</h3>' +
          '<p>Unlock with Premium Ad Verification.</p>' +
          '<button class="locker-btn lk-btn-start">UNLOCK NOW</button>' +
        '</div>' +
        '<div class="lk-process" style="display:none;">' +
          '<div class="locker-status-row">' +
            '<span class="lk-status">Initializing...</span>' +
            '<span class="lk-percent">0%</span>' +
          '</div>' +
          '<div class="locker-progress-wrap"><div class="locker-progress-bar"></div></div>' +
          '<div class="locker-warning lk-warning"></div>' +
        '</div>' +
        '<div class="lk-final" style="display:none;">' +
          '<div style="font-size:32px;margin-bottom:8px;">✅</div>' +
          '<h3 style="color:#00b894;">Verification Success</h3>' +
          '<button class="locker-btn locker-btn-success lk-btn-copy">COPY LINK</button>' +
        '</div>' +
      '</div>';

    var stepStart   = target.querySelector('.lk-start');
    var stepProcess = target.querySelector('.lk-process');
    var stepFinal   = target.querySelector('.lk-final');
    var progressBar = target.querySelector('.locker-progress-bar');
    var percentText = target.querySelector('.lk-percent');
    var statusMsg   = target.querySelector('.lk-status');
    var warningBox  = target.querySelector('.lk-warning');
    var btnStart    = target.querySelector('.lk-btn-start');
    var btnCopy     = target.querySelector('.lk-btn-copy');

    var adWindow = null;
    var timeLeft = WAIT_TIME;
    var timerInterval = null;
    var started = false;

    btnStart.addEventListener('click', function() {
      if (started) return;
      started = true;
      var randomLink = adList[Math.floor(Math.random() * adList.length)];
      adWindow = window.open(randomLink, '_blank');
      if (!adWindow) {
        alert("Please allow popups to proceed!");
        started = false;
        return;
      }
      stepStart.style.display = 'none';
      stepProcess.style.display = 'block';

      timerInterval = setInterval(function() {
        if (adWindow && adWindow.closed) {
          warningBox.style.display = 'block';
          warningBox.textContent = '⚠️ Ad Closed! Please reload and try again.';
          statusMsg.textContent = 'Process Aborted';
          clearInterval(timerInterval);
          return;
        }
        if (!document.hidden) {
          warningBox.style.display = 'block';
          warningBox.textContent = '⚠️ Stay on Ad Page to Continue!';
          statusMsg.textContent = 'Timer Paused';
          return;
        }
        warningBox.style.display = 'none';
        timeLeft--;
        var percent = Math.floor(((WAIT_TIME - timeLeft) / WAIT_TIME) * 100);
        progressBar.style.width = percent + '%';
        percentText.textContent = percent + '%';
        if (timeLeft % 4 === 0) statusMsg.textContent = statusTexts[Math.floor(Math.random() * statusTexts.length)];
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          stepProcess.style.display = 'none';
          stepFinal.style.display = 'block';
        }
      }, 1000);
    });

    btnCopy.addEventListener('click', function() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(destinationURL).then(function() {
          btnCopy.textContent = 'COPIED! ✅';
          setTimeout(function() { window.location.href = destinationURL; }, 1000);
        });
      } else {
        var tmp = document.createElement('input');
        tmp.value = destinationURL;
        tmp.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        btnCopy.textContent = 'COPIED! ✅';
        setTimeout(function() { window.location.href = destinationURL; }, 1000);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCANNERS — both run on the same observer + poller cycle
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Poll scanner ───────────────────────────────────────────────────────────

  function scanPolls() {
    const markers = document.querySelectorAll('[id^="poll-"]');
    if (!markers.length) return;

    markers.forEach(el => {
      if (el.dataset.dpInit === "1") return;
      el.dataset.dpInit = "1";

      const pollId = el.id;
      const type = el.dataset.type;

      el.classList.add("dp-poll");
      el.innerHTML = `<div class="dp-poll-loading"><div class="dp-spinner"></div>Loading poll…</div>`;

      if (type === "rating") {
        buildRatingWidget(el, pollId, el.dataset.title || "Rate this");
      } else if (type === "vote") {
        buildVoteWidget(el, pollId, el.dataset.teamA || "Team A", el.dataset.teamB || "Team B", el.dataset.league || "");
      } else {
        el.style.display = "none";
      }
    });
  }

  // ── Locker scanner ─────────────────────────────────────────────────────────

  function scanLockers() {
    var nodes = document.querySelectorAll('#unlock-link');
    nodes.forEach(function(node) {
      // Skip only if already fully rendered into locker UI
      if (node.getAttribute('data-locker-init') === 'true') return;

      var encrypted = node.textContent.trim();
      if (!encrypted) return; // content not injected yet — do NOT stamp, retry on next cycle

      // Stamp only after confirming content exists
      node.setAttribute('data-locker-init', 'true');

      var decrypted = '';
      try {
        decrypted = xorDecrypt(encrypted, SECRET_KEY);
        if (!decrypted.startsWith('http')) decrypted = '';
      } catch(e) { decrypted = ''; }

      if (!decrypted) {
        node.style.display = 'none';
        return;
      }

      node.textContent = '';
      renderLocker(node, decrypted);
    });
  }

  // ── Shared scan ────────────────────────────────────────────────────────────

  function scanAll() {
    scanPolls();
    scanLockers();
  }

  // ── Init: single observer + polling fallback ───────────────────────────────

  function init() {
    injectAllStyles();
    scanAll();

    // MutationObserver covers childList + characterData (text node changes)
    new MutationObserver(function() {
      scanAll();
    }).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Polling fallback — catches Blogger's lazy content injection
    // that MutationObserver may miss (e.g. text node set via innerHTML on parent)
    var attempts = 0;
    var poller = setInterval(function() {
      attempts++;
      scanAll();
      var node = document.querySelector('#unlock-link');
      var lockerDone = node && node.getAttribute('data-locker-init') === 'true';
      if (lockerDone || attempts >= 60) clearInterval(poller); // stop after 30s or success
    }, 500);
  }

  // Run after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
