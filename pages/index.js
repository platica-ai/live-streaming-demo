import Head from 'next/head';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const script1 = document.createElement('script');
    script1.src = '/streaming-client-api.js';
        script1.type = 'module';
    script1.async = true;
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = '/microphone-stream.js';
        script2.type = 'module';
    script2.async = true;
    document.body.appendChild(script2);
  }, []);

  return (
    <>
      <Head>
        <title>D-ID Streaming MVP</title>
      </Head>
      <main>
        <video id="idle-video-element" autoPlay loop muted playsInline />
        <video id="stream-video-element" autoPlay playsInline />
        <button onClick={() => window.connect()}>Connect</button>
        <button id="start-button">Start</button>
        <button id="destroy-button">Destroy</button>
      </main>
    </>
  );
}
