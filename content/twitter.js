(() => {
  const PLATFORM = 'twitter';
  let enabled = true;

  const ALLOWED_PATHS = [
    /^\/home/,
    /^\/compose/,
    /^\/messages/,
    /^\/notifications/,
    /^\/settings/,
    /^\/search/,
    /^\/i\//,
  ];

  function isProfilePath(pathname) {
    // Paths like /<username> that don't start with known routes
    return /^\/[a-zA-Z0-9_]{1,15}(\/|$)/.test(pathname) &&
      !/^\/(home|explore|compose|messages|notifications|settings|search|i)\b/.test(pathname);
  }

  function shouldRedirect(pathname) {
    if (!enabled) return null;

    // Explore → home
    if (pathname.startsWith('/explore')) {
      return '/home';
    }

    // Root → home (Twitter usually does this, but enforce it)
    if (pathname === '/' || pathname === '') {
      return '/home';
    }

    return null;
  }

  function handleNavigation() {
    const redirect = shouldRedirect(location.pathname);
    if (redirect && location.pathname !== redirect) {
      window.location.replace(redirect);
      return;
    }

    // Only do tab switching on home timeline
    if (location.pathname === '/home') {
      switchToFollowing();
    }
  }

  function switchToFollowing() {
    if (!enabled) return;

    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;

    const tabs = tablist.querySelectorAll('[role="tab"]');
    if (tabs.length < 2) return;

    const forYouTab = tabs[0];
    const followingTab = tabs[1];

    // Hide "For you" tab and any extra pinned list tabs
    forYouTab.closest('[role="presentation"]')?.style.setProperty('display', 'none', 'important');
    for (let i = 2; i < tabs.length; i++) {
      tabs[i].closest('[role="presentation"]')?.style.setProperty('display', 'none', 'important');
    }

    // Click "Following" if not already selected
    if (followingTab.getAttribute('aria-selected') !== 'true') {
      followingTab.click();
    }

    // Mark ready so CSS reveals the timeline
    document.documentElement.classList.add('unscroll-twitter-ready');
  }

  function removeSidebarSections() {
    if (!enabled) return;
    document.querySelectorAll('[data-testid="sidebarColumn"] section').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });
  }

  async function init() {
    enabled = await isUnscrollEnabled(PLATFORM);
    setUnscrollActive(enabled);

    handleNavigation();

    window.addEventListener('unscroll:urlchange', handleNavigation);

    createUnscrollObserver(() => {
      if (!enabled) return;
      if (location.pathname === '/home') {
        switchToFollowing();
      }
      removeSidebarSections();
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes[PLATFORM]) {
        enabled = changes[PLATFORM].newValue !== false;
        setUnscrollActive(enabled);
        if (enabled) {
          handleNavigation();
          removeSidebarSections();
        } else {
          document.documentElement.classList.remove('unscroll-twitter-ready');
        }
      }
    });
  }

  init();
})();
