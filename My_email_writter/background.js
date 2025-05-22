// Initialize floating state when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isFloating: true });
});

// Handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  // Get current floating state
  chrome.storage.local.get(['isFloating'], function(result) {
    const isFloating = result.isFloating !== undefined ? result.isFloating : true;
    
    // Send message to content script to toggle window
    chrome.tabs.sendMessage(tab.id, {
      action: 'toggleFloatingWindow',
      isFloating: isFloating
    });
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateFloatingState') {
    chrome.storage.local.set({ isFloating: request.isFloating });
  }
}); 