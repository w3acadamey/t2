import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, get, update, remove, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAbkBt51tUKOyJ1ObnkQrzbn5ArdIM9ou8",
    authDomain: "login-40b17.firebaseapp.com",
    databaseURL: "https://login-40b17-default-rtdb.firebaseio.com/",
    projectId: "login-40b17",
    storageBucket: "login-40b17.appspot.com",
    messagingSenderId: "761800728775",
    appId: "1:761800728775:web:c31a432786a0663dce1ee2",
    measurementId: "G-8Y8VMZY32X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// WebRTC setup
let localStream;
let peerConnection;
const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const startButton = document.getElementById("start-button");
const callButton = document.getElementById("call-button");
const hangupButton = document.getElementById("hangup-button");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Start video stream
startButton.addEventListener("click", async () => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (error) {
        console.error("Error accessing media devices.", error);
    }
});

// Initialize peer connection
async function startCall() {
    peerConnection = new RTCPeerConnection(servers);
    
    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    
    // Handle incoming tracks
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            // Send ICE candidates to Firebase
            set(ref(database, 'iceCandidates/' + callId + '/' + peerConnection.localDescription.type), event.candidate.toJSON());
        }
    };

    // Create offer and set local description
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Save offer to Firebase
    set(ref(database, 'offers/' + callId), offer.toJSON());
}

// Start call
callButton.addEventListener("click", async () => {
    callId = 'exampleCallId'; // You should dynamically generate or select a unique call ID
    await startCall();
    listenForAnswer();
});

// Handle incoming offer
function listenForOffer() {
    onValue(ref(database, 'offers/' + callId), async snapshot => {
        const offer = snapshot.val();
        if (offer) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Save answer to Firebase
            set(ref(database, 'answers/' + callId), answer.toJSON());
        }
    });
}

// Handle incoming answer
function listenForAnswer() {
    onValue(ref(database, 'answers/' + callId), async snapshot => {
        const answer = snapshot.val();
        if (answer) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
    });
}

// Handle incoming ICE candidates
function listenForIceCandidates() {
    onValue(ref(database, 'iceCandidates/' + callId), async snapshot => {
        const candidate = snapshot.val();
        if (candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });
}

// Hang up call
hangupButton.addEventListener("click", () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    remove(ref(database, 'offers/' + callId));
    remove(ref(database, 'answers/' + callId));
    remove(ref(database, 'iceCandidates/' + callId));
});

// Start listening for incoming offers and ICE candidates
listenForOffer();
listenForIceCandidates();
