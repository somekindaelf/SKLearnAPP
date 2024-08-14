// app.js

// Firebase configuration (replace with your Firebase config)
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
const auth = firebase.auth();

// Google Sign-In
document.getElementById("google-sign-in").addEventListener("click", function () {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            console.log("User signed in:", user);
            // Redirect or display content based on sign-in
        })
        .catch((error) => {
            console.error("Error during sign-in:", error);
        });
});
