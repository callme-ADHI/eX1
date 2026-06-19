// Background Service Worker for eX1 HUD

// Listen for keyboard shortcuts configured in manifest.json
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-overlay") {
    // Send a message to the active tab to toggle the overlay
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: "toggle-hud" }).catch((err) => {
          console.warn("Could not communicate with content script in active tab. It might not be loaded yet.", err);
        });
      }
    });
  }
});

// Listen for custom messages from the content scripts
chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (request.action === "open-tab") {
    chrome.tabs.create({
      url: request.url,
      active: request.active ?? true
    });
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === "get-active-tab-url") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      sendResponse({ url: activeTab?.url || "" });
    });
    return true; // Keep message channel open for async response
  }
});
