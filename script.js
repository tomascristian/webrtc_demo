import createSignalingChannel from "./helpers/signaling.js";
import setupNegotiation from "./helpers/negotiation.js";

Promise.all([
  startLocalStream(),
  createPeerConnection()
])
  .then(startMediaTransmission)
  .catch(console.error);

async function startLocalStream() {
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
  const localVideo = document.querySelector("video.local");
  localVideo.srcObject = localStream;
  return localStream;
}

async function createPeerConnection() {
  const sessionName = initSession();
  const signaler = await createSignalingChannel(sessionName);

  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  // Prepare to receive remote media
  const remoteVideo = document.querySelector("video.remote");
  peerConnection.ontrack = ({ streams: [remoteStream] }) => {
    remoteVideo.srcObject = remoteStream;
  };

  const isCaller = signaler.userCount > 1; // Second to connect initiates call
  setupNegotiation(peerConnection, signaler, isCaller);

  return peerConnection;
}

function initSession() {
  // History API routing won't work on Github Pages :(
  // I'm using hash-based routing as a workaround...
  const currentSession = window.location.hash.slice(1);
  if (currentSession) return currentSession;
  const sessionName = String(Date.now());
  window.location.hash = sessionName;
  return sessionName;
}

function startMediaTransmission([localStream, peerConnection]) {
  localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));
}
