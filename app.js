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
const auth = firebase.auth();
let user = null;

// Ensure DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', function () {
    auth.onAuthStateChanged((u) => {
        const currentPage = window.location.pathname.split("/").pop();

        if (u && currentPage === "index.html") {
            window.location.href = "dashboard.html";
        } else if (u) {
            user = u;
            storeUserInFirestore(user); // Ensure this function is called on login
            initializeUserDrive();
            console.log("User is signed in:", user.email);
            if (document.getElementById("welcome-message")) {
                document.getElementById("welcome-message").innerText = `Welcome, ${user.displayName}`;
            }
        } else if (!u && currentPage !== "index.html") {
            window.location.href = "index.html";
        }
    });

    // Initialize Google Identity Services for Sign-In
    if (typeof google !== 'undefined') {
        initializeGis();
    } else {
        console.error('Google API not loaded.');
    }

    // Handle file upload
    const uploadButton = document.getElementById('upload-button');
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            const file = document.getElementById('file-upload').files[0];
            if (file) {
                uploadFileToDrive(file).then(fileId => {
                    console.log('Uploaded File ID:', fileId);
                    processFileWithAI(fileId);
                    storeFileInFirestore(user, fileId, file.name);
                });
            }
        });
    }
});

// Store user information in Firestore
function storeUserInFirestore(user) {
    const userDocRef = db.collection('users').doc(user.uid);

    userDocRef.set({
        email: user.email,
        displayName: user.displayName,
        googleId: user.uid, // Storing the Google UID
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }) // Use merge to avoid overwriting existing data
        .then(() => {
            console.log("User information successfully stored in Firestore.");
        })
        .catch((error) => {
            console.error("Error storing user information:", error);
        });
}

// Initialize Google Identity Services
function initializeGis() {
    console.log("Initializing Google Identity Services...");
    google.accounts.id.initialize({
        client_id: '767064605163-39pfok22rr97uavo82b5050hh49adan9.apps.googleusercontent.com',
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("google-sign-in"),
        { theme: "outline", size: "large" }
    );

    google.accounts.id.prompt();  // Display the One Tap prompt
    console.log("Google Sign-In button rendered.");
}

// Handle Google Sign-In response
function handleCredentialResponse(response) {
    console.log("Handling Google Sign-In response...");
    const credential = response.credential;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        login_hint: credential
    });
    auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(credential))
        .then((result) => {
            user = result.user;
            console.log("User signed in:", user.email);
            storeUserInFirestore(user); // Store user information in Firestore
            initializeUserDrive();
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            console.error("Error during sign-in:", error);
        });
}

// Initialize Google Drive for the user
function initializeUserDrive() {
    console.log("Initializing user Google Drive...");
    gapi.load('client', () => {
        gapi.client.init({
            apiKey: firebaseConfig.apiKey,
            clientId: '767064605163-39pfok22rr97uavo82b5050hh49adan9.apps.googleusercontent.com',
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            scope: 'https://www.googleapis.com/auth/drive.file'
        }).then(() => {
            console.log("Google API client initialized successfully.");
            return gapi.client.drive.files.list({
                'pageSize': 10,
                'fields': "nextPageToken, files(id, name)"
            });
        }).then((response) => {
            console.log("Files in Drive:", response.result.files);
            createAppFolderIfNotExists();
        }).catch((error) => {
            console.error("Error listing files in Google Drive:", error);
        });
    }, (error) => {
        console.error("Error loading Google API client:", error);
    });
}

// Create an app-specific folder in Google Drive if it doesn't exist
function createAppFolderIfNotExists() {
    const folderName = 'SKLearnApp';

    gapi.client.drive.files.list({
        'q': `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        'fields': 'files(id, name)'
    }).then((response) => {
        if (response.result.files.length > 0) {
            console.log(`Folder '${folderName}' already exists.`);
        } else {
            createAppFolder(folderName);
        }
    }).catch((error) => {
        console.error("Error checking for existing folder:", error);
    });
}

// Create a folder in Google Drive
function createAppFolder(folderName) {
    const fileMetadata = {
        'name': folderName,
        'mimeType': 'application/vnd.google-apps.folder'
    };

    gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    }).then((response) => {
        console.log(`Created folder '${folderName}' with ID: ${response.result.id}`);
    }).catch((error) => {
        console.error("Error creating folder:", error);
    });
}
