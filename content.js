// This variable stores the last element you right-clicked
let lastTarget = null;

// Listen for the right-click event to capture the specific input field
document.addEventListener("contextmenu", (event) => {
  lastTarget = event.target;
}, true);

// Listen for the 'fill_text' message from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill_text" && lastTarget) {
    // Fill the value
    lastTarget.value = request.text;

    // IMPORTANT: Dispatch 'input' and 'change' events 
    // This ensures modern websites (React/Vue) recognize the new text
    lastTarget.dispatchEvent(new Event('input', { bubbles: true }));
    lastTarget.dispatchEvent(new Event('change', { bubbles: true }));
    
    sendResponse({ status: "success" });
  }
});