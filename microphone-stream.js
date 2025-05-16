let mediaRecorder;
let audioChunks = [];

async function startMicrophoneStream() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    audioChunks = [];

    const formData = new FormData();
    formData.append('audio', blob, 'chunk.webm');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      // Get student settings from the dropdown
const studentLevel = document.getElementById('level').value;
const studentGoal = document.getElementById('goal').value;

// Send transcript to GPT
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

// TODO: send gptData.reply to Luna avatar


      const result = await response.json();
      console.log('Transcription:', result.text);
      // TODO: Pass result.text to ChatGPT for reply
    } catch (err) {
      console.error('Transcription error:', err);
    }

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 4000); // Send every 4 seconds
  };

  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 4000);
}

export { startMicrophoneStream };
