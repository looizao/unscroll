const toggles = document.querySelectorAll('input[data-platform]');

// Load current state
chrome.storage.sync.get(['youtube', 'instagram', 'twitter'], (result) => {
  toggles.forEach((toggle) => {
    const platform = toggle.dataset.platform;
    toggle.checked = result[platform] !== false;
  });
});

// Save on change
toggles.forEach((toggle) => {
  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ [toggle.dataset.platform]: toggle.checked });
  });
});
