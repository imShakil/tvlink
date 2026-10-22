# Dekho Prime Static Landing & Blog Site

High-performance, minimalist static website and blog for **Dekho Prime** built for super-fast SEO indexing, social media link sharing, and instant Cloudflare Pages deployments via GitHub.

---

## ⚡ Key Highlights

- **Ultra-Fast Performance**: Zero client hydration bloat, 100% pre-rendered static HTML with sub-100ms build times.
- **Max 3 Minimalist Color Palette**: 
  - **Accent**: Dekho Prime Crimson Red (`#ea383e`)
  - **Backgrounds**: Obsidian Dark (`#09090b` / `#121215`)
  - **Neutrals**: Crisp Whites & Silvers (`#f4f4f5` / `#a1a1aa` / `#27272a`)
- **SEO & Social Optimization**:
  - Full OpenGraph (`og:image`, `og:title`, `og:description`, `og:url`)
  - Twitter Cards (`summary_large_image`)
  - Schema.org JSON-LD structured data (`BlogPosting`, `SoftwareApplication`, `WebSite`, `Organization`)
  - Auto-generated `sitemap.xml` with last modified timestamps and priority
  - Auto-generated `feed.xml` (RSS 2.0)
  - `robots.txt`
  - Cloudflare Pages security & caching `_headers`
- **Markdown Articles under `/article/`**:
  - Drops `.md` files into `content/articles/`
  - Renders to `/article/<slug>/`
  - Syntax highlighted code blocks with language badge and one-click "Copy Code" button
  - Auto-generated Table of Contents (TOC) with heading anchors
  - Estimated reading time & publication date
  - One-tap social share bar (WhatsApp, Telegram, Facebook, X / Twitter, Copy Link)
  - Searchable article directory at `/article/`
- **Apps Ecosystem**:
  - Direct Dekho Prime Web App link (`https://dekhoprime.live`)
  - Direct Live TV Player link (`https://play.dekhoprime.live`)
  - Direct Android Mobile APK download link & APKPure badge
  - Direct Android TV Leanback APK download link
  - Interactive installation walkthroughs
  - Full version changelog (`/changelog/`)

---

## 🚀 Cloudflare Pages Deployment Guide

When creating your Cloudflare Pages project connected to this GitHub repository (`imShakil/tvlink`):

1. **Framework preset**: `None`
2. **Root directory**: `landing`
3. **Build command**: `npm run build`
4. **Build output directory**: `dist`
5. **Environment variables (Optional)**:
   - `SITE_URL`: `https://dekhoprime.live` (or your custom domain)
   - `BLOG_URL`: `https://blog.dekhoprime.live`

Every push to your GitHub branch will automatically trigger a Cloudflare Pages build and deploy instantly.

---

## 💻 Local Development

```bash
# Navigate to landing directory
cd landing

# Install dependencies (only marked, front-matter, and highlight.js)
npm install

# Start local dev server with auto-rebuild on file watch
npm run dev
```

Server will start at `http://localhost:3000/`.

To run a production static build:
```bash
npm run build
```

---

## ✍️ How to Publish a New Article

Simply add a new `.md` file inside `landing/content/articles/` (e.g. `my-new-guide.md`):

```markdown
---
title: "Your Article Title"
description: "A short, SEO-friendly summary of the article."
date: 2026-10-22
author: Dekho Prime
lang: en
tags:
  - iptv
  - guide
  - sports
image: /uploads/dekho-prime-og-1200x630.webp
---

# Your Heading Here

Write your markdown article here using standard formatting, tables, lists, and code blocks!
```

Commit and push to GitHub, and Cloudflare Pages will build and publish it instantly at `/article/my-new-guide/`!
