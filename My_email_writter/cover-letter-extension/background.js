// Initialize floating state when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isFloating: true });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateFloatingState') {
    chrome.storage.local.set({ isFloating: request.isFloating });
  }
  return true; // Keep the message channel open for async responses
}); 