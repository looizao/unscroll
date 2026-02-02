chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['youtube', 'instagram', 'twitter'], (result) => {
    const defaults = {
      youtube: result.youtube ?? true,
      instagram: result.instagram ?? true,
      twitter: result.twitter ?? true,
    };
    chrome.storage.sync.set(defaults);
  });
});
