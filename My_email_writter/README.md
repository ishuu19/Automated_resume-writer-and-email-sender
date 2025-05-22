# Cover Letter Generator

A web application that automatically generates personalized cover letters based on your CV and job descriptions, and sends them via Gmail. Uses Ollama for local AI text generation.

## Features

- Upload your CV in PDF format
- Input job description
- Specify desired word count for the cover letter
- Automatic cover letter generation using local Ollama AI
- Email preview with generated subject line
- Direct email sending through Gmail

## Prerequisites

- Ollama installed and running locally (default port: 11434)
- Python 3.7 or higher
- Gmail account

## Setup Instructions

1. Install Ollama:
   - Follow the instructions at [Ollama's official website](https://ollama.ai/)
   - Pull the llama2 model:
   ```bash
   ollama pull llama2
   ```

2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

3. Set up Gmail API:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Gmail API
   - Create OAuth 2.0 credentials
   - Download the credentials and save them as `credentials.json` in the project root

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to `http://localhost:5000`

## First-time Gmail Authentication

When you first try to send an email, the application will open a browser window asking you to authorize the application to access your Gmail account. Follow the prompts to grant access.

## Usage

1. Enter the job description in the text area
2. Input the recipient's email address
3. Specify the desired word count for the cover letter
4. Upload your CV in PDF format
5. Click "Generate Cover Letter"
6. Review the generated cover letter and subject line
7. Click "Send Email" to send the cover letter

## Security Notes

- Your Gmail credentials are stored locally in `token.pickle`
- Never share your `credentials.json` file
- The application only requests permission to send emails, not to read them
- All AI processing is done locally through Ollama 