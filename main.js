// Firebase configuration
const firebaseConfig = {
    databaseURL: "https://login-40b17-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const startCallButton = document.getElementById('startCall');
const endCallButton = document.getElementById('endCall');
const localAudio = document.getElementById('localAudio');
const remoteAudio = document.getElementById('remoteAudio');

let localStream;
let peerConnection;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

let callId = "voice_call";

startCallButton.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localAudio.srcObject = localStream;

    peerConnection = new RTCPeerConnection(configuration);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            database.ref(callId + '/ice_candidates').push(JSON.stringify(candidate));
        }
    };

    peerConnection.ontrack = ({ streams: [stream] }) => {
        remoteAudio.srcObject = stream;
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    database.ref(callId + '/offer').set(JSON.stringify(offer));

    endCallButton.disabled = false;
    startCallButton.disabled = true;
};

endCallButton.onclick = () => {
    peerConnection.close();
    localStream.getTracks().forEach(track => track.stop());
    endCallButton.disabled = true;
    startCallButton.disabled = false;
};

// Listen for incoming calls
database.ref(callId + '/offer').on('value', async snapshot => {
    if (!snapshot.exists()) return;
    const offer = JSON.parse(snapshot.val());

    if (!peerConnection) {
        peerConnection = new RTCPeerConnection(configuration);

        peerConnection.onicecandidate = ({ candidate }) => {
            if (candidate) {
                database.ref(callId + '/ice_candidates').push(JSON.stringify(candidate));
            }
        };

        peerConnection.ontrack = ({ streams: [stream] }) => {
            remoteAudio.srcObject = stream;
        };

        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localAudio.srcObject = localStream;
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    database.ref(callId + '/answer').set(JSON.stringify(answer));
});

// Listen for answer
database.ref(callId + '/answer').on('value', async snapshot => {
    if (!snapshot.exists()) return;
    const answer = JSON.parse(snapshot.val());
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Listen for ICE candidates
database.ref(callId + '/ice_candidates').on('child_added', async snapshot => {
    if (!snapshot.exists()) return;
    const candidate = JSON.parse(snapshot.val());
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
