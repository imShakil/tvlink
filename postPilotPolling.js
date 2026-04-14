/**
 * PostPilot Poll Widget — fixed
 *
 * Fixes applied:
 *  1. Vote poll 24h expiry now works correctly:
 *     - Uses data-event-time (match kickoff) as the clock start
 *     - Falls back to data-poll-ts / data-ts / data-date attributes
 *     - No longer falls back to page publish date (caused instant expiry on new posts)
 *     - When no timestamp is present the poll stays open (safe default)
 *  2. Full mobile-responsive redesign:
 *     - Fluid widths, rem-based spacing, clamp() font sizes
 *     - Team button grid stacks on very narrow screens
 *     - Bar labels truncate cleanly instead of overflowing
 *     - Touch target sizes meet 44px minimum
 *
 * Marker div formats (unchanged):
 *   Movie/Series: <div id="poll-tmdb-12345" data-type="rating" data-title="Movie Name"></div>
 *   Sports Event: <div id="poll-event-2337375" data-type="vote"
 *                      data-team-a="Liverpool" data-team-b="Man City"
 *                      data-league="FA Cup"
 *                      data-event-time="2026-04-08T17:30:00Z"></div>
 */

(function () {
  "use strict";

  const API = "https://daily-sports-events.mhshakil555.workers.dev";
  const STORAGE_KEY = "dp_poll_votes";
  const VOTE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in ms

  // ── Styles ────────────────────────────────────────────────────────────────

  const CSS = `
/* Container */
.dp-poll {
  font-family: inherit;
  background: #1a1a2e;
  border: 1px solid #2d2d4e;
  border-radius: 14px;
  padding: clamp(14px, 4vw, 22px) clamp(14px, 4vw, 24px) clamp(12px, 3vw, 20px);
  margin: clamp(16px, 4vw, 28px) 0;
  color: #e0e0e0;
  max-width: 560px;
  width: 100%;
  box-sizing: border-box;
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

/* Badge */
.dp-poll-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: clamp(9px, 2.5vw, 10px);
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #ff6b35;
  margin-bottom: 10px;
}
.dp-poll-badge svg {
  width: 12px; height: 12px; fill: #ff6b35; flex-shrink: 0;
}

/* Title */
.dp-poll-title {
  font-size: clamp(13px, 3.5vw, 15px);
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 16px;
  line-height: 1.4;
}

/* ── Rating poll ── */
.dp-stars {
  display: flex;
  gap: clamp(2px, 1vw, 6px);
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.dp-star {
  background: none;
  border: none;
  font-size: clamp(22px, 6vw, 28px);
  cursor: pointer;
  color: #3a3a5c;
  padding: 2px;
  line-height: 1;
  transition: color 0.15s, transform 0.12s;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dp-star:hover,
.dp-star.hover  { color: #f7c948; transform: scale(1.18); }
.dp-star.selected { color: #f7c948; }
.dp-star.dimmed   { color: #3a3a5c; }
.dp-rating-meta {
  font-size: clamp(11px, 3vw, 12px);
  color: #888;
  margin-bottom: 14px;
}
.dp-rating-meta strong {
  color: #f7c948;
  font-size: clamp(14px, 4vw, 16px);
  font-weight: 700;
}

/* ── Vote poll ── */
.dp-teams {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: clamp(6px, 2vw, 10px);
  margin-bottom: 16px;
}
/* Stack vertically on very small screens */
@media (max-width: 320px) {
  .dp-teams {
    grid-template-columns: 1fr;
  }
  .dp-vs { order: -1; margin-bottom: 4px; }
}
.dp-team-btn {
  border: 2px solid #2d2d4e;
  border-radius: 10px;
  background: #12122a;
  color: #e0e0e0;
  padding: clamp(10px, 3vw, 12px) clamp(8px, 2vw, 10px);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.12s;
  font-size: clamp(12px, 3.5vw, 13px);
  font-weight: 700;
  text-align: center;
  line-height: 1.3;
  word-break: break-word;
  min-height: 44px;
  width: 100%;
  box-sizing: border-box;
}
.dp-team-btn:hover:not(:disabled) {
  border-color: #ff6b35;
  transform: translateY(-2px);
}
.dp-team-btn.selected-a {
  border-color: #ff6b35;
  background: rgba(255,107,53,0.12);
  color: #ff6b35;
}
.dp-team-btn.selected-b {
  border-color: #4fb8ff;
  background: rgba(79,184,255,0.12);
  color: #4fb8ff;
}
.dp-vs {
  font-size: clamp(10px, 2.5vw, 11px);
  font-weight: 700;
  letter-spacing: 1px;
  color: #555;
  text-align: center;
  white-space: nowrap;
}
.dp-league-tag {
  font-size: clamp(10px, 2.5vw, 10px);
  color: #666;
  text-align: center;
  margin-bottom: 14px;
  letter-spacing: 0.5px;
}

/* ── Shared results bar ── */
.dp-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dp-bar-row {
  display: flex;
  align-items: center;
  gap: clamp(6px, 2vw, 10px);
}
.dp-bar-label {
  font-size: clamp(10px, 2.8vw, 11px);
  color: #aaa;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Rating label (star number) */
.dp-bar-label.dp-star-label {
  min-width: 28px;
  max-width: 28px;
  text-align: right;
}
/* Vote label (team name) */
.dp-bar-label.dp-team-label {
  min-width: 60px;
  max-width: clamp(60px, 22vw, 90px);
  text-align: left;
}
.dp-bar-track {
  flex: 1;
  background: #12122a;
  border-radius: 6px;
  height: 8px;
  overflow: hidden;
  min-width: 0;
}
.dp-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s cubic-bezier(.4,0,.2,1);
}
.dp-bar-fill.orange { background: linear-gradient(90deg, #ff6b35, #f7a635); }
.dp-bar-fill.blue   { background: linear-gradient(90deg, #4fb8ff, #6f88ff); }
.dp-bar-pct {
  font-size: clamp(10px, 2.8vw, 11px);
  color: #888;
  min-width: 32px;
  flex-shrink: 0;
  text-align: right;
}
.dp-total {
  font-size: clamp(10px, 2.8vw, 11px);
  color: #555;
  margin-top: 12px;
  text-align: center;
}
.dp-closed-note {
  font-size: clamp(11px, 3vw, 12px);
  color: #a5a5a5;
  margin-bottom: 12px;
}

/* ── States ── */
.dp-poll-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  font-size: clamp(12px, 3vw, 13px);
  min-height: 60px;
}
.dp-spinner {
  width: 16px; height: 16px;
  border: 2px solid #2d2d4e;
  border-top-color: #ff6b35;
  border-radius: 50%;
  animation: dp-spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes dp-spin { to { transform: rotate(360deg); } }
.dp-voted-check {
  font-size: clamp(10px, 2.8vw, 11px);
  color: #4caf7d;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.dp-error {
  font-size: clamp(11px, 3vw, 12px);
  color: #ff6b5b;
  margin-top: 8px;
}
.dp-submit-btn {
  margin-top: 14px;
  padding: clamp(9px, 2.5vw, 10px) clamp(16px, 4vw, 20px);
  background: linear-gradient(90deg, #ff6b35, #f7a635);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: clamp(12px, 3vw, 13px);
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.12s;
  display: none;
  min-height: 44px;
  width: 100%;
  box-sizing: border-box;
}
.dp-submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
.dp-submit-btn.visible { display: inline-block; }
.dp-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

  // ── Utility ───────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById("dp-poll-styles")) return;
    const s = document.createElement("style");
    s.id = "dp-poll-styles";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

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

  function parseTimestamp(value) {
    if (!value) return null;
    const t = Date.parse(String(value));
    return Number.isFinite(t) ? t : null;
  }

  /**
   * FIX: Get the vote poll start timestamp ONLY from the marker element's
   * own data attributes. We deliberately do NOT fall back to the page's
   * publish date — that caused polls on newly-published posts to expire
   * immediately because the page publish time was in the past.
   *
   * Priority: data-event-time → data-poll-ts → data-ts → data-date
   * Returns null (= poll stays open) if none are present.
   */
  function getVotePollStartTs(el) {
    const candidates = [
      el.dataset.eventTime,   // preferred: actual match kickoff time
      el.dataset.pollTs,
      el.dataset.ts,
      el.dataset.date,
    ];
    for (const raw of candidates) {
      const ts = parseTimestamp(raw);
      if (ts) return ts;
    }
    return null; // no timestamp → poll stays open (safe default)
  }

  /**
   * Returns true only when a valid startTs exists AND 24 h have passed.
   * When startTs is null we treat the poll as still open.
   */
  function isVotePollExpired(startTs) {
    if (!startTs) return false;
    return Date.now() - startTs >= VOTE_WINDOW_MS;
  }

  // ── Rating widget ─────────────────────────────────────────────────────────

  function buildRatingWidget(container, pollId, title) {
    const voted = hasVoted(pollId);
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

    const starsEl   = container.querySelector(`#${pollId}-stars`);
    const metaEl    = container.querySelector(`#${pollId}-meta`);
    const submitBtn = container.querySelector(`#${pollId}-submit`);
    const barsEl    = container.querySelector(`#${pollId}-bars`);
    const totalEl   = container.querySelector(`#${pollId}-total`);

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
        btn.addEventListener("mouseenter", () => {
          hovering = i;
          updateStarDisplay(starsEl, selected, hovering);
        });
        btn.addEventListener("mouseleave", () => {
          hovering = 0;
          updateStarDisplay(starsEl, selected, 0);
        });
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
      if (!selected) return;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
      try {
        const poll = await apiPost(pollId, { type: "rating", value: selected });
        markVoted(pollId, selected);
        submitBtn.classList.remove("visible");
        renderRatingResults(barsEl, totalEl, metaEl, poll, selected);
        showVotedCheck(container, `You rated ${selected}/10`);
      } catch {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Rating";
        showError(container, "Failed to submit — please try again.");
      }
    });

    apiGet(pollId).then((poll) => {
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
    starsEl.querySelectorAll(".dp-star").forEach((btn) => {
      const v = Number(btn.dataset.val);
      btn.classList.remove("selected", "dimmed", "hover");
      if (hovering) {
        btn.classList.add(v <= hovering ? "hover" : "dimmed");
      } else if (selected) {
        btn.classList.add(v <= selected ? "selected" : "dimmed");
      }
    });
  }

  function renderRatingResults(barsEl, totalEl, metaEl, poll, userVote) {
    const total = poll.total || 0;
    let weightedSum = 0;
    for (const [k, v] of Object.entries(poll.votes || {})) {
      weightedSum += Number(k) * Number(v);
    }
    const avg = total ? (weightedSum / total).toFixed(1) : "—";

    metaEl.innerHTML = total
      ? `Community average: <strong>${avg}/10</strong>`
      : "No ratings yet";

    barsEl.style.display = "flex";
    barsEl.innerHTML = "";
    for (let i = 10; i >= 1; i--) {
      const count = poll.votes?.[String(i)] || 0;
      const p = pct(count, total);
      const isUser = userVote === i;
      const row = document.createElement("div");
      row.className = "dp-bar-row";
      row.innerHTML = `
        <span class="dp-bar-label dp-star-label" style="${isUser ? "color:#f7c948;font-weight:700" : ""}">${i}★</span>
        <div class="dp-bar-track"><div class="dp-bar-fill orange" style="width:0%"></div></div>
        <span class="dp-bar-pct">${p}%</span>
      `;
      barsEl.appendChild(row);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          row.querySelector(".dp-bar-fill").style.width = p + "%";
        });
      });
    }
    totalEl.textContent = total ? `${total.toLocaleString()} vote${total !== 1 ? "s" : ""}` : "";
  }

  // ── Vote widget ───────────────────────────────────────────────────────────

  function buildVoteWidget(container, pollId, teamA, teamB, league, options = {}) {
    const expired     = Boolean(options.expired);
    const voted       = hasVoted(pollId);
    const userVote    = getUserVote(pollId);
    const interactive = !expired && !voted;

    container.innerHTML = `
      <div class="dp-poll-badge">
        <svg viewBox="0 0 24 24" style="fill:#ff6b35"><path d="M18 3a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m-6 4L6.62 9.28A2 2 0 0 0 6 11v5h2v6h4v-6h2l-1-5m-1-2a2 2 0 0 0-2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2Z"/></svg>
        ${expired ? "Voting Closed" : "Who wins?"}
      </div>
      <div class="dp-poll-title">Match Prediction</div>
      ${league ? `<div class="dp-league-tag">🏆 ${escHtml(league)}</div>` : ""}
      ${expired ? `<div class="dp-closed-note">Voting closed after 24 hours — here are the final results.</div>` : ""}
      <div class="dp-teams">
        <button class="dp-team-btn${userVote === "a" ? " selected-a" : ""}" id="${pollId}-btn-a" ${interactive ? "" : "disabled"}>
          ${escHtml(teamA)}
        </button>
        <div class="dp-vs">VS</div>
        <button class="dp-team-btn${userVote === "b" ? " selected-b" : ""}" id="${pollId}-btn-b" ${interactive ? "" : "disabled"}>
          ${escHtml(teamB)}
        </button>
      </div>
      <div class="dp-bars" id="${pollId}-bars" style="display:none"></div>
      <div class="dp-total" id="${pollId}-total"></div>
    `;

    const btnA   = container.querySelector(`#${pollId}-btn-a`);
    const btnB   = container.querySelector(`#${pollId}-btn-b`);
    const barsEl = container.querySelector(`#${pollId}-bars`);
    const totalEl = container.querySelector(`#${pollId}-total`);

    async function castVote(value) {
      btnA.disabled = true;
      btnB.disabled = true;
      try {
        const poll = await apiPost(pollId, { type: "vote", teamA, teamB, value });
        markVoted(pollId, value);
        renderVoteResults(barsEl, totalEl, poll, teamA, teamB, value);
        showVotedCheck(container, `Voted for ${value === "a" ? teamA : teamB}`);
      } catch {
        btnA.disabled = !interactive;
        btnB.disabled = !interactive;
        showError(container, "Failed to submit — please try again.");
      }
    }

    if (interactive) {
      btnA.addEventListener("click", () => castVote("a"));
      btnB.addEventListener("click", () => castVote("b"));
    }

    apiGet(pollId).then((poll) => {
      if (poll) {
        renderVoteResults(barsEl, totalEl, poll, teamA, teamB, userVote);
        if (voted) showVotedCheck(container, `Voted for ${userVote === "a" ? teamA : teamB}`);
      }
    }).catch(() => {});
  }

  function renderVoteResults(barsEl, totalEl, poll, teamA, teamB, userVote) {
    const total  = poll.total || 0;
    const aCount = poll.votes?.a || 0;
    const bCount = poll.votes?.b || 0;
    const aP = pct(aCount, total);
    const bP = pct(bCount, total);

    barsEl.style.display = "flex";
    barsEl.innerHTML = `
      <div class="dp-bar-row">
        <span class="dp-bar-label dp-team-label" title="${escHtml(teamA)}" style="${userVote === "a" ? "color:#ff6b35;font-weight:700" : ""}">${escHtml(teamA)}</span>
        <div class="dp-bar-track"><div class="dp-bar-fill orange" style="width:0%"></div></div>
        <span class="dp-bar-pct">${aP}%</span>
      </div>
      <div class="dp-bar-row">
        <span class="dp-bar-label dp-team-label" title="${escHtml(teamB)}" style="${userVote === "b" ? "color:#4fb8ff;font-weight:700" : ""}">${escHtml(teamB)}</span>
        <div class="dp-bar-track"><div class="dp-bar-fill blue" style="width:0%"></div></div>
        <span class="dp-bar-pct">${bP}%</span>
      </div>
    `;

    totalEl.textContent = total ? `${total.toLocaleString()} vote${total !== 1 ? "s" : ""}` : "";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        barsEl.querySelectorAll(".dp-bar-fill")[0].style.width = aP + "%";
        barsEl.querySelectorAll(".dp-bar-fill")[1].style.width = bP + "%";
      });
    });
  }

  // ── Shared UI helpers ─────────────────────────────────────────────────────

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

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Scanner ───────────────────────────────────────────────────────────────

  function scan() {
    const markers = document.querySelectorAll('[id^="poll-"]');
    if (!markers.length) return;

    injectStyles();

    markers.forEach((el) => {
      if (el.dataset.dpInit === "1") return;
      el.dataset.dpInit = "1";

      const pollId = el.id;
      const type   = el.dataset.type;

      el.classList.add("dp-poll");
      el.innerHTML = `<div class="dp-poll-loading"><div class="dp-spinner"></div>Loading poll…</div>`;

      if (type === "rating") {
        const title = el.dataset.title || "Rate this";
        buildRatingWidget(el, pollId, title);

      } else if (type === "vote") {
        const teamA   = el.dataset.teamA   || "Team A";
        const teamB   = el.dataset.teamB   || "Team B";
        const league  = el.dataset.league  || "";
        const startTs = getVotePollStartTs(el);
        const expired = isVotePollExpired(startTs);
        buildVoteWidget(el, pollId, teamA, teamB, league, { expired });

      } else {
        el.style.display = "none";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }

})();
