let lastElement = null;

document.addEventListener("contextmenu", (e) => { lastElement = e.target; }, true);

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "fill_text" && lastElement) {
    const { enabledSites } = await chrome.storage.sync.get(['enabledSites']);
    const tabState = await chrome.storage.local.get([`tab_active_current`]); // Simplified for demonstration
    
    // Final check: Is domain exactly in list?
    if (enabledSites.includes(window.location.hostname)) {
       lastElement.value = request.text;
       lastElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
});