import { siteConfig } from '../../site.config.js';

export function renderDownloads() {
  return `
    <div class="container" style="padding-top: 3.5rem; padding-bottom: 5rem;">
      <div class="section-header">
        <div class="section-tag">Official Apps</div>
        <h1 class="section-title">Download Dekho Prime</h1>
        <p class="section-desc">
          Official APK builds for Android mobile phones, tablets, and Android TV / Google TV. Always sourced from the latest verified GitHub release.
        </p>
      </div>

      <!-- Download Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 4rem;">
        
        <!-- Mobile Build Card -->
        <div class="download-card card-highlight">
          <div class="download-header">
            <div>
              <span class="badge badge-accent">Mobile & Tablet</span>
              <h2 style="font-size: 1.5rem; margin-top: 0.5rem;">Android Phone & Tablet</h2>
            </div>
            <span class="badge badge-muted">APK</span>
          </div>

          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">
            Touch-optimized streaming client engineered for smartphones and tablets. Lightweight, snappy playback, and arena clash live sports alerts.
          </p>

          <ul class="download-specs">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Package: <code>com.imshakil.bdiptv</code></span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Requires Android 5.0 (Lollipop) or higher</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Arena Clash sports scoreboards & alerts</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Cloud-synced favorites with Google Sign-In</span>
            </li>
          </ul>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: auto;">
            <a href="${siteConfig.links.mobileApk}" class="btn btn-primary" download>
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Download Mobile APK (Direct)</span>
            </a>

            <a href="${siteConfig.links.apkPure}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
              <span>Get it on APKPure</span>
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </div>

        <!-- Android TV Card -->
        <div class="download-card card-highlight">
          <div class="download-header">
            <div>
              <span class="badge badge-accent">Smart TV</span>
              <h2 style="font-size: 1.5rem; margin-top: 0.5rem;">Android TV / Google TV</h2>
            </div>
            <span class="badge badge-muted">Leanback APK</span>
          </div>

          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">
            Dedicated Leanback user interface designed exclusively for smart TVs, Google TV sticks, Firesticks, and Android set-top boxes.
          </p>

          <ul class="download-specs">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Full remote & D-pad navigation support</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Numeric channel surfing & fast switching</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Automatic real-time stream failover telemetry</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Requires Android TV 7.0 (Nougat) or newer</span>
            </li>
          </ul>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: auto;">
            <a href="${siteConfig.links.tvApk}" class="btn btn-primary" download>
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Download Android TV APK</span>
            </a>

            <a href="${siteConfig.links.githubReleases}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
              <span>View GitHub Releases</span>
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </a>
          </div>
        </div>

      </div>

      <!-- Installation Guide Section -->
      <section style="background-color: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2.5rem 2rem; margin-bottom: 4rem;">
        <h2 style="margin-bottom: 1.5rem; text-align: center;">How to Install Dekho Prime</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;">
          <div style="border-left: 2px solid var(--accent); padding-left: 1.25rem;">
            <span style="color: var(--accent); font-weight: 700; font-size: 1.2rem;">01</span>
            <h3 style="font-size: 1.1rem; margin: 0.35rem 0;">Download APK</h3>
            <p style="font-size: 0.9rem; color: var(--text-muted);">Choose the Mobile APK for phones or TV APK for your Android TV box or smart TV.</p>
          </div>

          <div style="border-left: 2px solid var(--accent); padding-left: 1.25rem;">
            <span style="color: var(--accent); font-weight: 700; font-size: 1.2rem;">02</span>
            <h3 style="font-size: 1.1rem; margin: 0.35rem 0;">Allow Unknown Sources</h3>
            <p style="font-size: 0.9rem; color: var(--text-muted);">When prompted by Android, toggle "Allow install from this source" in system settings.</p>
          </div>

          <div style="border-left: 2px solid var(--accent); padding-left: 1.25rem;">
            <span style="color: var(--accent); font-weight: 700; font-size: 1.2rem;">03</span>
            <h3 style="font-size: 1.1rem; margin: 0.35rem 0;">Install APK</h3>
            <p style="font-size: 0.9rem; color: var(--text-muted);">Open the downloaded file from your notifications, Downloads folder, or via Downloader/USB on TV.</p>
          </div>

          <div style="border-left: 2px solid var(--accent); padding-left: 1.25rem;">
            <span style="color: var(--accent); font-weight: 700; font-size: 1.2rem;">04</span>
            <h3 style="font-size: 1.1rem; margin: 0.35rem 0;">Sign In & Enjoy</h3>
            <p style="font-size: 0.9rem; color: var(--text-muted);">Launch Dekho Prime and sign in with Google to sync your watch history and favorite channels.</p>
          </div>
        </div>
      </section>

      <!-- Web App Callout -->
      <div style="text-align: center; background: radial-gradient(circle at 50% 50%, rgba(234, 56, 62, 0.1), transparent 70%), var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 3rem 1.5rem;">
        <h2 style="margin-bottom: 0.75rem;">Prefer watching directly in your browser?</h2>
        <p style="max-width: 580px; margin: 0 auto 1.5rem; color: var(--text-muted);">
          No downloads required. You can stream our full catalog of Live TV channels, movies, and sports fixtures directly from any desktop or mobile browser.
        </p>
        <a href="${siteConfig.links.webApp}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          <span>Open Web App (dekhoprime.live)</span>
        </a>
      </div>
    </div>
  `;
}
