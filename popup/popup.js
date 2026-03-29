document.addEventListener('DOMContentLoaded', async () => {
  const btn = document.getElementById('toggle');
  const statusText = document.getElementById('status-text');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const key = `disabled_${tab.id}`;

  chrome.storage.local.get([key], (data) => {
    const isDisabled = !!data[key];
    btn.textContent = isDisabled ? "Enable for this Tab" : "Disable for this Tab";
    statusText.textContent = isDisabled ? "Extension is Paused" : "Extension is Active";
    document.querySelector('.dot').style.backgroundColor = isDisabled ? '#ff4b2b' : '#4caf50';
  });

  btn.onclick = () => {
    chrome.storage.local.get([key], (data) => {
      const newState = !data[key];
      chrome.storage.local.set({ [key]: newState }, () => {
        // Force background to update icon and menus immediately
        chrome.runtime.sendMessage({ action: "refresh_state", tabId: tab.id });
        window.close();
      });
    });
  };

  document.getElementById('open-options').onclick = () => chrome.runtime.openOptionsPage();
});