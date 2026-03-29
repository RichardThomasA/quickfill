// Helper: Check if domain matches exactly (no subdomains)
function isUrlAllowed(url, allowedSites) {
  try {
    const hostname = new URL(url).hostname;
    return (allowedSites || []).includes(hostname);
  } catch (e) { return false; }
}

// Update Icon based on disabled state
async function updateTabIcon(tabId, isDisabled) {
  const suffix = isDisabled ? "_grey.png" : ".png";
  chrome.action.setIcon({
    tabId: tabId,
    path: {
      "16": `icons/icon16${suffix}`,
      "48": `icons/icon48${suffix}`,
      "128": `icons/icon128${suffix}`
    }
  });
}

// Refresh Menus and Icons
async function refreshTabState(tabId) {
  const tab = await chrome.tabs.get(tabId);
  const data = await chrome.storage.sync.get(['texts', 'allowedSites']);
  const localData = await chrome.storage.local.get([`disabled_${tabId}`]);
  
  const isDisabled = !!localData[`disabled_${tabId}`];
  const isAllowedDomain = isUrlAllowed(tab.url, data.allowedSites);

  // Update Icon
  updateTabIcon(tabId, isDisabled);

  // Update Context Menu
  await chrome.contextMenus.removeAll();
  if (isAllowedDomain && !isDisabled && data.texts?.length > 0) {
    chrome.contextMenus.create({
      id: "quickFillParent",
      title: "QuickFill",
      contexts: ["editable"]
    });

    data.texts.forEach((item, index) => {
      chrome.contextMenus.create({
        id: `fill-${index}`,
        parentId: "quickFillParent",
        title: item.label,
        contexts: ["editable"]
      });
    });
  }
}

// Listeners
chrome.tabs.onUpdated.addListener((id, info) => { if(info.status === 'complete') refreshTabState(id); });
chrome.tabs.onActivated.addListener(info => refreshTabState(info.tabId));

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "refresh_state") {
    refreshTabState(msg.tabId);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith("fill-")) {
    const index = parseInt(info.menuItemId.split("-")[1]);
    chrome.storage.sync.get(['texts'], (data) => {
      chrome.tabs.sendMessage(tab.id, { action: "fill_text", text: data.texts[index].value });
    });
  }
});