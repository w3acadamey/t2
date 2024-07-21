// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbkBt51tUKOyJ1ObnkQrzbn5ArdIM9ou8",
  authDomain: "login-40b17.firebaseapp.com",
  databaseURL: "https://login-40b17-default-rtdb.firebaseio.com",
  projectId: "login-40b17",
  storageBucket: "login-40b17.appspot.com",
  messagingSenderId: "761800728775",
  appId: "1:761800728775:web:c31a432786a0663dce1ee2",
  measurementId: "G-8Y8VMZY32X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Your WebRTC and Firebase code here
