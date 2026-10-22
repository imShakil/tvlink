import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import frontMatter from 'front-matter';
import hljs from 'highlight.js';

import { siteConfig } from '../site.config.js';
import { renderLayout } from './templates/layout.js';
import { renderHome } from './templates/home.js';
import { renderDownloads } from './templates/downloads.js';
import { renderChangelog } from './templates/changelog.js';
import { renderArticles } from './templates/articles.js';
import { renderArticle } from './templates/article.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content', 'articles');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ASSETS_DIST = path.join(DIST_DIR, 'assets');

// Helper to ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper to calculate reading time
function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

// Helper to format date
function formatDate(dateInput) {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return String(dateInput);
  }
}

// Generate Slug from filename
function generateSlug(filename) {
  return filename
    .replace(/\.md$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');
}

async function build() {
  console.log('🚀 Starting Dekho Prime Static Site Build...');
  const startTime = Date.now();

  // 1. Prepare Dist Directories
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  ensureDir(DIST_DIR);
  ensureDir(ASSETS_DIST);

  // 2. Copy Public Assets & Styles/Scripts
  copyDirSync(PUBLIC_DIR, DIST_DIR);
  copyDirSync(path.join(__dirname, 'styles'), ASSETS_DIST);
  copyDirSync(path.join(__dirname, 'scripts'), ASSETS_DIST);

  // 3. Process Articles from Markdown
  const articleFiles = fs.existsSync(CONTENT_DIR) 
    ? fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'))
    : [];

  const articles = [];

  for (const file of articleFiles) {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = frontMatter(fileContent);
    const slug = generateSlug(file);
    const rawBody = parsed.body;

    const toc = [];

    // Custom marked renderer for headings & syntax highlighting
    const customRenderer = {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const headingId = text
          .toLowerCase()
          .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
          .replace(/^-+|-+$/g, '');

        if (depth === 2 || depth === 3) {
          toc.push({ id: headingId, text, level: depth });
        }

        return `<h${depth} id="${headingId}">${text}</h${depth}>\n`;
      },
      code({ text, lang }) {
        const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
        const highlighted = hljs.highlight(text, { language }).value;
        const displayLang = language === 'plaintext' ? 'CODE' : language.toUpperCase();

        return `
          <div class="code-block-wrapper">
            <div class="code-header">
              <span>${displayLang}</span>
              <button class="copy-btn" type="button" aria-label="Copy code">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Copy</span>
              </button>
            </div>
            <pre><code class="hljs ${language}">${highlighted}</code></pre>
          </div>
        `;
      }
    };

    const markedInstance = new Marked();
    markedInstance.use({ renderer: customRenderer });
    const html = markedInstance.parse(rawBody);

    const title = parsed.attributes.title || slug.replace(/-/g, ' ');
    const description = parsed.attributes.description || '';
    const date = parsed.attributes.date ? new Date(parsed.attributes.date).toISOString().split('T')[0] : '2026-10-01';
    const author = parsed.attributes.author || siteConfig.author;
    const tags = Array.isArray(parsed.attributes.tags) ? parsed.attributes.tags : ['guide'];
    const image = parsed.attributes.image || siteConfig.defaultOgImage;
    const lang = parsed.attributes.lang || 'en';

    articles.push({
      slug,
      url: `/article/${slug}/`,
      title,
      description,
      date,
      formattedDate: formatDate(date),
      readingTime: calculateReadingTime(rawBody),
      author,
      tags,
      image,
      lang,
      html,
      toc,
      rawBody
    });
  }

  // Sort articles by date descending
  articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 4. Render Individual Article Pages (/article/<slug>/index.html)
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const prevArticle = articles[i + 1] || null;
    const nextArticle = articles[i - 1] || null;

    const articleHtml = renderArticle({
      article,
      prevArticle,
      nextArticle,
      toc: article.toc
    });

    const schemaJson = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.description,
      "image": article.image ? `${siteConfig.siteUrl}${article.image}` : `${siteConfig.siteUrl}${siteConfig.defaultOgImage}`,
      "datePublished": article.date,
      "dateModified": article.date,
      "author": {
        "@type": "Organization",
        "name": article.author,
        "url": siteConfig.siteUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": siteConfig.name,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteConfig.siteUrl}${siteConfig.logoUrl}`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${siteConfig.siteUrl}${article.url}`
      }
    };

    const fullPage = renderLayout({
      title: article.title,
      description: article.description,
      canonicalPath: article.url,
      ogImage: article.image,
      ogType: "article",
      schemaJson,
      activeNav: "/article/",
      content: articleHtml
    });

    const articleDir = path.join(DIST_DIR, 'article', article.slug);
    ensureDir(articleDir);
    fs.writeFileSync(path.join(articleDir, 'index.html'), fullPage, 'utf-8');
  }

  // 5. Render Articles Index Page (/article/index.html)
  const articlesListContent = renderArticles({ articles });
  const articlesSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Articles & Guides | ${siteConfig.name}`,
    "description": "Official guides, tutorials, and announcements for Dekho Prime apps and playlists.",
    "url": `${siteConfig.siteUrl}/article/`
  };

  const articlesListPage = renderLayout({
    title: "Articles & Guides",
    description: "Official tutorials, installation walkthroughs in Bangla and English, M3U IPTV playlist guides, and product announcements.",
    canonicalPath: "/article/",
    schemaJson: articlesSchema,
    activeNav: "/article/",
    content: articlesListContent
  });
  const articlesIndexDir = path.join(DIST_DIR, 'article');
  ensureDir(articlesIndexDir);
  fs.writeFileSync(path.join(articlesIndexDir, 'index.html'), articlesListPage, 'utf-8');

  // 6. Render Downloads Page (/downloads/index.html)
  const downloadsContent = renderDownloads();
  const downloadsSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Dekho Prime",
    "operatingSystem": "Android, Android TV",
    "applicationCategory": "EntertainmentApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "downloadUrl": siteConfig.links.mobileApk
  };

  const downloadsPage = renderLayout({
    title: "Download Android Mobile & TV APKs",
    description: "Download Dekho Prime APK for Android smartphones, tablets, and Android TV / Google TV. Free live TV channels and sports stream.",
    canonicalPath: "/downloads/",
    schemaJson: downloadsSchema,
    activeNav: "/downloads/",
    content: downloadsContent
  });
  const downloadsDir = path.join(DIST_DIR, 'downloads');
  ensureDir(downloadsDir);
  fs.writeFileSync(path.join(downloadsDir, 'index.html'), downloadsPage, 'utf-8');

  // 7. Render Changelog Page (/changelog/index.html)
  const changelogContent = renderChangelog();
  const changelogPage = renderLayout({
    title: "Version Changelog & Release Notes",
    description: "Official changelog and release history for Dekho Prime Android, TV, and Web clients.",
    canonicalPath: "/changelog/",
    activeNav: "/changelog/",
    content: changelogContent
  });
  const changelogDir = path.join(DIST_DIR, 'changelog');
  ensureDir(changelogDir);
  fs.writeFileSync(path.join(changelogDir, 'index.html'), changelogPage, 'utf-8');

  // 8. Render Home Page (/index.html)
  const homeContent = renderHome({ articles });
  const homeSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.siteUrl}/#website`,
        "url": siteConfig.siteUrl,
        "name": siteConfig.name,
        "description": siteConfig.description,
        "publisher": {
          "@id": `${siteConfig.siteUrl}/#organization`
        }
      },
      {
        "@type": "Organization",
        "@id": `${siteConfig.siteUrl}/#organization`,
        "name": siteConfig.name,
        "url": siteConfig.siteUrl,
        "logo": `${siteConfig.siteUrl}${siteConfig.logoUrl}`,
        "sameAs": [
          siteConfig.links.facebook,
          siteConfig.links.telegram,
          siteConfig.links.githubRepo
        ]
      }
    ]
  };

  const homePage = renderLayout({
    title: "",
    description: siteConfig.description,
    canonicalPath: "/",
    schemaJson: homeSchema,
    activeNav: "/",
    content: homeContent
  });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homePage, 'utf-8');

  // 9. Render 404 Page (/404.html)
  const notFoundContent = `
    <div class="container" style="padding: 6rem 1.25rem; text-align: center;">
      <span class="badge badge-accent" style="font-size: 1rem; margin-bottom: 1rem;">404</span>
      <h1 style="margin-bottom: 1rem;">Page Not Found</h1>
      <p style="max-width: 500px; margin: 0 auto 2rem; color: var(--text-muted);">
        The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
      </p>
      <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
        <a href="/" class="btn btn-primary">Return Home</a>
        <a href="/article/" class="btn btn-secondary">Browse Articles</a>
      </div>
    </div>
  `;
  const notFoundPage = renderLayout({
    title: "404 Not Found",
    description: "The page you are looking for could not be found.",
    canonicalPath: "/404.html",
    activeNav: "",
    content: notFoundContent
  });
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), notFoundPage, 'utf-8');

  // 10. Generate Sitemap XML (/sitemap.xml)
  const nowIso = new Date().toISOString().split('T')[0];
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/downloads/', priority: '0.9', changefreq: 'weekly' },
    { path: '/changelog/', priority: '0.8', changefreq: 'weekly' },
    { path: '/article/', priority: '0.8', changefreq: 'daily' }
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(p => `
  <url>
    <loc>${siteConfig.siteUrl}${p.path}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')}
  ${articles.map(a => `
  <url>
    <loc>${siteConfig.siteUrl}${a.url}</loc>
    <lastmod>${a.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml.trim(), 'utf-8');

  // 11. Generate RSS Feed (/feed.xml)
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.name}</title>
    <link>${siteConfig.siteUrl}/article/</link>
    <description>${siteConfig.description}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${articles.map(a => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${siteConfig.siteUrl}${a.url}</link>
      <guid isPermaLink="true">${siteConfig.siteUrl}${a.url}</guid>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <description><![CDATA[${a.description}]]></description>
    </item>`).join('')}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(DIST_DIR, 'feed.xml'), rssXml.trim(), 'utf-8');

  const duration = Date.now() - startTime;
  console.log(`✅ Build completed in ${duration}ms!`);
  console.log(`📄 Generated ${articles.length} articles under /article/<slug>/`);
  console.log(`📁 Output directory ready: ${DIST_DIR}`);
}

build().catch(err => {
  console.error('❌ Build failed with error:', err);
  process.exit(1);
});
