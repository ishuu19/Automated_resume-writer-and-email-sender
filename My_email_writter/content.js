let floatingWindow = null;
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

function createFloatingWindow() {
  if (floatingWindow) return;

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
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    resize: both;
  `;

  // Create the header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 10px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <span>Cover Letter Generator</span>
    <div>
      <button id="toggle-float" style="margin-right: 8px;">Toggle Float</button>
      <button id="close-window">×</button>
    </div>
  `;

  // Create the iframe for the app
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    flex: 1;
    width: 100%;
    border: none;
  `;
  iframe.src = chrome.runtime.getURL('index.html');

  // Add elements to the floating window
  floatingWindow.appendChild(header);
  floatingWindow.appendChild(iframe);
  document.body.appendChild(floatingWindow);

  // Add event listeners
  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  // Close button
  document.getElementById('close-window').addEventListener('click', () => {
    floatingWindow.remove();
    floatingWindow = null;
  });

  // Toggle float button
  document.getElementById('toggle-float').addEventListener('click', () => {
    chrome.storage.local.get(['isFloating'], function(result) {
      const newIsFloating = !result.isFloating;
      chrome.storage.local.set({ isFloating: newIsFloating });
      floatingWindow.style.position = newIsFloating ? 'fixed' : 'absolute';
    });
  });
}

function dragStart(e) {
  if (e.target.id === 'toggle-float' || e.target.id === 'close-window') return;
  
  initialX = e.clientX - xOffset;
  initialY = e.clientY - yOffset;

  if (e.target === floatingWindow || e.target.parentElement === floatingWindow) {
    isDragging = true;
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

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleFloatingWindow') {
    if (request.isFloating) {
      createFloatingWindow();
    } else if (floatingWindow) {
      floatingWindow.remove();
      floatingWindow = null;
    }
  }
}); 