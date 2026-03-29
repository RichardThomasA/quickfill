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
  
  const isAllowedDomain = isUrlAllowed(tab.url, data.allowedSites);

  console.log('refreshTabState', tabId, tab.url, isAllowedDomain, data.allowedSites, data.texts);

  // Update Icon
  updateTabIcon(tabId, !isAllowedDomain);

  // Update Context Menu
  await chrome.contextMenus.removeAll();
  const validTexts = (data.texts || []).filter(t => t.label);
  console.log('validTexts', validTexts);
  if (isAllowedDomain && validTexts.length > 0) {
    chrome.contextMenus.create({
      id: "quickFillParent",
      title: "QuickFill",
      contexts: ["editable"]
    });

    validTexts.forEach((item, index) => {
      chrome.contextMenus.create({
        id: `fill-${index}`,
        parentId: "quickFillParent",
        title: item.label,
        contexts: ["editable"]
      });
    });
    console.log('Menu created');
  } else {
    console.log('Menu not created');
  }
}

// Listeners
chrome.tabs.onUpdated.addListener((id, info) => { 
  if(info.status === 'complete') {
    refreshTabState(id);
    // Inject content script on page load
    chrome.tabs.get(id, (tab) => {
      if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://') && !tab.url.startsWith('file://')) {
        chrome.scripting.executeScript({
          target: { tabId: id },
          files: ['content.js']
        }).catch(err => console.log('Content script already loaded'));
      }
    });
  }
});
chrome.tabs.onActivated.addListener(info => refreshTabState(info.tabId));

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "refresh_state") {
    refreshTabState(msg.tabId);
  } else if (msg.action === "refresh_all") {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => refreshTabState(tab.id));
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith("fill-")) {
    const index = parseInt(info.menuItemId.split("-")[1]);
    console.log('onClicked', info.menuItemId, index, tab.url);
    
    // Check if the tab URL is valid for content script injection
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('file://')) {
      console.error('Cannot inject on this tab:', tab.url);
      return;
    }
    
    chrome.storage.sync.get(['texts'], (data) => {
      const textValue = data.texts[index].value;
      sendTextToTab(tab.id, textValue, 0);
    });
  }
});

function sendTextToTab(tabId, textValue, retryCount = 0) {
  chrome.tabs.sendMessage(tabId, { action: "fill_text", text: textValue }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError.message);
      
      if (retryCount < 3) {
        console.log('Attempting to inject content script (retry', retryCount + 1, ')...');
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Failed to inject script:', chrome.runtime.lastError.message);
          } else {
            console.log('Script injected, waiting 500ms before retry...');
            // Wait for script to be ready
            setTimeout(() => {
              sendTextToTab(tabId, textValue, retryCount + 1);
            }, 500);
          }
        });
      } else {
        console.error('Max retries reached');
      }
    } else {
      console.log('Message sent successfully:', response);
    }
  });
}