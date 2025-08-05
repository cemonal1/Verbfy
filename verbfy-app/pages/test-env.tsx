import { useEffect, useState } from 'react';

export default function TestEnv() {
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    setEnvVars({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
      NEXT_PUBLIC_LIVEKIT_CLOUD_URL: process.env.NEXT_PUBLIC_LIVEKIT_CLOUD_URL,
    });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Test</h1>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
      
      <h2>Expected Values:</h2>
      <ul>
        <li>NEXT_PUBLIC_API_URL: http://localhost:5001</li>
        <li>NEXT_PUBLIC_LIVEKIT_URL: wss://localhost:7880</li>
        <li>NEXT_PUBLIC_LIVEKIT_CLOUD_URL: wss://localhost:7880</li>
      </ul>
    </div>
  );
} 