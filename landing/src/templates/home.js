import { siteConfig } from '../../site.config.js';

export function renderHome({ articles = [] }) {
  const recentArticles = articles.slice(0, 3).map(article => {
    return `
      <article class="article-card">
        <div class="article-card-body">
          <div class="article-meta">
            <time datetime="${article.date}">${article.formattedDate}</time>
            <span>•</span>
            <span>${article.readingTime}</span>
          </div>
          <h3 class="article-title">
            <a href="${article.url}" class="article-title-link">${article.title}</a>
          </h3>
          <p class="article-snippet">${article.description || ''}</p>
          <div class="article-tags">
            ${(article.tags || []).slice(0, 3).map(tag => `<span class="tag-badge">#${tag}</span>`).join('')}
          </div>
        </div>
      </article>
    `;
  }).join('');

  return `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div style="margin-bottom: 1.75rem; display: flex; justify-content: center; align-items: center;">
          <img src="${siteConfig.horizontalLogo}" alt="${siteConfig.name}" style="height: 54px; width: auto; object-fit: contain; filter: drop-shadow(0 6px 25px rgba(234, 56, 62, 0.45));" />
        </div>

        <a href="/changelog/" class="hero-pill">
          <span class="hero-pill-dot"></span>
          <span><strong>${siteConfig.latestRelease.version} Released</strong> — Arena Clash & Smart Sports Alerts</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </a>

        <h1 class="hero-title">
          Free Live TV, Sports & Movies<br />
          <span class="gradient-text">Stream Anywhere, Any Device</span>
        </h1>

        <p class="hero-desc">
          1000+ Bangladeshi & International live channels, real-time sports fixtures, movies, series, and anime. Available on Web, Android Mobile, and Android TV / Google TV.
        </p>

        <div class="hero-actions">
          <a href="${siteConfig.links.webApp}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Watch Live on Web</span>
          </a>

          <a href="/downloads/" class="btn btn-secondary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Download APKs (Mobile & TV)</span>
          </a>

          <a href="${siteConfig.links.livePlayer}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
            <span>Instant Player</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Platform Ecosystem Cards -->
    <section class="section" style="padding-top: 1rem;">
      <div class="container">
        <div class="cards-grid">
          <div class="card card-highlight">
            <div class="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            </div>
            <h3 class="card-title">Dekho Prime Web App</h3>
            <p class="card-text">Direct in-browser streaming with Google Sign-in sync. No installation required. Perfect for PC, Mac, tablets, and phones.</p>
            <a href="${siteConfig.links.webApp}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="margin-top:auto;">
              <span>Open dekhoprime.live</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>

          <div class="card">
            <div class="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            </div>
            <h3 class="card-title">Android Mobile & Tablet</h3>
            <p class="card-text">Touch-optimized app for on-the-go viewing. Arena clash live sports scoreboards, zero battery drain notifications, and light APK.</p>
            <div style="display:flex;gap:0.5rem;margin-top:auto;flex-wrap:wrap;">
              <a href="${siteConfig.links.mobileApk}" class="btn btn-primary btn-sm">
                <span>Download APK</span>
              </a>
              <a href="${siteConfig.links.apkPure}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                <span>APKPure</span>
              </a>
            </div>
          </div>

          <div class="card">
            <div class="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
            </div>
            <h3 class="card-title">Android TV / Google TV</h3>
            <p class="card-text">Custom Leanback build with D-pad navigation, remote numeric channel jumping, and automated stream failover switching.</p>
            <a href="${siteConfig.links.tvApk}" class="btn btn-primary btn-sm" style="margin-top:auto;">
              <span>Download TV APK</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Key Features Section -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">Key Features</div>
          <h2 class="section-title">Engineered for Seamless Entertainment</h2>
          <p class="section-desc">Experience rapid stream loading, resilient failover mechanisms, and tailored Bangladeshi content support.</p>
        </div>

        <div class="cards-grid">
          ${siteConfig.features.map(f => `
            <div class="card">
              <div class="card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 class="card-title">${f.title}</h3>
              <p class="card-text">${f.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- App Screenshots / Preview -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">User Interface</div>
          <h2 class="section-title">Clean, Dark & Intuitive Experience</h2>
          <p class="section-desc">Designed with focus on speed, high contrast readability, and effortless navigation on every screen size.</p>
        </div>

        <div style="background-color: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; text-align: center; overflow: hidden;">
          <img src="/uploads/see_the_apps.png" alt="Dekho Prime mobile and TV preview" style="max-height: 520px; margin: 0 auto; border-radius: var(--radius-md);" loading="lazy" />
        </div>
      </div>
    </section>

    <!-- Latest Changelog Summary -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">Changelog</div>
          <h2 class="section-title">What's New in ${siteConfig.latestRelease.version}</h2>
          <p class="section-desc">Released in ${siteConfig.latestRelease.releaseDate} with massive upgrades across Mobile, Android TV, and Web.</p>
        </div>

        <div class="changelog-timeline">
          <div class="changelog-entry">
            <div class="changelog-header">
              <div class="changelog-version">
                <h3>${siteConfig.latestRelease.version}</h3>
                <span class="badge badge-accent">${siteConfig.latestRelease.status}</span>
              </div>
              <span style="font-size: 0.85rem; color: var(--text-subtle);">${siteConfig.latestRelease.releaseDate}</span>
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

            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border); text-align: right;">
              <a href="/changelog/" style="color: var(--accent); font-weight: 600; font-size: 0.95rem;">
                View All Release Notes & Past Versions →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Articles & Guides -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">Guides & Tutorials</div>
          <h2 class="section-title">Latest Articles & Resources</h2>
          <p class="section-desc">Installation guides in Bengali and English, setup instructions, and IPTV playlist details.</p>
        </div>

        <div class="articles-grid">
          ${recentArticles}
        </div>

        <div style="text-align: center; margin-top: 2.5rem;">
          <a href="/article/" class="btn btn-secondary">
            <span>Browse All Articles & Guides</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>
        </div>
      </div>
    </section>

    <!-- Community & Social Connect -->
    <section class="section" style="border-bottom: 1px solid var(--border);">
      <div class="container" style="text-align: center;">
        <div class="section-header" style="margin-bottom: 2rem;">
          <div class="section-tag">Stay Connected</div>
          <h2 class="section-title">Join the Dekho Prime Community</h2>
          <p class="section-desc">Get instant stream updates, request channels, and chat with other members.</p>
        </div>

        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          <a href="${siteConfig.links.telegram}" target="_blank" rel="noopener" class="btn btn-secondary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            <span>Telegram Channel</span>
          </a>
          <a href="${siteConfig.links.telegramGroup}" target="_blank" rel="noopener" class="btn btn-secondary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Telegram Group</span>
          </a>
          <a href="${siteConfig.links.facebook}" target="_blank" rel="noopener" class="btn btn-secondary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            <span>Facebook Page</span>
          </a>
          <a href="${siteConfig.links.githubRepo}" target="_blank" rel="noopener" class="btn btn-secondary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            <span>Star on GitHub</span>
          </a>
        </div>
      </div>
    </section>
  `;
}
