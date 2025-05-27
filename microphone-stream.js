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
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('📝 Transcription:', result.text);

      const hallucinatedPhrases = [
        "subtítulos realizados por la comunidad de amara.org",
        "subscribe to my channel",
        "thanks for watching",
        "visit amara.org",
      ];

      const cleanedText = result.text.toLowerCase().trim();

      if (hallucinatedPhrases.some(phrase => cleanedText === phrase || cleanedText.includes(phrase))) {
        console.warn("🚫 Detected hallucinated subtitle. Skipping transcript:", cleanedText);
        return;
      }

      if (!result.text || result.text.trim() === '') {
        throw new Error('Empty transcription. Skipping.');
      }

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

      // 🆕 Send GPT reply to backend to generate D-ID video
      const didResponse = await fetch('/api/generateVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: gptData.reply }),
      });

      const didData = await didResponse.json();
      console.log('🎥 D-ID Video ID:', didData.id);

    } catch (err) {
      console.error('❌ Error during transcription or avatar response:', err);
    }

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 4000);
  };

  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 4000);
}

export { startMicrophoneStream };
