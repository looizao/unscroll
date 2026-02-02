// --- URL change monitor ---
// Monkey-patch pushState/replaceState and listen for popstate to detect SPA navigations.
(() => {
  const dispatch = () => window.dispatchEvent(new CustomEvent('unscroll:urlchange'));

  const wrap = (method) => {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      dispatch();
      return result;
    };
  };

  wrap('pushState');
  wrap('replaceState');
  window.addEventListener('popstate', dispatch);
})();

// --- Storage helper ---
function isUnscrollEnabled(platform) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(platform, (result) => {
      resolve(result[platform] !== false);
    });
  });
}

// --- Toggle class helper ---
function setUnscrollActive(enabled) {
  if (enabled) {
    document.documentElement.classList.add('unscroll-active');
  } else {
    document.documentElement.classList.remove('unscroll-active');
  }
}

// --- MutationObserver factory ---
// Creates an observer that debounces callbacks via requestAnimationFrame.
// Waits for document.body before starting.
function createUnscrollObserver(callback) {
  let rafId = null;

  const observer = new MutationObserver(() => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      callback();
    });
  });

  const start = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  if (document.body) {
    start();
  } else {
    const waitForBody = new MutationObserver(() => {
      if (document.body) {
        waitForBody.disconnect();
        start();
      }
    });
    waitForBody.observe(document.documentElement, { childList: true });
  }

  return observer;
}
