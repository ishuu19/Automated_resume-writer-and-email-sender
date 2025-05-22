from flask import Flask, render_template, request, jsonify
import os
import requests
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re
from docx import Document
from email.utils import formatdate, make_msgid
from email.mime.application import MIMEApplication
import uuid
from werkzeug.utils import secure_filename
import json

app = Flask(__name__)
load_dotenv()

OLLAMA_API_URL = "http://localhost:11434/api/generate"
EMAIL_USER = os.getenv('EMAIL_USER')
EMAIL_PASS = os.getenv('EMAIL_PASS')

DEFAULT_RESUMES = [
    "Anayed Hossain Eshan_resume.pdf"
]

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def extract_text_from_pdf(pdf_file):
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def extract_text_from_docx(docx_file):
    doc = Document(docx_file)
    text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    return text

def extract_text_from_file(file_storage):
    filename = file_storage.filename.lower()
    if filename.endswith('.pdf'):
        return extract_text_from_pdf(file_storage)
    elif filename.endswith('.docx'):
        return extract_text_from_docx(file_storage)
    else:
        return ""

def extract_text_from_default_resumes():
    combined_text = ""
    for resume_path in DEFAULT_RESUMES:
        if os.path.exists(resume_path):
            if resume_path.lower().endswith('.pdf'):
                with open(resume_path, "rb") as f:
                    combined_text += extract_text_from_pdf(f) + "\n"
            elif resume_path.lower().endswith('.docx'):
                with open(resume_path, "rb") as f:
                    combined_text += extract_text_from_docx(f) + "\n"
    return combined_text

def extract_name_from_cv(cv_text):
    # Try to find the first non-empty line that looks like a name (letters, spaces, maybe a dot)
    for line in cv_text.splitlines():
        line = line.strip()
        if line and re.match(r'^[A-Za-z .-]{3,}$', line) and len(line.split()) <= 5:
            return line
    return "Anayed Hossain Eshan"

def generate_with_ollama(prompt, model="deepseek-llm"):
    response = requests.post(
        OLLAMA_API_URL,
        json={
            "model": model,
            "prompt": prompt,
            "stream": False
        }
    )
    if response.status_code == 200:
        return response.json()["response"]
    else:
        raise Exception(f"Ollama API error: {response.text}")

def enforce_strict_word_limit(text, word_limit):
    words = text.split()
    if len(words) > word_limit:
        return ' '.join(words[:word_limit])
    elif len(words) < word_limit:
        return text + '\n\n(Note: The generated letter was shorter than the requested word count.)'
    return text

def remove_existing_signature(text):
    # Remove common signature lines like 'Sincerely,', 'Regards,', 'Best regards,', etc.
    signature_patterns = [
        r'\n\s*Sincerely,.*',
        r'\n\s*Regards,.*',
        r'\n\s*Best regards,.*',
        r'\n\s*Yours truly,.*',
        r'\n\s*Yours sincerely,.*',
        r'\n\s*Respectfully,.*',
        r'\n\s*Thank you,.*',
        r'\n\s*Thanks,.*',
    ]
    for pattern in signature_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    return text.strip()

def generate_cover_letter(job_description, cv_text, word_count, name):
    strict_line = "Do not write anything that is not on my CV."
    spam_line = (
        "Write the email in a way that Gmail will not classify it as spam. "
        "Use natural, professional, and personalized language. Avoid generic, template, or salesy phrases. "
        "Make the letter specific to the job and company."
    )
    word_limit_line = f"STRICT: Do not exceed {word_count} words. The cover letter MUST be exactly {word_count} words."
    greeting_line = (
        "Start the letter with a personalized greeting using the hiring manager's name or the company name, "
        "extracted from the job description. For example: 'Dear [Hiring Manager's Name],' or 'Dear [Company Name] Team,' change the name to the actual name of the hiring manager or company."
    )
    closing_line = f"End the letter with 'Regards, {name}\n' as the only closing.End the letter with 'Regards, {name}\n' as the only closing."
    prompt = (
        f"{word_limit_line}\n"
        f"{strict_line}\n"
        f"{spam_line}\n"
        f"{word_limit_line}\n"
        f"Write a professional, narrative cover letter (not bullet points) with exactly {word_count} words. "
        f"{word_limit_line} "
        f"Strictly adhere to the word limit. "
        f"Only include skills and experiences that are mentioned in the CV. "
        f"Personalize the letter for the specific job and company described below. "
        f"{greeting_line} "
        f"Use a natural, conversational tone, and avoid generic or spammy phrases. "
        f"{closing_line}\n\n"
        f"Job Description:\n{job_description}\n\nCV:\n{cv_text}\n\n"
        f"{strict_line}\n{spam_line}\n{word_limit_line}"
        f"STRICT: Do not exceed {word_count} words. The cover letter MUST be exactly {word_count} words."
    )
    letter = generate_with_ollama(prompt)
    # Remove any existing signature
    letter = remove_existing_signature(letter)
    # Ensure the letter ends with the correct closing
    if not re.search(rf"Regards,\s*{re.escape(name)}\s*$", letter, re.IGNORECASE | re.MULTILINE):
        letter = letter.rstrip() + f"\n\nRegards, {name}\n"
    return letter

def extract_subject_from_text(subject_text):
    # Find the first line containing 'Subject:' (case-insensitive)
    for line in subject_text.splitlines():
        if 'subject:' in line.lower():
            # Remove 'Subject:' and trim
            subject = re.sub(r'(?i)subject:', '', line).strip()
            # Limit to 10 words
            return ' '.join(subject.split()[:10])
    # If not found, use the first non-empty line, limited to 10 words
    for line in subject_text.splitlines():
        if line.strip():
            return ' '.join(line.strip().split()[:10])
    return "Job Application"

def extract_job_position(job_description):
    # Try to extract the job position from the first line or first phrase
    for line in job_description.splitlines():
        line = line.strip()
        if line:
            # If the line contains 'for', e.g., 'Job Application for Data Scientist', extract after 'for'
            match = re.search(r'for\s+(.+)', line, re.IGNORECASE)
            if match:
                return match.group(1).strip()
            # Otherwise, use the whole line as the job position
            return line
    return "the position"

def generate_email_subject(job_description):
    job_position = extract_job_position(job_description)
    return f"Application for {job_position}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    job_description = request.form['job_description']
    word_count = int(request.form['word_count'])
    cv_file = request.files.get('cv')
    temp_filename = None
    temp_path = None
    meta_path = None
    original_filename = None

    try:
        if cv_file and cv_file.filename:
            cv_text = extract_text_from_file(cv_file)
            # Save the uploaded file to a temp location
            ext = os.path.splitext(secure_filename(cv_file.filename))[1]
            temp_filename = f"{uuid.uuid4().hex}{ext}"
            temp_path = os.path.join(UPLOAD_FOLDER, temp_filename)
            cv_file.stream.seek(0)
            cv_file.save(temp_path)
            # Save the original filename in a .meta file
            original_filename = cv_file.filename
            meta_path = temp_path + '.meta'
            with open(meta_path, 'w') as f:
                json.dump({'original_filename': original_filename}, f)
        else:
            cv_text = extract_text_from_default_resumes()

        name = extract_name_from_cv(cv_text)
        cover_letter = generate_cover_letter(job_description, cv_text, word_count, name)
        subject = generate_email_subject(job_description)
        
        return jsonify({
            'cover_letter': cover_letter,
            'subject': subject,
            'cv_temp_filename': temp_filename
        })
    except Exception as e:
        # Clean up temp file if it exists and there was an error
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        if meta_path and os.path.exists(meta_path):
            os.remove(meta_path)
        raise e

@app.route('/send_email', methods=['POST'])
def send_email():
    recipient = request.form.get('recipient')
    subject = request.form.get('subject')
    cover_letter = request.form.get('cover_letter')
    cv_temp_filename = request.form.get('cv_temp_filename')
    cv_file = request.files.get('cv')
    attachment_path = None
    attachment_filename = None
    new_temp_path = None
    meta_path = None

    try:
        # Prefer a new file if uploaded, otherwise use the temp file
        if cv_file and cv_file.filename:
            ext = os.path.splitext(secure_filename(cv_file.filename))[1]
            temp_filename = f"{uuid.uuid4().hex}{ext}"
            new_temp_path = os.path.join(UPLOAD_FOLDER, temp_filename)
            cv_file.stream.seek(0)
            cv_file.save(new_temp_path)
            attachment_path = new_temp_path
            attachment_filename = cv_file.filename
        elif cv_temp_filename:
            temp_path = os.path.join(UPLOAD_FOLDER, cv_temp_filename)
            meta_path = temp_path + '.meta'
            if os.path.exists(temp_path):
                attachment_path = temp_path
                # Try to get the original filename from the .meta file
                if os.path.exists(meta_path):
                    with open(meta_path, 'r') as f:
                        meta = json.load(f)
                        attachment_filename = meta.get('original_filename', cv_temp_filename)
                else:
                    attachment_filename = cv_temp_filename
            else:
                attachment_path = None
                attachment_filename = None
        else:
            attachment_path = None
            attachment_filename = None

        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = recipient
        msg['Subject'] = subject
        msg['Reply-To'] = EMAIL_USER
        msg['Date'] = formatdate(localtime=True)
        msg['Message-ID'] = make_msgid()
        msg.attach(MIMEText(cover_letter, 'plain'))

        # Attach the CV if present and valid
        if attachment_path and attachment_filename and os.path.exists(attachment_path):
            with open(attachment_path, 'rb') as f:
                part = MIMEApplication(f.read(), Name=attachment_filename)
                part['Content-Disposition'] = f'attachment; filename="{attachment_filename}"'
                msg.attach(part)

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, recipient, msg.as_string())

        return jsonify({'success': True, 'message': 'Email sent successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to send email: {str(e)}'})
    finally:
        # Clean up both the new temp file and the original temp file and meta file
        if new_temp_path and os.path.exists(new_temp_path):
            os.remove(new_temp_path)
        if cv_temp_filename:
            old_temp_path = os.path.join(UPLOAD_FOLDER, cv_temp_filename)
            if os.path.exists(old_temp_path):
                os.remove(old_temp_path)
            old_meta_path = old_temp_path + '.meta'
            if os.path.exists(old_meta_path):
                os.remove(old_meta_path)

if __name__ == '__main__':
    app.run(debug=True) 