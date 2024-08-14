// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCPptntIlqX404tnvfzSukt-wF8hG2584k",
    authDomain: "sklearnapp.firebaseapp.com",
    projectId: "sklearnapp",
    storageBucket: "sklearnapp.appspot.com",
    messagingSenderId: "767064605163",
    appId: "1:767064605163:web:fa06f4a463a4408666d9ae",
    measurementId: "G-335VJC09CJ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = firebase.auth();
let user = null;

// Check if a user is already signed in and redirect if necessary
auth.onAuthStateChanged((u) => {
    const currentPage = window.location.pathname.split("/").pop();
    const protectedPages = ["dashboard.html"]; // Add other protected pages here

    if (!u && protectedPages.includes(currentPage)) {
        // User is not logged in and trying to access a protected page
        window.location.href = "index.html"; // Redirect to sign-in page
    } else if (u) {
        user = u;
        initializeUserDrive();
        console.log("User is signed in:", user.email);
        if (document.getElementById("welcome-message")) {
            document.getElementById("welcome-message").innerText = `Welcome, ${user.displayName}`;
        }
    }
});

// Google Sign-In
document.getElementById("google-sign-in").addEventListener("click", function () {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            user = result.user;
            console.log("User signed in:", user.email);
            initializeUserDrive();
            if (document.getElementById("welcome-message")) {
                document.getElementById("welcome-message").innerText = `Welcome, ${user.displayName}`;
            }
        })
        .catch((error) => {
            console.error("Error during sign-in:", error);
        });
});

function initializeUserDrive() {
    // Create or get SKLearn folder in user's Google Drive
    createFolder('SKLearn').then(folderId => {
        console.log('SKLearn Folder ID:', folderId);
        // Load existing documents or set up further actions
    });
}

// Function to create a folder in Google Drive
function createFolder(folderName) {
    return gapi.client.drive.files.create({
        resource: {
            'name': folderName,
            'mimeType': 'application/vnd.google-apps.folder'
        },
        fields: 'id'
    }).then((response) => {
        return response.result.id;
    });
}

// Handle file upload
document.getElementById('upload-button').addEventListener('click', () => {
    const file = document.getElementById('file-upload').files[0];
    if (file) {
        uploadFileToDrive(file).then(fileId => {
            console.log('Uploaded File ID:', fileId);
            processFileWithAI(fileId);
        });
    }
});

function uploadFileToDrive(file) {
    const metadata = {
        'name': file.name,
        'mimeType': file.type,
        'parents': [/* SKLearn Folder ID */]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    return gapi.client.request({
        path: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related' },
        body: form
    }).then((response) => {
        return response.result.id;
    });
}

// AI Integration with OpenAI
function processFileWithAI(fileId) {
    // Retrieve the document from Google Drive
    retrieveDocumentFromDrive(fileId).then(documentText => {
        // Use OpenAI API to generate a summary
        const prompt = `Summarize the following document: ${documentText}`;
        fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer YOUR_OPENAI_API_KEY`
            },
            body: JSON.stringify({
                model: 'text-davinci-003',
                prompt: prompt,
                max_tokens: 150,
                temperature: 0.7
            })
        })
        .then(response => response.json())
        .then(data => {
            const summary = data.choices[0].text.trim();
            console.log('AI-Generated Summary:', summary);
            // Save the summary back to Google Drive or Firestore
            saveSummaryToDrive(fileId, summary);
        })
        .catch(error => {
            console.error('Error processing document with AI:', error);
        });
    });
}

// Function to retrieve document text from Google Drive
function retrieveDocumentFromDrive(fileId) {
    return gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    }).then(response => {
        return response.body;
    });
}

// Function to save AI-generated summary to Google Drive
function saveSummaryToDrive(fileId, summary) {
    const metadata = {
        'name': 'Summary of ' + fileId,
        'mimeType': 'text/plain',
        'parents': [/* SKLearn Folder ID */]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([summary], { type: 'text/plain' }));

    return gapi.client.request({
        path: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related' },
        body: form
    }).then((response) => {
        console.log('Summary saved to Google Drive');
    });
}
