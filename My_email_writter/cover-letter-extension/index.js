document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('generate-btn').addEventListener('click', generateCoverLetter);
});

async function generateCoverLetter() {
    const jobDescription = document.getElementById('job-description').value;
    const wordCount = document.getElementById('word-count').value;
    const model = document.getElementById('model').value;
    const cvFile = document.getElementById('cv-upload').files[0];

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
        
        const resultDiv = document.getElementById('result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <h3>Generated Cover Letter:</h3>
            <pre>${data.cover_letter}</pre>
            <button id="send-email-btn">Send Email</button>
        `;
        document.getElementById('send-email-btn').addEventListener('click', function() {
            sendEmail(data.cv_temp_filename);
        });
    } catch (error) {
        alert('Error generating cover letter: ' + error.message);
    }
}

async function sendEmail(cvTempFilename) {
    const recipient = prompt('Enter recipient email:');
    if (!recipient) return;

    const formData = new FormData();
    formData.append('recipient', recipient);
    formData.append('subject', document.querySelector('#result pre').textContent.split('\n')[0]);
    formData.append('cover_letter', document.querySelector('#result pre').textContent);
    formData.append('cv_temp_filename', cvTempFilename);

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