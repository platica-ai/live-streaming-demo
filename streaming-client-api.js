'use strict';

let DID_API = {
  key: null,
  url: '/api/proxy-did',
  service: 'talks',
};

window.DID_API = DID_API;
window.streamId = null;
window.sessionId = null;

let peerConnection, streamId, sessionId;
const idleVideoElement = document.getElementById('idle-video-element');
const streamVideoElement = document.getElementById('stream-video-element');

const presenterInputByService = {
  talks: {
    source_url: 'https://tnbsunhhihibxaghyjnf.supabase.co/storage/v1/object/public/avatars/LUNA_DELGADO_PROFILE.jpeg',
  },
};

async function createPeerConnection(offer, iceServers) {
  peerConnection = new RTCPeerConnection({ iceServers });

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      await fetch(`${DID_API.url}/talks/streams/${streamId}/ice`, {
        method: 'POST',
        headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
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
  };

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
}

export async function connect() {
  streamVideoElement.srcObject?.getTracks().forEach((t) => t.stop());
  peerConnection?.close();

  const res = await fetch(`${DID_API.url}/talks/streams`, {
    method: 'POST',
    headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...presenterInputByService[DID_API.service], stream_warmup: true }),
  });

  const data = await res.json();
  streamId = data.id;
  sessionId = data.session_id;
  window.streamId = streamId;
  window.sessionId = sessionId;

  const answer = await createPeerConnection(data.offer, data.ice_servers);

  await fetch(`${DID_API.url}/talks/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer, session_id: sessionId }),
  });
}

window.onload = async () => {
  const res = await fetch('/api/env');
  const data = await res.json();
  DID_API.key = data.DID_API_KEY;
  idleVideoElement.src = '/luna_idle.mp4';
  idleVideoElement.loop = true;
  idleVideoElement.muted = true;
  idleVideoElement.play();
};
