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
      // 🎙️ Step 1: Send to Whisper
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('📝 Transcription:', result.text);

      // 🧠 Step 2: Get student input
      const studentLevel = document.getElementById('level').value;
      const studentGoal = document.getElementById('goal').value;

      // 🔁 Step 3: Send transcript to GPT
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

      // 📺 Step 4: Send GPT reply to Luna (D-ID Stream)
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
              voice_id: 'es-MX-DaliaNeural', // 🇲🇽 Use Luna's voice
            },
            ssml: false,
