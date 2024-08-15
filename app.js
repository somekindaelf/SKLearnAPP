

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
const db = firebase.firestore();


// Initialize Firebase Authentication
const auth = firebase.auth();
let user = null;

// Load the Google API client and initialize it
function loadGapiClient() {
    return new Promise((resolve, reject) => {
        gapi.load('client:auth2', () => {
            gapi.client.init({
                apiKey: firebaseConfig.apiKey,
                clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
                scope: 'https://www.googleapis.com/auth/drive.file'
            }).then(() => {
                resolve();
            }).catch(error => {
                console.error("Error initializing Google API client:", error);
                reject(error);
            });
        });
    });
}

// Check if a user is already signed in and redirect to dashboard if on login page
auth.onAuthStateChanged((u) => {
    const currentPage = window.location.pathname.split("/").pop();

    if (u && currentPage === "index.html") {
        // User is logged in and is on the login page, redirect to dashboard
        window.location.href = "dashboard.html";
    } else if (u) {
        // User is logged in and on any other page
        user = u;
        loadGapiClient().then(() => {
            initializeUserDrive();
            storeUserInFirestore(user);
        });
        console.log("User is signed in:", user.email);
        if (document.getElementById("welcome-message")) {
            document.getElementById("welcome-message").innerText = `Welcome, ${user.displayName}`;
        }
    } else if (!u && currentPage !== "index.html") {
        // User is not logged in and is trying to access a protected page, redirect to sign-in page
        window.location.href = "index.html";
    }
});

// Google Sign-In
document.getElementById("google-sign-in").addEventListener("click", function () {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            user = result.user;
            console.log("User signed in:", user.email);
            loadGapiClient().then(() => {
                initializeUserDrive();
                storeUserInFirestore(user);
                window.location.href = "dashboard.html";  // Redirect to dashboard
            });
        })
        .catch((error) => {
            console.error("Error during sign-in:", error);
        });
});

function initializeUserDrive() {
    const folderName = 'SKLearn';
    
    createFolder(folderName)
        .then(folderId => {
            console.log('SKLearn Folder ID:', folderId);
            storeUserInFirestore(user, folderId);  // Store the folder ID in Firestore
        })
        .catch(error => {
            console.error('Error creating folder in Google Drive:', error);
        });
}

function createFolder(folderName) {
    return gapi.client.drive.files.create({
        resource: {
            'name': folderName,
            'mimeType': 'application/vnd.google-apps.folder'
        },
        fields: 'id'
    }).then((response) => {
        return response.result.id;
    }).catch(error => {
        console.error('Error creating folder:', error);
        throw error;
    });
}

// Handle file upload
document.getElementById('upload-button').addEventListener('click', () => {
    const file = document.getElementById('file-upload').files[0];
    if (file) {
        uploadFileToDrive(file).then(fileId => {
            console.log('Uploaded File ID:', fileId);
            processFileWithAI(fileId);
            storeFileInFirestore(user, fileId, file.name);
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
    }).catch(error => {
        console.error('Error uploading file:', error);
        throw error;
    });
}

// Store file details in Firestore
function storeFileInFirestore(user, fileId, fileName) {
    const fileRef = db.collection('users').doc(user.uid).collection('documents').doc(fileId);
    fileRef.set({
        fileName: fileName,
        fileId: fileId,
        uploadTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('File information saved to Firestore');
    })
    .catch(error => {
        console.error('Error saving file to Firestore:', error);
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
                'Authorization': `Bearer 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`
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
    }).catch(error => {
        console.error('Error retrieving document:', error);
        throw error;
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
    }).catch(error => {
        console.error('Error saving summary:', error);
        throw error;
    });
}
