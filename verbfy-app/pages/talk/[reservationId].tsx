import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthContext } from '@/context/AuthContext';
import { LiveKitRoom } from '@/components/livekit/LiveKitRoom';
import { LiveKitProvider } from '@/context/LiveKitContext';

export default function TalkPage() {
  const router = useRouter();
  const { reservationId } = router.query;
  const [error, setError] = useState<Error | null>(null);

  // Wait for router to be ready
  if (!router.isReady || !reservationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleError = (error: Error) => {
    console.error('Room error:', error);
    setError(error);
  };

  const handleDisconnected = () => {
    console.log('Disconnected from room');
  };

  return (
    <>
      <Head>
        <title>Verbfy - Video Lesson</title>
      </Head>

      <div className="h-screen bg-white">
        <LiveKitProvider>
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500">
                <p className="text-xl font-semibold">Connection Error</p>
                <p className="mt-2">{error.message}</p>
              </div>
            </div>
          ) : (
            <LiveKitRoom
              roomName={reservationId as string}
              onError={handleError}
              onDisconnected={handleDisconnected}
            />
          )}
        </LiveKitProvider>
      </div>
    </>
  );
} 