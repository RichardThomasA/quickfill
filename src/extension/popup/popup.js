document.addEventListener('DOMContentLoaded', async () => {
  const btn = document.getElementById('toggle');
  const statusText = document.getElementById('status-text');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const hostname = new URL(tab.url).hostname;

  chrome.storage.sync.get(['allowedSites'], (data) => {
    const allowedSites = data.allowedSites || [];
    const isAllowed = allowedSites.includes(hostname);
    btn.textContent = isAllowed ? "Disable for this Site" : "Enable for this Site";
    statusText.textContent = isAllowed ? "Extension is Active" : "Extension is Disabled";
    document.querySelector('.dot').style.backgroundColor = isAllowed ? '#4caf50' : '#ff4b2b';
  });

  btn.onclick = () => {
    chrome.storage.sync.get(['allowedSites'], (data) => {
      const allowedSites = data.allowedSites || [];
      const hostname = new URL(tab.url).hostname;
      let newSites;
      if (allowedSites.includes(hostname)) {
        // Disable: remove
        newSites = allowedSites.filter(site => site !== hostname);
      } else {
        // Enable: add
        newSites = [...allowedSites, hostname];
      }
      chrome.storage.sync.set({ allowedSites: newSites }, () => {
        // Refresh all tabs
        chrome.runtime.sendMessage({ action: "refresh_all" });
        window.close();
      });
    });
  };

  document.getElementById('open-options').onclick = () => chrome.runtime.openOptionsPage();
});
