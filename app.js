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

// Initialize Google Identity Services
function initializeGis() {
    google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("google-sign-in"),
        { theme: "outline", size: "large" }  // Customization options
    );

    google.accounts.id.prompt();  // Display the One Tap prompt
}

// Handle Google Sign-In response
function handleCredentialResponse(response) {
    const credential = response.credential;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        login_hint: credential
    });
    auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(credential))
        .then((result) => {
            user = result.user;
            console.log("User signed in:", user.email);
            initializeUserDrive();
            storeUserInFirestore(user);
            window.location.href = "dashboard.html";  // Redirect to dashboard
        })
        .catch((error) => {
            console.error("Error during sign-in:", error);
        });
}

// Ensure DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged((u) => {
        const currentPage = window.location.pathname.split("/").pop();

        if (u && currentPage === "index.html") {
            window.location.href = "dashboard.html";
        } else if (u) {
            user = u;
            initializeUserDrive();
            storeUserInFirestore(user);
            console.log("User is signed in:", user.email);
            if (document.getElementById("welcome-message")) {
                document.getElementById("welcome-message").innerText = `Welcome, ${user.displayName}`;
            }
        } else if (!u && currentPage !== "index.html") {
            window.location.href = "index.html";
        }
    });

    // Initialize Google Identity Services for Sign-In
    initializeGis();

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
