// Helper to check exact domain match (no subdomains)
function isUrlAllowed(url, allowedSites) {
  try {
    const hostname = new URL(url).hostname;
    // Requirement: example.com matches example.com/path but NOT sub.example.com
    return allowedSites.includes(hostname);
  } catch (e) { return false; }
}

async function refreshContextMenu(tab) {
  await chrome.contextMenus.removeAll();
  if (!tab || !tab.url) return;

  const data = await chrome.storage.sync.get(['texts', 'enabledSites']);
  const sites = data.enabledSites || [];
  const texts = data.texts || [];

  if (isUrlAllowed(tab.url, sites) && texts.length > 0) {
    chrome.contextMenus.create({
      id: "quickFillParent",
      title: "QuickFill",
      contexts: ["editable"]
    });

    texts.forEach((item, index) => {
      chrome.contextMenus.create({
        id: `fill-${index}`,
        parentId: "quickFillParent",
        title: item.label,
        contexts: ["editable"]
      });
    });
  }
}

// Update menu when switching tabs or loading pages
chrome.tabs.onUpdated.addListener((id, info, tab) => { if(info.status === 'complete') refreshContextMenu(tab); });
chrome.tabs.onActivated.addListener(async (info) => { const tab = await chrome.tabs.get(info.tabId); refreshContextMenu(tab); });

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith("fill-")) {
    const index = parseInt(info.menuItemId.split("-")[1]);
    chrome.storage.sync.get(['texts'], (data) => {
      chrome.tabs.sendMessage(tab.id, { action: "fill_text", text: data.texts[index].value });
    });
  }
});