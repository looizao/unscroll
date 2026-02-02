(() => {
  const PLATFORM = 'youtube';
  let enabled = true;

  const ALLOWED_PATHS = [
    /^\/feed\/subscriptions/,
    /^\/watch/,
    /^\/channel\//,
    /^\/@/,
    /^\/results/,
    /^\/playlist/,
    /^\/feed\/library/,
    /^\/feed\/history/,
  ];

  function shouldRedirect(pathname) {
    if (!enabled) return null;

    // Shorts → watch
    const shortsMatch = pathname.match(/^\/shorts\/(.+)/);
    if (shortsMatch) {
      return `/watch?v=${shortsMatch[1]}`;
    }

    // Home → subscriptions
    if (pathname === '/' || pathname === '') {
      return '/feed/subscriptions';
    }

    // Trending / Explore → subscriptions
    if (pathname === '/feed/trending' || pathname === '/feed/explore') {
      return '/feed/subscriptions';
    }

    // If on an allowed path, no redirect
    for (const pattern of ALLOWED_PATHS) {
      if (pattern.test(pathname)) return null;
    }

    return null;
  }

  function handleNavigation() {
    const redirect = shouldRedirect(location.pathname);
    if (redirect) {
      // Use replaceState + reload for YouTube SPA to pick up the new URL
      if (location.pathname + location.search !== redirect) {
        window.location.replace(redirect);
      }
    }
  }

  function removeShortsShelves() {
    if (!enabled) return;
    document.querySelectorAll('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer[is-shorts]').forEach((el) => {
      el.remove();
    });
  }

  async function init() {
    enabled = await isUnscrollEnabled(PLATFORM);
    setUnscrollActive(enabled);

    handleNavigation();

    // YouTube fires this custom event on SPA navigations
    window.addEventListener('yt-navigate-finish', handleNavigation);
    window.addEventListener('unscroll:urlchange', handleNavigation);

    createUnscrollObserver(() => {
      if (!enabled) return;
      removeShortsShelves();
    });

    // React to live toggle changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[PLATFORM]) {
        enabled = changes[PLATFORM].newValue !== false;
        setUnscrollActive(enabled);
        if (enabled) {
          handleNavigation();
          removeShortsShelves();
        }
      }
    });
  }

  init();
})();
