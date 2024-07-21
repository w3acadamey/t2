// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, addDoc } from "firebase/firestore";

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

// WebRTC configuration
let localStream;
let remoteStream;
let peerConnection;
const servers = {
    iceServers: [
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

const startButton = document.getElementById('start-button');
const callButton = document.getElementById('call-button');
const hangupButton = document.getElementById('hangup-button');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

// Example: Sign in anonymously
signInAnonymously(auth)
  .catch((error) => {
    console.error("Error signing in anonymously:", error);
  });

// Example: Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Signed in as:', user.uid);
  } else {
    console.log('No user signed in');
  }
});

async function start() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  const callDoc = doc(collection(firestore, 'calls'), 'call1');
  const offerCandidates = collection(callDoc, 'offerCandidates');
  const answerCandidates = collection(callDoc, 'answerCandidates');

  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      addDoc(offerCandidates, event.candidate.toJSON());
    }
  };

  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type
  };

  await setDoc(callDoc, { offer });

  onSnapshot(callDoc, async (snapshot) => {
    const data = snapshot.data();
    if (!peerConnection.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      await peerConnection.setRemoteDescription(answerDescription);
    }
  });

  onSnapshot(answerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        peerConnection.addIceCandidate(candidate);
      }
    });
  });

  callButton.style.display = 'block';
  hangupButton.style.display = 'block';
  startButton.style.display = 'none';
}

async function call() {
  const callDoc = doc(collection(firestore, 'calls'), 'call1');
  const answerCandidates = collection(callDoc, 'answerCandidates');

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      addDoc(answerCandidates, event.candidate.toJSON());
    }
  };

  const callData = (await getDoc(callDoc)).data();
  const offerDescription = callData.offer;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp
  };

  await setDoc(callDoc, { answer }, { merge: true });

  hangupButton.style.display = 'block';
  callButton.style.display = 'none';
}

function hangUp() {
  peerConnection.close();
  callButton.style.display = 'none';
  hangupButton.style.display = 'none';
  startButton.style.display = 'block';
}

startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangUp;
