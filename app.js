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
    if (u) {
        user = u;
        initializeUserDrive();
        console.log("User is signed in:", user.email);
        // Optionally, redirect to the dashboard or update the UI
        document.getElementById("welcome-message").innerText = `Welcome, ${user.displayName}`;
    } else {
        console.log("No user is signed in.");
        // Optionally redirect to the sign-in page or show a login prompt
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
            // Optionally update the UI to reflect the signed-in state
            document.getElementById("welcome-message").innerText = `Welcome, ${user.displayName}`;
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
    return new Promise((resolve, reject) => {
        // Google Drive API logic to create folder
        // Placeholder: Replace with actual API call
        const mockFolderId = 'mock-folder-id';
        resolve(mockFolderId);
    });
}

// Handle file upload
document.getElementById('upload-button').addEventListener('click', () => {
    const file = document.getElementById('file-upload').files[0];
    if (file) {
        uploadFileToDrive(file).then(fileId => {
            console.log('Uploaded File ID:', fileId);
            // Additional logic like creating summaries, quizzes, etc.
        });
    }
});

function uploadFileToDrive(file) {
    return new Promise((resolve, reject) => {
        // Google Drive API logic to upload file to specific folder
        // Placeholder: Replace with actual API call
        const mockFileId = 'mock-file-id';
        resolve(mockFileId);
    });
}

// AI Integration Placeholder
function processFileWithAI(fileId) {
    // Placeholder function for AI processing
    // Use OpenAI API here to generate summaries and quizzes
    console.log('Processing file with AI:', fileId);
}
