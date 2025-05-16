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
      // 🎙️ 1. Send to Whisper
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('📝 Transcription:', result.text);

      // 🧠 2. Get student info
      const studentLevel = document.getElementById('level').value;
      const studentGoal = document.getElementById('goal').value;

      // 💬 3. Send to GPT
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

      // 🎥 4. Send GPT reply to D-ID avatar
      await fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
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

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 4000);
  };

  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 4000);
}

export { startMicrophoneStream };
