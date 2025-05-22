document.getElementById('openFloating').addEventListener('click', async () => {
    try {
        const email = document.getElementById('email').value;
        if (!email) {
            alert('Please enter your email address');
            return;
        }

        // Get the current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Try to inject the content script
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (error) {
            console.log('Could not inject script, opening in new window');
            // If we can't inject (chrome:// URL), open in a new window
            chrome.windows.create({
                url: chrome.runtime.getURL('index.html'),
                type: 'popup',
                width: 400,
                height: 600
            });
            return;
        }

        // If injection succeeded, send message to create floating window
        chrome.tabs.sendMessage(tab.id, {
            action: 'toggleFloatingWindow',
            isFloating: true,
            email: email
        });
    } catch (error) {
        console.error('Error:', error);
    }
}); 