import { siteConfig } from '../../site.config.js';

export function renderChangelog() {
  const pastReleases = [
    {
      version: "v4.2.0",
      date: "September 2026",
      status: "Stable",
      highlights: [
        "Enhanced Sports Schedule Parser: Multi-timezone kickoff conversion and automatic fixture status sync.",
        "Bangla UI Localization: 100% complete Bengali typography overhaul across navigation, player controls, and settings.",
        "Multi-Server Failover: Dynamic health-scoring for live TV streams to switch origins when packets drop."
      ]
    },
    {
      version: "v4.1.0",
      date: "August 2026",
      status: "Stable",
      highlights: [
        "Google Sign-In Cloud Sync: Cloud Firestore synchronization for favorite channels, continue watching, and bookmarks.",
        "TV Leanback Remote Controls: D-pad navigation enhancements, channel number shortcuts, and full screen lock.",
        "Performance Tuning: 40% reduction in initial cold boot bundle size."
      ]
    },
    {
      version: "v4.0.0",
      date: "August 2026",
      status: "Major Milestone",
      highlights: [
        "Major Architecture Upgrade: Unified engine powering Dekho Prime Web, Android Mobile APK, and Android TV APK.",
        "Live Sports Section: Introduction of curated sports events and direct channel linkage.",
        "Anime & Shows Library: Integrated catalog streaming."
      ]
    },
    {
      version: "v3.6.0",
      date: "July 2026",
      status: "Archive",
      highlights: [
        "Brand Identity Update: Official Dekho Prime ruby crimson icon and high-definition splash assets.",
        "Ad-block resilient stream playback pipeline."
      ]
    }
  ];

  return `
    <div class="container" style="padding-top: 3.5rem; padding-bottom: 5rem;">
      <div class="section-header">
        <div class="section-tag">Version History</div>
        <h1 class="section-title">Changelog & Releases</h1>
        <p class="section-desc">
          Stay up to date with the latest features, performance enhancements, and bug fixes across all Dekho Prime clients.
        </p>
      </div>

      <div class="changelog-timeline">
        <!-- Current Latest Release -->
        <div class="changelog-entry" style="border-color: rgba(234, 56, 62, 0.4);">
          <div class="changelog-header">
            <div class="changelog-version">
              <h2>${siteConfig.latestRelease.version}</h2>
              <span class="badge badge-accent">${siteConfig.latestRelease.status}</span>
            </div>
            <span style="font-size: 0.9rem; color: var(--text-subtle);">${siteConfig.latestRelease.releaseDate}</span>
          </div>

          ${siteConfig.latestRelease.changelog.map(g => `
            <div class="changelog-group">
              <div class="changelog-group-title">
                <span class="badge badge-muted">${g.tag}</span>
                <strong>${g.platform}</strong>
              </div>
              <ul class="changelog-list">
                ${g.items.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          `).join('')}

          <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <a href="${siteConfig.links.githubReleases}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              <span>View Release on GitHub</span>
            </a>
            <a href="/downloads/" class="btn btn-primary btn-sm">
              <span>Get v4.3.0 APKs</span>
            </a>
          </div>
        </div>

        <!-- Historical Releases -->
        ${pastReleases.map(rel => `
          <div class="changelog-entry">
            <div class="changelog-header">
              <div class="changelog-version">
                <h3>${rel.version}</h3>
                <span class="badge badge-muted">${rel.status}</span>
              </div>
              <span style="font-size: 0.85rem; color: var(--text-subtle);">${rel.date}</span>
            </div>

            <ul class="changelog-list">
              ${rel.highlights.map(h => `<li>${h}</li>`).join('')}
            </ul>
          </div>
        `).join('')}

      </div>
    </div>
  `;
}
