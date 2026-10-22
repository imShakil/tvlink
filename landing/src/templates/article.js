import { siteConfig } from '../../site.config.js';

export function renderArticle({ article, prevArticle, nextArticle, toc = [] }) {
  const shareUrl = encodeURIComponent(`${siteConfig.siteUrl}${article.url}`);
  const shareTitle = encodeURIComponent(article.title);

  const tocHtml = toc.length > 0 ? `
    <div class="toc-box">
      <div class="toc-title">Table of Contents</div>
      <ul class="toc-list">
        ${toc.map(item => `
          <li style="padding-left: ${item.level === 3 ? '1rem' : '0'};">
            <a href="#${item.id}" class="toc-link">${item.text}</a>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  return `
    <div class="article-container" style="padding-top: 2rem; padding-bottom: 5rem;">
      <!-- Breadcrumb -->
      <nav class="article-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/article/">Articles</a>
        <span>/</span>
        <span style="color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px;">
          ${article.title}
        </span>
      </nav>

      <!-- Article Header -->
      <header class="article-header">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
          ${(article.tags || []).map(t => `<span class="badge badge-accent">#${t}</span>`).join('')}
        </div>

        <h1 class="article-header-title">${article.title}</h1>

        ${article.description ? `<p style="font-size: 1.15rem; color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.6;">${article.description}</p>` : ''}

        <div class="article-header-meta">
          <div class="author-info">
            <img src="${siteConfig.logoUrl}" alt="${article.author || siteConfig.author}" class="author-avatar" width="36" height="36" />
            <div>
              <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">${article.author || siteConfig.author}</div>
              <div style="font-size: 0.8rem; color: var(--text-subtle);">
                <time datetime="${article.date}">${article.formattedDate}</time> • ${article.readingTime}
              </div>
            </div>
          </div>

          <button id="nativeShareBtn" class="btn btn-secondary btn-sm" style="display: none;">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            <span>Share</span>
          </button>
        </div>
      </header>

      ${article.image ? `
        <div style="margin: 2rem 0; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border);">
          <img src="${article.image}" alt="${article.title}" style="width: 100%; max-height: 440px; object-fit: cover;" />
        </div>
      ` : ''}

      ${tocHtml}

      <!-- Rendered Article Body -->
      <div class="markdown-body">
        ${article.html}
      </div>

      <!-- Social Share Bar -->
      <div class="social-share-bar">
        <span class="social-share-label">Share this article:</span>

        <a href="https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}" target="_blank" rel="noopener noreferrer" class="share-btn whatsapp" data-share-type="whatsapp" aria-label="Share on WhatsApp">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          <span>WhatsApp</span>
        </a>

        <a href="https://t.me/share/url?url=${shareUrl}&text=${shareTitle}" target="_blank" rel="noopener noreferrer" class="share-btn telegram" data-share-type="telegram" aria-label="Share on Telegram">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.34-.674.34l.205-3.048 5.568-5.029c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.535-.194 1.006.128.897.878z"/></svg>
          <span>Telegram</span>
        </a>

        <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener noreferrer" class="share-btn facebook" data-share-type="facebook" aria-label="Share on Facebook">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.583 9 4.615V8z"/></svg>
          <span>Facebook</span>
        </a>

        <a href="https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}" target="_blank" rel="noopener noreferrer" class="share-btn twitter" data-share-type="twitter" aria-label="Share on X / Twitter">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span>X (Twitter)</span>
        </a>

        <button type="button" class="share-btn btn-copy-share" data-share-type="copy" data-url="${siteConfig.siteUrl}${article.url}" aria-label="Copy article link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          <span>Copy Link</span>
        </button>
      </div>

      <!-- Author Bio -->
      <div style="background-color: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; margin-bottom: 3rem;">
        <img src="${siteConfig.logoUrl}" alt="${siteConfig.name}" style="width: 52px; height: 52px; border-radius: 50%;" />
        <div>
          <h4 style="margin-bottom: 0.25rem;">Published by ${article.author || siteConfig.name}</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0;">
            ${siteConfig.tagline}. Streaming 100+ Live channels, sports, and movies across Android, TV, and Web.
          </p>
        </div>
      </div>

      <!-- Prev / Next Navigation -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; border-top: 1px solid var(--border); padding-top: 2rem;">
        ${prevArticle ? `
          <a href="${prevArticle.url}" style="background-color: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; transition: var(--transition);">
            <span style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">← Previous Guide</span>
            <span style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">${prevArticle.title}</span>
          </a>
        ` : '<div></div>'}

        ${nextArticle ? `
          <a href="${nextArticle.url}" style="background-color: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; text-align: right; transition: var(--transition);">
            <span style="font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase;">Next Guide →</span>
            <span style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">${nextArticle.title}</span>
          </a>
        ` : '<div></div>'}
      </div>
    </div>
  `;
}
