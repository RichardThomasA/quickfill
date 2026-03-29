document.addEventListener('DOMContentLoaded', async () => {
  const btn = document.getElementById('toggle');
  const optionsLink = document.getElementById('open-options');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const key = `tab_disabled_${tab.id}`;

  chrome.storage.local.get([key], (data) => {
    btn.textContent = data[key] ? "Enable for Tab" : "Disable for Tab";
  });

  btn.onclick = () => {
    chrome.storage.local.get([key], (data) => {
      const isCurrentlyDisabled = data[key];
      chrome.storage.local.set({ [key]: !isCurrentlyDisabled }, () => {
        window.close(); // Close popup to apply
        chrome.tabs.reload(tab.id);
      });
    });
  };

  optionsLink.onclick = (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  };
});