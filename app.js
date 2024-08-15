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

// OpenAI API key
const openaiApiKey = 'sk-8Y1zFY4T8lWNjm5iQQSkOf721YnHusBfmFKHyOqcZPT3BlbkFJBs5uz-stxjwRH7DxrF-3d36tBNzGv8r3H4yHMBbAQA';

// Ensure DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', function () {
    auth.onAuthStateChanged((u) => {
        const currentPage = window.location.pathname.split("/").pop();

        if (u && currentPage === "index.html") {
            window.location.href = "dashboard.html";
        } else if (u) {
            user = u;
            storeUserInFirestore(user);
            console.log("User is signed in:", user.email);
            if (document.getElementById("welcome-message")) {
                document.getElementById("welcome-message").innerText = `Welcome, ${user.displayName}`;
            }
        } else if (!u && currentPage !== "index.html") {
            window.location.href = "index.html";
        }
    });

    // Handle file upload and AI processing
    const uploadButton = document.getElementById('upload-button');
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            const file = document.getElementById('file-upload').files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const fileContent = event.target.result;
                    processFileWithAI(fileContent);
                };
                reader.readAsText(file);
            }
        });
    }

    // Download summary and MCQ
    document.getElementById('download-summary-button').addEventListener('click', downloadSummary);
    document.getElementById('download-mcq-button').addEventListener('click', downloadMCQ);
});

// Store user information in Firestore
function storeUserInFirestore(user) {
    const userDocRef = db.collection('users').doc(user.uid);

    userDocRef.set({
        email: user.email,
        displayName: user.displayName,
        googleId: user.uid,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        console.log("User information successfully stored in Firestore.");
    })
    .catch((error) => {
        console.error("Error storing user information:", error);
    });
}

// Function to process the file content with OpenAI API
function processFileWithAI(fileContent) {
    const summaryText = document.getElementById('summary-text');
    const mcqText = document.getElementById('mcq-text');

    const data = {
        model: "text-davinci-003",
        prompt: `Summarize the following document and generate a set of multiple-choice questions based on the content, be completely objective and thorough, including all bits of information and make the MCQs:\n\n${fileContent}\n\nSummary:\n`,
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    };

    // Make a POST request to the OpenAI API
    fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(response => {
        const generatedText = response.choices[0].text.trim();
        
        // Assume the AI returns the summary first, followed by the MCQs
        const [summary, ...mcqs] = generatedText.split('MCQ:');
        
        // Display the results
        summaryText.value = summary.trim();
        mcqText.value = mcqs.join('MCQ:').trim();
    })
    .catch(error => {
        console.error("Error processing file with OpenAI:", error);
        summaryText.value = "Error generating summary.";
        mcqText.value = "Error generating MCQs.";
    });
}

// Function to download the summary as a text file
function downloadSummary() {
    const summaryText = document.getElementById('summary-text').value;
    downloadFile('summary.txt', summaryText);
}

// Function to download the MCQ as a text file
function downloadMCQ() {
    const mcqText = document.getElementById('mcq-text').value;
    downloadFile('mcq.txt', mcqText);
}

// Utility function to download a file
function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
