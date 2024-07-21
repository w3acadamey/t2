// Firebase configuration
const firebaseConfig = {
    databaseURL: "https://login-40b17-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const user1Button = document.getElementById('user1Button');
const user2Button = document.getElementById('user2Button');
const unsetButton = document.getElementById('unsetButton');
const startCallButton = document.getElementById('startCall');
const endCallButton = document.getElementById('endCall');
const localAudio = document.getElementById('localAudio');
const remoteAudio = document.getElementById('remoteAudio');

let localStream;
let peerConnection;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

let userType = null; // 'user1' or 'user2'
let callId = "voice_call";

const setUserType = (type) => {
    userType = type;
    if (type === 'user1' || type === 'user2') {
        startCallButton.style.display = 'inline';
        endCallButton.style.display = 'none';
    } else {
        startCallButton.style.display = 'none';
        endCallButton.style.display = 'none';
    }
};

user1Button.onclick = () => setUserType('user1');
user2Button.onclick = () => setUserType('user2');
unsetButton.onclick = () => setUserType(null);

startCallButton.onclick = async () => {
    if (!userType) return;
    console.log('Start Call button clicked');
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localAudio.srcObject = localStream;

        peerConnection = new RTCPeerConnection(configuration);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        console.log('Tracks added to peer connection');

        peerConnection.onicecandidate = ({ candidate }) => {
            if (candidate) {
                console.log('New ICE candidate:', candidate);
                database.ref(callId + '/ice_candidates').push(JSON.stringify(candidate));
            }
        };

        peerConnection.ontrack = ({ streams: [stream] }) => {
            console.log('Remote stream received');
            remoteAudio.srcObject = stream;
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('Offer created and set as local description');
        database.ref(callId + '/offer').set(JSON.stringify(offer));

        endCallButton.style.display = 'inline';
        startCallButton.style.display = 'none';
    } catch (error) {
        console.error('Error starting call:', error);
    }
};

endCallButton.onclick = () => {
    console.log('End Call button clicked');
    if (peerConnection) {
        peerConnection.close();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    endCallButton.style.display = 'none';
    startCallButton.style.display = userType ? 'inline' : 'none';
};

// Listen for incoming calls
database.ref(callId + '/offer').on('value', async snapshot => {
    if (!snapshot.exists()) return;
    const offer = JSON.parse(snapshot.val());
    console.log('Offer received:', offer);

    try {
        if (!peerConnection) {
            peerConnection = new RTCPeerConnection(configuration);

            peerConnection.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    console.log('New ICE candidate:', candidate);
                    database.ref(callId + '/ice_candidates').push(JSON.stringify(candidate));
                }
            };

            peerConnection.ontrack = ({ streams: [stream] }) => {
                console.log('Remote stream received');
                remoteAudio.srcObject = stream;
            };

            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localAudio.srcObject = localStream;
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
            console.log('Local stream obtained and tracks added to peer connection');
        }

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('Offer set as remote description');
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log('Answer created and set as local description');
        database.ref(callId + '/answer').set(JSON.stringify(answer));
    } catch (error) {
        console.error('Error handling incoming call:', error);
    }
});

// Listen for answer
database.ref(callId + '/answer').on('value', async snapshot => {
    if (!snapshot.exists()) return;
    const answer = JSON.parse(snapshot.val());
    console.log('Answer received:', answer);

    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Answer set as remote description');
    } catch (error) {
        console.error('Error setting remote description:', error);
    }
});

// Listen for ICE candidates
database.ref(callId + '/ice_candidates').on('child_added', async snapshot => {
    if (!snapshot.exists()) return;
    const candidate = JSON.parse(snapshot.val());
    console.log('ICE candidate received:', candidate);

    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('ICE candidate added to peer connection');
    } catch (error) {
        console.error('Error adding ICE candidate:', error);
    }
});
