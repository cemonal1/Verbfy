import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VoiceChatRoom from '@/components/voiceChat/VoiceChatRoom';

export default function VerbfyTalkRoom() {
  const router = useRouter();
  const { roomId } = router.query as { roomId?: string };

  const handleLeaveRoom = () => {
    router.push('/verbfy-talk');
  };

  if (!roomId) {
    return (
      <DashboardLayout title="VerbfyTalk">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h1>
            <p className="text-gray-600 mb-6">The room you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/verbfy-talk')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Rooms
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>VerbfyTalk Room - {roomId}</title>
        <meta name="description" content="Join the conversation in VerbfyTalk" />
      </Head>
      
      <DashboardLayout title={`VerbfyTalk Room: ${roomId}`}>
        <VoiceChatRoom roomId={roomId} onLeave={handleLeaveRoom} />
      </DashboardLayout>
    </>
  );
}
