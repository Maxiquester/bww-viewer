const redirectedTabs = new Map();

browser.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (!details.url) return;

  const url = details.url.toLowerCase();

  if (!url.includes('.bww')) return;
  if (details.url.startsWith(browser.runtime.getURL('viewer.html'))) return;

  const viewerUrl =
    browser.runtime.getURL('viewer.html') +
    '?src=' + encodeURIComponent(details.url);

  const lastRedirect = redirectedTabs.get(details.tabId);

  if (lastRedirect === viewerUrl) return;

  redirectedTabs.set(details.tabId, viewerUrl);

  try {
    await browser.tabs.update(details.tabId, { url: viewerUrl });
  } catch (err) {
    console.error('Redirect fehlgeschlagen:', err);
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  redirectedTabs.delete(tabId);
});
