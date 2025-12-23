// ============================================
// TECH TEAM REQUIREMENT FORM - MAIN SCRIPT
// ============================================

// CONFIGURATION - YOUR URL IS ALREADY HERE
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwhGs_GNiLey65fWtv8aHNu1AZ4CtzWnrI9RDyCV5UbyelJpIXFzggsXym8pEnZJPHq/exec;

// Global Variables
let quill;
let allRequirements = [];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeQuillEditor();
});

function initializeQuillEditor() {
    quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Describe your requirement in detail...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }],
                ['link'],
                ['clean']
            ]
        }
    });
}

// ============================================
// TAB NAVIGATION
// ============================================
function showTab(tab) {
    const submitTab = document.getElementById('submitTab');
    const trackTab = document.getElementById('trackTab');
    const buttons = document.querySelectorAll('.nav-tabs button');
    
    if (tab === 'submit') {
        submitTab.classList.remove('hidden');
        trackTab.classList.add('hidden');
        buttons[0].classList.add('active');
        buttons[1].classList.remove('active');
    } else {
        submitTab.classList.add('hidden');
        trackTab.classList.remove('hidden');
        buttons[0].classList.remove('active');
        buttons[1].classList.add('active');
    }
}

// ============================================
// FILE UPLOAD HANDLING
// ============================================
function displayFiles() {
    const fileInput = document.getElementById('fileUpload');
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    if (fileInput.files.length > 0) {
        Array.from(fileInput.files).forEach((file, index) => {
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            
            if (file.size > 10 * 1024 * 1024) {
                alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
                return;
            }
            
            const ext = file.name.split('.').pop().toLowerCase();
            let icon = 'fa-file';
            let iconColor = '#6b7280';
            
            if (['pdf'].includes(ext)) {
                icon = 'fa-file-pdf';
                iconColor = '#ef4444';
            } else if (['doc', 'docx'].includes(ext)) {
                icon = 'fa-file-word';
                iconColor = '#2563eb';
            } else if (['xls', 'xlsx'].includes(ext)) {
                icon = 'fa-file-excel';
                iconColor = '#16a34a';
            } else if (['ppt', 'pptx'].includes(ext)) {
                icon = 'fa-file-powerpoint';
                iconColor = '#ea580c';
            } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                icon = 'fa-file-image';
                iconColor = '#9333ea';
            } else if (['zip', 'rar'].includes(ext)) {
                icon = 'fa-file-zipper';
                iconColor = '#ca8a04';
            }
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas ${icon} file-icon" style="color: ${iconColor}"></i>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${fileSize} MB</div>
                    </div>
                </div>
                <button type="button" class="remove-btn" onclick="removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileList.appendChild(fileItem);
        });
    }
}

function removeFile(index) {
    const fileInput = document.getElementById('fileUpload');
    const dt = new DataTransfer();
    
    Array.from(fileInput.files).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
    });
    
    fileInput.files = dt.files;
    displayFiles();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// ============================================
// FORM SUBMISSION - FIXED FOR GOOGLE APPS SCRIPT
// ============================================
document.getElementById('requirementForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const editorContent = quill.root.innerHTML;
    const editorText = quill.getText().trim();
    
    if (editorText.length === 0) {
        alert('Please provide a detailed description of your requirement');
        return;
    }
    
    document.getElementById('loadingOverlay').classList.add('show');
    document.getElementById('successMessage').classList.remove('show');
    document.getElementById('errorMessage').classList.remove('show');
    
    try {
        const formData = {
            memberName: document.getElementById('memberName').value.trim(),
            memberEmail: document.getElementById('memberEmail').value.trim().toLowerCase(),
            department: document.getElementById('department').value,
            priority: document.getElementById('priority').value,
            title: document.getElementById('title').value.trim(),
            description: editorContent,
            timestamp: new Date().toISOString(),
            status: 'Pending'
        };
        
        const fileInput = document.getElementById('fileUpload');
        const files = [];
        
        if (fileInput.files.length > 0) {
            for (let file of fileInput.files) {
                const base64 = await fileToBase64(file);
                files.push({
                    name: file.name,
                    mimeType: file.type,
                    data: base64
                });
            }
        }
        
        formData.files = files;
        
        // THIS IS THE FIX - Proper Google Apps Script request
        const response = await fetch(SCRIPT_URL, {
            redirect: 'follow',
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'submitRequirement',
                data: formData
            })
        });
        
        const result = await response.json();
        console.log('Submit response:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Submission failed');
        }
        
        document.getElementById('loadingOverlay').classList.remove('show');
        document.getElementById('successMessage').classList.add('show');
        
        document.getElementById('requirementForm').reset();
        document.getElementById('fileList').innerHTML = '';
        quill.setContents([]);
        
        setTimeout(() => {
            document.getElementById('successMessage').classList.remove('show');
        }, 5000);
        
    } catch (error) {
        console.error('Submission error:', error);
        document.getElementById('loadingOverlay').classList.remove('show');
        document.getElementById('errorMessage').classList.add('show');
        document.getElementById('errorText').textContent = error.message || 'An error occurred. Please try again.';
    }
});

// ============================================
// SEARCH REQUIREMENTS - FIXED
// ============================================
async function searchRequirements() {
    const email = document.getElementById('searchEmail').value.trim().toLowerCase();
    
    if (!email) {
        alert('Please enter your email address');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    document.getElementById('searchLoading').classList.remove('hidden');
    document.getElementById('resultsContainer').classList.add('hidden');
    document.getElementById('noResults').classList.add('hidden');
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getRequirements&email=${encodeURIComponent(email)}`);
        const result = await response.json();
        
        console.log('Search response:', result);
        
        document.getElementById('searchLoading').classList.add('hidden');
        
        if (result.success && result.data && result.data.length > 0) {
            allRequirements = result.data;
            displayRequirements(allRequirements);
        } else {
            document.getElementById('noResults').classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Search error:', error);
        document.getElementById('searchLoading').classList.add('hidden');
        alert('Error loading requirements. Please try again.');
    }
}

function displayRequirements(requirements) {
    document.getElementById('resultsContainer').classList.remove('hidden');
    document.getElementById('resultCount').textContent = requirements.length;
    
    const container = document.getElementById('requirementsList');
    container.innerHTML = '';
    
    requirements.forEach(req => {
        const card = createRequirementCard(req);
        container.appendChild(card);
    });
}

function createRequirementCard(req) {
    const card = document.createElement('div');
    card.className = 'requirement-card';
    card.setAttribute('data-status', req.status);
    
    let badgeClass = 'badge-pending';
    if (req.status === 'In Progress') badgeClass = 'badge-progress';
    if (req.status === 'Done') badgeClass = 'badge-done';
    
    const date = new Date(req.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    card.innerHTML = `
        <div class="card-header">
            <div>
                <span class="badge ${badgeClass}">${req.status}</span>
                <span class="badge" style="background: #e0e7ff; color: #3730a3;">${req.priority}</span>
            </div>
            <div style="text-align: right; font-size: 12px; color: #6b7280;">
                <div><i class="far fa-calendar"></i> ${formattedDate}</div>
                <div style="margin-top: 5px;"><i class="fas fa-building"></i> ${req.department}</div>
            </div>
        </div>
        
        <h3 style="font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 10px;">${req.title}</h3>
        
        <div style="color: #4b5563; margin-bottom: 15px;">
            ${req.description}
        </div>
        
        ${req.fileUrls ? `
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                <strong style="font-size: 13px; color: #374151;">
                    <i class="fas fa-paperclip"></i> Attached Files:
                </strong>
                <div style="margin-top: 8px;">
                    ${req.fileUrls.split(',').map(url => `
                        <a href="${url.trim()}" target="_blank" 
                            style="display: inline-block; margin-right: 10px; margin-top: 5px; padding: 6px 12px; background: #274185; color: white; text-decoration: none; border-radius: 5px; font-size: 12px;">
                            <i class="fas fa-download"></i> View File
                        </a>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${req.adminComments ? `
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 8px;">
                <strong style="font-size: 13px; color: #1e40af;">
                    <i class="fas fa-comment-dots"></i> Admin Comments:
                </strong>
                <p style="margin-top: 5px; color: #1f2937;">${req.adminComments}</p>
            </div>
        ` : ''}
    `;
    
    return card;
}

function filterResults(status) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (status === 'all') {
        displayRequirements(allRequirements);
    } else {
        const filtered = allRequirements.filter(req => req.status === status);
        displayRequirements(filtered);
    }
}


