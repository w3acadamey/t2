import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbkBt51tUKOyJ1ObnkQrzbn5ArdIM9ou8",
  authDomain: "login-40b17.firebaseapp.com",
  projectId: "login-40b17",
  storageBucket: "login-40b17.appspot.com",
  messagingSenderId: "761800728775",
  appId: "1:761800728775:web:c31a432786a0663dce1ee2",
  measurementId: "G-8Y8VMZY32X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const provider = new GoogleAuthProvider();

// Handle authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User signed in:", user);
        document.getElementById("login-button").style.display = "none";
        document.getElementById("logout-button").style.display = "block";
    } else {
        console.log("No user signed in");
        document.getElementById("login-button").style.display = "block";
        document.getElementById("logout-button").style.display = "none";
    }
});

// Sign in with popup
document.getElementById("login-button").addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("User signed in:", result.user);
    } catch (error) {
        console.error("Error signing in:", error);
    }
});

// Sign out
document.getElementById("logout-button").addEventListener("click", async () => {
    try {
        await signOut(auth);
        console.log("User signed out");
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

// Implement WebRTC for video calling (dummy setup)
// This example assumes you have WebRTC setup to handle local and remote video streams

const startButton = document.getElementById("start-button");
const callButton = document.getElementById("call-button");
const hangupButton = document.getElementById("hangup-button");

startButton.addEventListener("click", () => {
    // Start local video stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            document.getElementById("localVideo").srcObject = stream;
        })
        .catch(error => {
            console.error("Error accessing media devices.", error);
        });
});

callButton.addEventListener("click", () => {
    // Implement your call initiation logic
});

hangupButton.addEventListener("click", () => {
    // Implement your call hangup logic
});
