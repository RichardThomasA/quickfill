// This variable stores the last element you right-clicked
let lastTarget = null;

console.log('QuickFill content script loaded');

// Listen for the right-click event to capture the specific input field
document.addEventListener("contextmenu", (event) => {
  lastTarget = event.target;
  console.log('Context menu target:', lastTarget);
}, true);

// Listen for the 'fill_text' message from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request, 'Target:', lastTarget);
  if (request.action === "fill_text") {
    if (lastTarget) {
      console.log('fill_text', request.text, lastTarget);
      // Fill the value
      if (lastTarget.tagName === 'INPUT' || lastTarget.tagName === 'TEXTAREA') {
        lastTarget.value = request.text;
      } else if (lastTarget.contentEditable === 'true') {
        lastTarget.textContent = request.text;
      }

      // IMPORTANT: Dispatch 'input' and 'change' events 
      // This ensures modern websites (React/Vue) recognize the new text
      lastTarget.dispatchEvent(new Event('input', { bubbles: true }));
      lastTarget.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('Text injected successfully');
      sendResponse({ status: "success" });
    } else {
      console.log('fill_text: no lastTarget available');
      sendResponse({ status: "error", message: "No target element found" });
    }
  }
  return true; // Keep channel open for async response
});