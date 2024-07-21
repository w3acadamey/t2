const signalingServerUrl = 'ws://localhost:8080'; // Change to your signaling server URL
const serverConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

let localStream;
let peerConnection;
let signalingSocket;

document.getElementById('startCall').addEventListener('click', startCall);
document.getElementById('endCall').addEventListener('click', endCall);

function startCall() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            document.getElementById('localVideo').srcObject = localStream;

            peerConnection = new RTCPeerConnection(serverConfig);
            peerConnection.onicecandidate = handleIceCandidate;
            peerConnection.ontrack = handleRemoteStream;

            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            return peerConnection.createOffer();
        })
        .then(offer => {
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            signalingSocket.send(JSON.stringify({ type: 'offer', offer: peerConnection.localDescription }));
        });

    document.getElementById('endCall').disabled = false;
}

function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('remoteVideo').srcObject = null;

    document.getElementById('endCall').disabled = true;
}

function handleIceCandidate(event) {
    if (event.candidate) {
        signalingSocket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    }
}

function handleRemoteStream(event) {
    document.getElementById('remoteVideo').srcObject = event.streams[0];
}

function setupSignaling() {
    signalingSocket = new WebSocket(signalingServerUrl);

    signalingSocket.onmessage = event => {
        const message = JSON.parse(event.data);
        switch (message.type) {
            case 'offer':
                handleOffer(message.offer);
                break;
            case 'answer':
                handleAnswer(message.answer);
                break;
            case 'candidate':
                handleCandidate(message.candidate);
                break;
        }
    };
}

async function handleOffer(offer) {
    peerConnection = new RTCPeerConnection(serverConfig);
    peerConnection.onicecandidate = handleIceCandidate;
    peerConnection.ontrack = handleRemoteStream;

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('localVideo').srcObject = localStream;
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    signalingSocket.send(JSON.stringify({ type: 'answer', answer: peerConnection.localDescription }));
}

async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleCandidate(candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

setupSignaling();
