'use strict';

let DID_API = {
  key: null,
  url: '/api/proxy', // ✅ Updated to use the consolidated proxy route
  service: 'stream', // ✅ Adjusted service name to match proxy expectations
};

window.DID_API = DID_API;
window.streamId = null;
window.sessionId = null;

let peerConnection;
let streamId;
let sessionId;

const idleVideoElement = document.getElementById('idle-video-element');
const streamVideoElement = document.getElementById('stream-video-element');

const presenterInputByService = {
  stream: {
    source_url: 'https://tnbsunhhihibxaghyjnf.supabase.co/storage/v1/object/public/avatars/LUNA_DELGADO_PROFILE.jpeg',
  },
};

async function fetchWithRetries(url, options, retries = 1) {
  const maxRetryCount = 3;
  const maxDelaySec = 4;

  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries), maxDelaySec) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}

async function createPeerConnection(offer, iceServers) {
  peerConnection = new RTCPeerConnection({ iceServers });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      fetch(`${DID_API.url}/stream/${streamId}/ice`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          session_id: sessionId,
        }),
      });
    }
  };

  peerConnection.ontrack = (event) => {
    streamVideoElement.srcObject = event.streams[0];
    streamVideoElement.play();
  };

  await peerConnection.setRemoteDescription(offer);
  const sessionClientAnswer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(sessionClientAnswer);

  return sessionClientAnswer;
}

function stopAllStreams() {
  if (streamVideoElement.srcObject) {
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
  }
}

function closePC() {
  if (!peerConnection) return;
  peerConnection.close();
  peerConnection = null;
}

document.getElementById('connect-button').onclick = async () => {
  stopAllStreams();
  closePC();

  const sessionResponse = await fetchWithRetries(`${DID_API.url}/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...presenterInputByService[DID_API.service], stream_warmup: true }),
  });

  const data = await sessionResponse.json();
  streamId = data.id;
  sessionId = data.session_id;

  window.streamId = streamId;
  window.sessionId = sessionId;

  const sessionClientAnswer = await createPeerConnection(data.offer, data.ice_servers);

  await fetch(`${DID_API.url}/stream/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answer: sessionClientAnswer, session_id: sessionId }),
  });
};

window.onload = async () => {
  const res = await fetch('/api/env');
  const data = await res.json();
  DID_API.key = data.DID_API_KEY;

  idleVideoElement.src = 'luna_idle.mp4';
  idleVideoElement.loop = true;
  idleVideoElement.muted = true;
  idleVideoElement.play().catch(console.error);
};
