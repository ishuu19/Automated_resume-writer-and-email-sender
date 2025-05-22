# Cover Letter Generator Chrome Extension

A floating window Chrome extension that helps you generate professional cover letters based on your CV and job descriptions.

## Features

- Floating window that stays on top of other content
- Draggable and resizable interface
- Toggle between floating and fixed modes
- Uses your existing cover letter generator backend
- Supports PDF and DOCX CV uploads
- Word limit enforcement
- Anti-spam measures for email sending

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar to open the floating window
2. The window will appear in the top-right corner of your screen
3. You can:
   - Drag the window by its header
   - Resize the window by dragging its bottom-right corner
   - Toggle floating mode using the "Toggle Float" button
   - Close the window using the "×" button

## Development

The extension consists of:
- `manifest.json`: Extension configuration
- `background.js`: Handles extension icon clicks
- `content.js`: Creates and manages the floating window
- `styles.css`: Styles for the floating window
- `icons/`: Extension icons

## Requirements

- Chrome browser
- Your cover letter generator backend running locally
- Ollama running locally for LLM support

## Notes

- The extension requires the backend server to be running
- Make sure your `.env` file is properly configured for email sending
- The floating window will persist across page navigation
- You can toggle between floating and fixed modes at any time 