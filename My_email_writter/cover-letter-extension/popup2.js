document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('generate-btn').addEventListener('click', generateCoverLetter);
});

let lastCvTempFilename = null;
let lastSubject = '';

function getOrCreateResultDiv() {
    let resultDiv = document.getElementById('result');
    if (!resultDiv) {
        resultDiv = document.createElement('div');
        resultDiv.id = 'result';
        resultDiv.className = 'preview-area';
        document.querySelector('.container').appendChild(resultDiv);
    }
    return resultDiv;
}

function getOrCreateSpinner() {
    let spinner = document.getElementById('spinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.id = 'spinner';
        spinner.className = 'spinner';
        spinner.style.display = 'none';
        document.querySelector('.container').insertBefore(spinner, getOrCreateResultDiv());
    }
    return spinner;
}

async function generateCoverLetter() {
    const email = document.getElementById('email').value;
    if (!email) {
        alert('Please enter your email address');
        return;
    }
    const jobDescription = document.getElementById('job-description').value;
    const wordCount = document.getElementById('word-count').value;
    const model = document.getElementById('model').value;
    const cvFile = document.getElementById('cv-upload').files[0];

    const resultDiv = getOrCreateResultDiv();
    const spinner = getOrCreateSpinner();
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '';
    spinner.style.display = 'flex';

    const formData = new FormData();
    formData.append('job_description', jobDescription);
    formData.append('word_count', wordCount);
    formData.append('model', model);
    if (cvFile) {
        formData.append('cv', cvFile);
    }

    try {
        const response = await fetch('http://localhost:5000/generate', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        lastCvTempFilename = data.cv_temp_filename || null;
        lastSubject = data.subject || '';
        
        spinner.style.display = 'none';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <h3>Generated Email Subject:</h3>
            <input id="subject-input" type="text" value="${lastSubject.replace(/"/g, '&quot;')}" style="width:100%;margin-bottom:8px;" />
            <h3>Generated Cover Letter:</h3>
            <textarea id="cover-letter-preview" style="width:100%;min-height:120px;max-height:200px;height:160px;resize:vertical;">${data.cover_letter || ''}</textarea>
            <div class="form-group" style="margin-top:10px;">
                <label for="cv-upload-send">CV Upload for Email (Optional):</label>
                <input type="file" id="cv-upload-send" accept=".pdf,.docx">
            </div>
            <button id="send-email-btn" style="margin-top:10px;">Send Email</button>
        `;
        document.getElementById('send-email-btn').addEventListener('click', function() {
            sendEmail(lastCvTempFilename, email);
        });
    } catch (error) {
        spinner.style.display = 'none';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color:red;">Error generating cover letter: ' + error.message + '</span>';
    }
}

async function sendEmail(cvTempFilename, email) {
    const recipient = email;
    if (!recipient) return;

    const coverLetter = document.getElementById('cover-letter-preview').value;
    const subject = document.getElementById('subject-input').value;
    const cvFile = document.getElementById('cv-upload-send').files[0];

    const formData = new FormData();
    formData.append('recipient', recipient);
    formData.append('subject', subject);
    formData.append('cover_letter', coverLetter);
    formData.append('cv_temp_filename', cvTempFilename);
    if (cvFile) {
        formData.append('cv', cvFile);
    }

    try {
        const response = await fetch('http://localhost:5000/send_email', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        alert(data.message);
    } catch (error) {
        alert('Error sending email: ' + error.message);
    }
} 