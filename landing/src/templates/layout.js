import { siteConfig } from '../../site.config.js';

export function renderLayout({
  title,
  description,
  canonicalPath = '',
  ogImage,
  ogType = 'website',
  schemaJson,
  activeNav = '',
  content
}) {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} | ${siteConfig.tagline}`;
  const pageDesc = description || siteConfig.description;
  const canonicalUrl = `${siteConfig.siteUrl}${canonicalPath}`;
  const socialImage = ogImage ? (ogImage.startsWith('http') ? ogImage : `${siteConfig.siteUrl}${ogImage}`) : `${siteConfig.siteUrl}${siteConfig.defaultOgImage}`;

  const navItems = siteConfig.nav.map(item => {
    const isActive = activeNav === item.href || (item.href !== '/' && canonicalPath.startsWith(item.href));
    const targetAttr = item.external ? 'target="_blank" rel="noopener noreferrer"' : '';
    return `
      <li>
        <a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}" ${targetAttr}>
          ${item.label}
          ${item.external ? '<svg class="btn-icon" style="width:12px;height:12px;display:inline;margin-left:2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>' : ''}
        </a>
      </li>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="${siteConfig.colors.accent}" />
  <meta name="color-scheme" content="dark" />

  <!-- Primary SEO Tags -->
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDesc}" />
  <meta name="author" content="${siteConfig.author}" />
  <meta name="robots" content="index, follow" />
  ${siteConfig.googleSiteVerification ? `<meta name="google-site-verification" content="${siteConfig.googleSiteVerification}" />` : ''}
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="${siteConfig.name}" />
  <meta property="og:title" content="${pageTitle}" />
  <meta property="og:description" content="${pageDesc}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${socialImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="fb:app_id" content="${siteConfig.fbAppId}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="${siteConfig.twitterHandle}" />
  <meta name="twitter:title" content="${pageTitle}" />
  <meta name="twitter:description" content="${pageDesc}" />
  <meta name="twitter:image" content="${socialImage}" />

  <!-- Favicons -->
  <link rel="icon" type="image/svg+xml" href="${siteConfig.logoUrl}" />
  <link rel="icon" type="image/webp" href="${siteConfig.icon192}" sizes="192x192" />
  <link rel="apple-touch-icon" href="${siteConfig.icon192}" />
  <link rel="alternate" type="application/rss+xml" title="${siteConfig.name} Blog Feed" href="/feed.xml" />

  <!-- Stylesheets -->
  <link rel="stylesheet" href="/assets/main.css" />
  <link rel="stylesheet" href="/assets/highlight.css" />

  ${schemaJson ? `<script type="application/ld+json">${JSON.stringify(schemaJson, null, 2)}</script>` : ''}
</head>
<body>
  <!-- Navigation Header -->
  <header class="site-header">
    <div class="container nav-wrapper">
      <a href="/" class="brand-link" aria-label="${siteConfig.name} Home">
        <img src="${siteConfig.horizontalLogo}" alt="${siteConfig.name}" class="brand-full-logo" height="38" />
        <span class="brand-mobile-group">
          <img src="${siteConfig.logoUrl}" alt="${siteConfig.name}" class="brand-logo-img" width="32" height="32" />
          <span class="brand-title">Dekho<span>Prime</span></span>
        </span>
      </a>

      <nav>
        <ul class="nav-links" id="navLinks">
          ${navItems}
        </ul>
      </nav>

      <div class="header-cta-group">
        <a href="${siteConfig.links.webApp}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          <span>Watch Live TV</span>
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </a>
      </div>

      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle navigation menu" aria-expanded="false">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
    </div>
  </header>

  <!-- Page Content -->
  <main>
    ${content}
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="/" class="brand-link" aria-label="${siteConfig.name} Home">
            <img src="${siteConfig.horizontalLogo}" alt="${siteConfig.name}" class="brand-full-logo" height="36" />
          </a>
          <p>${siteConfig.description}</p>
        </div>

        <div class="footer-col">
          <h4>Apps & Platforms</h4>
          <ul class="footer-links">
            <li><a href="${siteConfig.links.webApp}" target="_blank" rel="noopener" class="footer-link">Web App</a></li>
            <li><a href="${siteConfig.links.livePlayer}" target="_blank" rel="noopener" class="footer-link">Live TV Player</a></li>
            <li><a href="/downloads/" class="footer-link">Android Mobile APK</a></li>
            <li><a href="/downloads/" class="footer-link">Android TV APK</a></li>
            <li><a href="${siteConfig.links.apkPure}" target="_blank" rel="noopener" class="footer-link">APKPure Store</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Resources</h4>
          <ul class="footer-links">
            <li><a href="/article/" class="footer-link">Articles & Guides</a></li>
            <li><a href="/changelog/" class="footer-link">Version Changelog</a></li>
            <li><a href="${siteConfig.links.m3uPlaylistBlog}" target="_blank" rel="noopener" class="footer-link">M3U Playlists</a></li>
            <li><a href="/feed.xml" class="footer-link">RSS Feed</a></li>
            <li><a href="/sitemap.xml" class="footer-link">Sitemap</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Community & Social</h4>
          <ul class="footer-links">
            <li><a href="${siteConfig.links.telegram}" target="_blank" rel="noopener" class="footer-link">Telegram Channel</a></li>
            <li><a href="${siteConfig.links.telegramGroup}" target="_blank" rel="noopener" class="footer-link">Telegram Community</a></li>
            <li><a href="${siteConfig.links.facebook}" target="_blank" rel="noopener" class="footer-link">Facebook Page</a></li>
            <li><a href="${siteConfig.links.instagram}" target="_blank" rel="noopener" class="footer-link">Instagram</a></li>
            <li><a href="${siteConfig.links.githubRepo}" target="_blank" rel="noopener" class="footer-link">GitHub Repository</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} ${siteConfig.name}. Free Entertainment Hub for Bangladesh & Worldwide.</p>
        <p>Disclaimer: Content aggregated from publicly available third-party sources. Logos & streams belong to original rights holders.</p>
      </div>
    </div>
  </footer>

  <!-- Scripts -->
  <script src="/assets/main.js" defer></script>
</body>
</html>`;
}
