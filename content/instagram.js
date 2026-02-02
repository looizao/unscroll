(() => {
  const PLATFORM = 'instagram';
  let enabled = true;

  const ALLOWED_PATHS = [
    /^\/$/, // Home feed
    /^\/direct/,
    /^\/p\//,
    /^\/stories\//,
    /^\/accounts\//,
  ];

  function isProfilePath(pathname) {
    // /<username>/ — doesn't start with known routes
    return /^\/[a-zA-Z0-9_.]{1,30}(\/|$)/.test(pathname) &&
      !/^\/(explore|reels|direct|p|stories|accounts|reel)\b/.test(pathname);
  }

  function shouldRedirect(pathname) {
    if (!enabled) return null;

    if (pathname.startsWith('/explore')) return '/';
    if (pathname.startsWith('/reels')) return '/';
    if (pathname.startsWith('/reel/')) return '/';

    return null;
  }

  function handleNavigation() {
    const redirect = shouldRedirect(location.pathname);
    if (redirect && location.pathname !== redirect) {
      window.location.replace(redirect);
    }
  }

  // Hide "Suggested for you" posts and everything after them.
  // Instagram inserts a link with href="/?variant=past_posts" at the boundary
  // between followed content and suggested content. This is language-agnostic.
  function hideSuggestedPosts() {
    if (!enabled) return;

    // Only act on the home feed
    if (location.pathname !== '/') return;

    const marker = document.querySelector('a[href="/?variant=past_posts"]');
    if (!marker) return;

    // Walk up from the marker to find the article-level container
    let boundary = marker.closest('article');
    if (!boundary) {
      // Fallback: walk up until we find a sibling-level container
      boundary = marker;
      while (boundary.parentElement && boundary.parentElement.children.length <= 1) {
        boundary = boundary.parentElement;
      }
    }

    // Hide the boundary element and all subsequent siblings
    let el = boundary;
    while (el) {
      if (!el.dataset.unscrollHidden) {
        el.style.setProperty('display', 'none', 'important');
        el.dataset.unscrollHidden = 'true';
      }
      el = el.nextElementSibling;
    }
  }

  // Fallback: look for "Suggested for you" text in the feed
  function hideSuggestedByText() {
    if (!enabled || location.pathname !== '/') return;

    const articles = document.querySelectorAll('article');
    let foundSuggested = false;

    for (const article of articles) {
      if (foundSuggested) {
        if (!article.dataset.unscrollHidden) {
          article.style.setProperty('display', 'none', 'important');
          article.dataset.unscrollHidden = 'true';
        }
        continue;
      }

      // Check if this article or a preceding sibling contains "Suggested for you"
      const prev = article.previousElementSibling;
      if (prev && prev.textContent && prev.textContent.includes('Suggested for you')) {
        foundSuggested = true;
        prev.style.setProperty('display', 'none', 'important');
        prev.dataset.unscrollHidden = 'true';
        article.style.setProperty('display', 'none', 'important');
        article.dataset.unscrollHidden = 'true';
      }
    }
  }

  function cleanFeed() {
    hideSuggestedPosts();
    hideSuggestedByText();
  }

  async function init() {
    enabled = await isUnscrollEnabled(PLATFORM);
    setUnscrollActive(enabled);

    handleNavigation();

    window.addEventListener('unscroll:urlchange', handleNavigation);

    createUnscrollObserver(() => {
      if (!enabled) return;
      cleanFeed();
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes[PLATFORM]) {
        enabled = changes[PLATFORM].newValue !== false;
        setUnscrollActive(enabled);
        if (enabled) {
          handleNavigation();
          cleanFeed();
        } else {
          // Un-hide everything we hid
          document.querySelectorAll('[data-unscroll-hidden]').forEach((el) => {
            el.style.removeProperty('display');
            delete el.dataset.unscrollHidden;
          });
        }
      }
    });
  }

  init();
})();
