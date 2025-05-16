let mediaRecorder;
let audioChunks = [];
let lastTranscriptTime = 0;

// 🆕 Volume-based speech detection
async function hasUserSpoken(stream) {
  return new Promise((resolve) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const micSource = audioContext.createMediaStreamSource(stream);
    analyser.fftSize = 512;
    micSource.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let spoken = false;
    let checks = 0;

    const checkInterval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const maxVolume = Math.max(...dataArray);

      if (maxVolume > 15) {
        spoken = true;
        clearInterval(checkInterval);
        resolve(true);
        audioContext.close();
      }

      if (++checks > 10) {
        clearInterval(checkInterval);
        resolve(false);
        audioContext.close();
      }
    }, 100);
  });
}

async function startMicrophoneStream() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const spoken = await hasUserSpoken(stream);

  if (!spoken) {
    console.log('🛑 No voice detected. Skipping transcription.');
    return;
  }

  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    if (audioChunks.length === 0) {
      console.warn('⚠️ No audio chunks to process.');
      return;
    }

    const tempBlob = new Blob(audioChunks, { type: 'audio/webm' });

    if (tempBlob.size < 1000) {
      console.warn('⚠️ Audio too short or empty. Skipping.');
      audioChunks = [];
      return;
    }

    const blob = tempBlob;
    audioChunks = [];

    const formData = new FormData();
    formData.append('audio', blob, 'chunk.webm');

    try {
      // 🎙️ Step 1: Transcribe audio
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('📝 Transcription:', result.text);
      // 🧹 Filter known hallucinated phrases
const hallucinatedPhrases = [
  "subtítulos realizados por la comunidad de amara.org",
  "subscribe to my channel",
  "thanks for watching",
  "visit amara.org",
];

const cleanedText = result.text.toLowerCase().trim();

if (hallucinatedPhrases.some(phrase => cleanedText === phrase || cleanedText.includes(phrase))) {
  console.warn("🚫 Detected hallucinated subtitle. Skipping transcript:", cleanedText);
  return; // Skip to next loop
}


      
      if (!result.text || result.text.trim() === '') {
        throw new Error('Empty transcription. Skipping.');
      }

      // 💬 Step 2: Send transcript to GPT
      const studentLevel = document.getElementById('level').value;
      const studentGoal = document.getElementById('goal').value;

      const gptResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: result.text,
          studentLevel,
          studentGoal,
        }),
      });

      const gptData = await gptResponse.json();
      console.log('🧠 GPT reply:', gptData.reply);

      // 🎥 Step 3: Send GPT reply to avatar
     // 🕒 Wait up to 5 seconds for streamId, sessionId, and isStreamReady
let waitTime = 0;
while (
  (!window.streamId || !window.sessionId || !window.isStreamReady) &&
  waitTime < 5000
) {
  await new Promise((res) => setTimeout(res, 200));
  waitTime += 200;
}

const { streamId, sessionId } = window;
if (!streamId || !sessionId || !window.isStreamReady) {
  console.warn("⚠️ Stream not ready after waiting. Skipping avatar call.");
  return;
}


      if (!window.streamId || !window.sessionId) {
        console.warn("Stream or session ID not ready yet, skipping video reply.");
        return;
      }

      await fetch(`https://api.d-id.com/talks/streams/${window.streamId}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${window.DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: gptData.reply,
            provider: {
              type: 'microsoft',
              voice_id: 'es-MX-DaliaNeural',
            },
            ssml: false,
          },
          config: {
            stitch: true,
          },
          session_id: sessionId,
        }),
      });
    } catch (err) {
      console.error('❌ Error during transcription or avatar response:', err);
    }

    // Restart the recording loop
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 4000);
  };

  // Initial start
  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 4000);
}

export { startMicrophoneStream };
