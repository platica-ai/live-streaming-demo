'use strict';

let DID_API = {
  key: null,
  url: '/api',
  service: 'talks',
};

window.DID_API = DID_API;
window.streamId = null;
window.sessionId = null;

let peerConnection;
let streamId;
let sessionId;

const idleVideoElement = document.getElementById('idle-video-element');
const streamVideoElement = document.getElementById('stream-video-element');
idleVideoElement.src = '/luna_idle.mp4';  // Ensure you have this file in your public directory

const presenterInputByService = {
  talks: {
    source_url: 'https://tnbsunhhihibxaghyjnf.supabase.co/storage/v1/object/public/avatars/LUNA_DELGADO_PROFILE.jpeg',
  },
};

document.getElementById('connect-button').onclick = async () => {
  stopAllStreams();
  closePC();

  const sessionResponse = await fetch(`${DID_API.url}/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...presenterInputByService[DID_API.service], stream_warmup: true }),
  });

  const { id, offer, ice_servers, session_id } = await sessionResponse.json();
  streamId = id;
  sessionId = session_id;

  window.streamId = streamId;
  window.sessionId = sessionId;

  const peerConnectionConfig = { iceServers: ice_servers };
  peerConnection = new RTCPeerConnection(peerConnectionConfig);

  peerConnection.ontrack = (event) => {
    streamVideoElement.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      fetch(`${DID_API.url}/ice`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          session_id: sessionId,
          stream_id: streamId
        }),
      });
    }
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  await fetch(`${DID_API.url}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer,
      session_id: sessionId,
      stream_id: streamId
    }),
  });
};

function stopAllStreams() {
  if (streamVideoElement.srcObject) {
    streamVideoElement.srcObject.getTracks().forEach(track => track.stop());
    streamVideoElement.srcObject = null;
  }
}

function closePC() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
}

window.onload = async () => {
  const res = await fetch('/api/env');
  const data = await res.json
