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

// Ensure gapi is fully loaded before using it
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

// Ensure DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', function() {
    // Check if a user is already signed in and redirect to dashboard if on login page
    auth.onAuthStateChanged((u) => {
        const currentPage = window.location.pathname.split("/").pop();

        if (u && currentPage === "index.html") {
            window.location.href = "dashboard.html";
        } else if (u) {
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
});
