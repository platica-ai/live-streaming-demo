console.log('📤 Sending to D-ID:', {
  streamId,
  sessionId,
  reply: gptData.reply,
});

await fetch('/api/proxy-did/talks/streams', {
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
    source_url: "https://tnbsunhhihibxaghyjnf.supabase.co/storage/v1/object/public/avatars/LUNA_DELGADO_PROFILE.jpeg"
  }),
});
