const redirectedTabs = new Map();

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (!details.url) return;

  const url = details.url.toLowerCase();

  if (!url.includes('.bww')) return;
  if (details.url.startsWith(chrome.runtime.getURL('viewer.html'))) return;

  const viewerUrl =
    chrome.runtime.getURL('viewer.html') +
    '?src=' + encodeURIComponent(details.url);

  const lastRedirect = redirectedTabs.get(details.tabId);

  if (lastRedirect === viewerUrl) return;

  redirectedTabs.set(details.tabId, viewerUrl);

  try {
    await chrome.tabs.update(details.tabId, { url: viewerUrl });
  } catch (err) {
    console.error('Redirect fehlgeschlagen:', err);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  redirectedTabs.delete(tabId);
});