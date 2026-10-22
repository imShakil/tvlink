// Dekho Prime Landing & Blog Interactive Features
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isExpanded = navLinks.classList.contains('active');
      mobileBtn.setAttribute('aria-expanded', isExpanded);
    });
  }

  // 2. Code Block Copy Buttons
  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const codeWrapper = button.closest('.code-block-wrapper');
      if (!codeWrapper) return;
      const codeElement = codeWrapper.querySelector('code');
      if (!codeElement) return;

      const textToCopy = codeElement.innerText;
      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = button.innerHTML;
        button.innerHTML = '<span>✓ Copied!</span>';
        button.style.borderColor = 'var(--accent)';
        button.style.color = 'var(--accent)';

        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.borderColor = '';
          button.style.color = '';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code: ', err);
      }
    });
  });

  // 3. Dynamic Live Share URLs (resolves current browser domain dynamically)
  try {
    const currentLiveUrl = window.location.origin + window.location.pathname;
    const encodedLiveUrl = encodeURIComponent(currentLiveUrl);
    const encodedLiveTitle = encodeURIComponent(document.title);

    document.querySelectorAll('[data-share-type]').forEach((el) => {
      const type = el.getAttribute('data-share-type');
      if (type === 'whatsapp') {
        el.href = `https://api.whatsapp.com/send?text=${encodedLiveTitle}%20${encodedLiveUrl}`;
      } else if (type === 'telegram') {
        el.href = `https://t.me/share/url?url=${encodedLiveUrl}&text=${encodedLiveTitle}`;
      } else if (type === 'facebook') {
        el.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedLiveUrl}`;
      } else if (type === 'twitter') {
        el.href = `https://twitter.com/intent/tweet?text=${encodedLiveTitle}&url=${encodedLiveUrl}`;
      }
    });
  } catch (err) {
    // Fallback to static SSG hrefs
  }

  // 4. Share URL Trigger (for Copy Link button)
  document.querySelectorAll('.btn-copy-share').forEach((button) => {
    button.addEventListener('click', async () => {
      const shareUrl = window.location.origin + window.location.pathname;
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          const originalText = button.innerHTML;
          button.innerHTML = '<span>✓ Link Copied!</span>';
          setTimeout(() => {
            button.innerHTML = originalText;
          }, 2000);
        }
      } catch (e) {
        console.error(e);
      }
    });
  });

  // 4. Native Web Share API if supported
  const nativeShareBtn = document.getElementById('nativeShareBtn');
  if (nativeShareBtn) {
    if (navigator.share) {
      nativeShareBtn.style.display = 'inline-flex';
      nativeShareBtn.addEventListener('click', async () => {
        try {
          await navigator.share({
            title: document.title,
            text: document.querySelector('meta[name="description"]')?.content || document.title,
            url: window.location.href
          });
        } catch (err) {
          // Ignore AbortError if user closes share sheet
        }
      });
    } else {
      nativeShareBtn.style.display = 'none';
    }
  }

  // 5. Article Filter / Search (on /article/ page)
  const articleSearchInput = document.getElementById('articleSearchInput');
  const articleCards = document.querySelectorAll('.article-card');

  if (articleSearchInput && articleCards.length > 0) {
    articleSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      let visibleCount = 0;

      articleCards.forEach((card) => {
        const title = card.getAttribute('data-title')?.toLowerCase() || '';
        const tags = card.getAttribute('data-tags')?.toLowerCase() || '';
        const desc = card.getAttribute('data-desc')?.toLowerCase() || '';

        const matches = title.includes(query) || tags.includes(query) || desc.includes(query);
        if (matches) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      const noResults = document.getElementById('noArticlesFound');
      if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    });
  }
});
