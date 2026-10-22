import { siteConfig } from '../../site.config.js';

export function renderArticles({ articles = [] }) {
  const cardsHtml = articles.map(article => {
    const tagsString = (article.tags || []).join(', ');
    return `
      <article class="article-card" data-title="${encodeURIComponent(article.title)}" data-tags="${tagsString}" data-desc="${encodeURIComponent(article.description || '')}">
        <div class="article-card-body">
          <div class="article-meta">
            <time datetime="${article.date}">${article.formattedDate}</time>
            <span>•</span>
            <span>${article.readingTime}</span>
            <span>•</span>
            <span style="text-transform: uppercase;">${article.lang || 'en'}</span>
          </div>

          <h2 class="article-title">
            <a href="${article.url}" class="article-title-link">${article.title}</a>
          </h2>

          <p class="article-snippet">${article.description || ''}</p>

          <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; padding-top: 1rem;">
            <div class="article-tags">
              ${(article.tags || []).slice(0, 3).map(tag => `<span class="tag-badge">#${tag}</span>`).join('')}
            </div>
            <a href="${article.url}" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">
              Read Guide →
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  return `
    <div class="container" style="padding-top: 3.5rem; padding-bottom: 5rem;">
      <div class="section-header">
        <div class="section-tag">Blog & Documentation</div>
        <h1 class="section-title">Articles & Guides</h1>
        <p class="section-desc">
          Official tutorials, installation walkthroughs in Bangla and English, M3U IPTV playlist guides, and product announcements.
        </p>

        <!-- Search Input -->
        <div style="max-width: 480px; margin: 2rem auto 0; position: relative;">
          <input
            type="text"
            id="articleSearchInput"
            placeholder="Search articles by title, tag, or topic..."
            style="width: 100%; padding: 0.85rem 1.25rem; border-radius: var(--radius-full); background-color: var(--bg-card); border: 1px solid var(--border); color: var(--text-main); font-size: 0.95rem; outline: none; transition: var(--transition);"
            onfocus="this.style.borderColor='var(--accent)';"
            onblur="this.style.borderColor='var(--border)';"
          />
        </div>
      </div>

      <div class="articles-grid" id="articlesGrid">
        ${cardsHtml}
      </div>

      <div id="noArticlesFound" style="display: none; text-align: center; padding: 3rem 0; color: var(--text-muted);">
        <p style="font-size: 1.1rem;">No matching articles found. Try another search term.</p>
      </div>
    </div>
  `;
}
