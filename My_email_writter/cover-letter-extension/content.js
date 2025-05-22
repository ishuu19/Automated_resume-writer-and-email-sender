let floatingWindow = null;
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// Initialize when the script loads
console.log('Content script loaded');

function createFloatingWindow(email) {
  if (floatingWindow) return;

  console.log('Creating floating window');

  // Create the floating window container
  floatingWindow = document.createElement('div');
  floatingWindow.id = 'cover-letter-floating-window';
  floatingWindow.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    height: 600px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  `;

  // Create the header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 10px;
    background: #f5f5f5;
    border-bottom: 1px solid #ccc;
    border-radius: 8px 8px 0 0;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <span>Cover Letter Generator</span>
    <button id="close-floating" style="background: none; border: none; cursor: pointer; font-size: 20px;">×</button>
  `;

  // Create the iframe for the app
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    flex: 1;
    border: none;
    width: 100%;
    background: white;
  `;
  iframe.src = chrome.runtime.getURL('index.html');

  // Add elements to the floating window
  floatingWindow.appendChild(header);
  floatingWindow.appendChild(iframe);
  document.body.appendChild(floatingWindow);

  // Make window draggable
  makeDraggable(floatingWindow, header);

  // Add close button functionality
  document.getElementById('close-floating').addEventListener('click', () => {
    floatingWindow.remove();
    floatingWindow = null;
    // Notify background script
    chrome.runtime.sendMessage({ action: 'updateFloatingState', isFloating: false });
  });

  // Add resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.style.cssText = `
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: se-resize;
  `;
  floatingWindow.appendChild(resizeHandle);
  makeResizable(floatingWindow, resizeHandle);

  // Pass email to iframe
  iframe.onload = () => {
    iframe.contentWindow.postMessage({ type: 'setEmail', email: email }, '*');
  };

  // Ensure the window stays on top
  const observer = new MutationObserver(() => {
    if (floatingWindow && floatingWindow.parentElement) {
      floatingWindow.style.zIndex = '2147483647';
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('Floating window created');
}

function dragStart(e) {
  if (e.target.id === 'toggle-float' || e.target.id === 'close-window') return;
  
  initialX = e.clientX - xOffset;
  initialY = e.clientY - yOffset;

  if (e.target === floatingWindow || e.target.parentElement === floatingWindow) {
    isDragging = true;
    // Bring window to front when dragging
    floatingWindow.style.zIndex = '2147483647';
  }
}

function drag(e) {
  if (isDragging) {
    e.preventDefault();
    
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    xOffset = currentX;
    yOffset = currentY;

    setTranslate(currentX, currentY, floatingWindow);
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

function dragEnd() {
  initialX = currentX;
  initialY = currentY;
  isDragging = false;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  
  if (request.action === 'toggleFloatingWindow') {
    if (request.isFloating) {
      if (!floatingWindow) {
        createFloatingWindow(request.email);
      }
    } else {
      if (floatingWindow) {
        floatingWindow.remove();
        floatingWindow = null;
      }
    }
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async responses
}); 