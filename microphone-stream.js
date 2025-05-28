// microphone-stream.js

let mediaRecorder;
let audioChunks = [];

// 🆕 Volume-based speech detection
async function hasUserSpoken(stream) {
  return new Promise((resolve) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const micSource = audioContext.createMediaStreamSource(stream);
    analyser.fftSize = 512;
    micSource.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let checks = 0;

    const checkInterval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const maxVolume = Math.max(...dataArray);

      if (maxVolume > 25) {
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

    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    audioChunks = [];

    if (blob.size < 1000) {
      console.warn('⚠️ Audio too short or empty. Skipping.');
      return;
    }

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

    const hallucinatedPhrases = [
  'subtítulos realizados por la comunidad de amara.org',
  'subscribe to my channel',
  'thanks for watching',
  'visit amara.org',
  'no, no, no', // Add this line to filter repeated "no"
  'uh', 'um', // Common filler noises
];

const cleanedText = result.text.toLowerCase().trim();

if (
  hallucinatedPhrases.some((phrase) => cleanedText.includes(phrase)) || 
  cleanedText.split(' ').length <= 1 // Ignore single-word transcriptions
) {
  console.warn('🚫 Detected hallucinated subtitle. Skipping:', cleanedText);
  return;
}

      // 💬 Step 2: Send to GPT
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

      // 🎥 Step 3: Send GPT reply to generate video
      const didRes = await fetch('/api/generateVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: gptData.reply }),
      });

      const didData = await didRes.json();
      console.log('🎞️ D-ID response:', didData);
    } catch (err) {
      console.error('❌ Error in streaming pipeline:', err);
    }

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 4000);
  };

  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 4000);
}

export { startMicrophoneStream };
