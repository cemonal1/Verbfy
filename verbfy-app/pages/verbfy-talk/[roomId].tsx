import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VoiceChatRoom from '@/components/voiceChat/VoiceChatRoom';

export default function VerbfyTalkRoom() {
  const router = useRouter();
  const { roomId } = router.query as { roomId?: string };
  const [isLoading, setIsLoading] = useState(true);
  const [isValidRoomId, setIsValidRoomId] = useState(false);

  // Validate roomId when router is ready
  useEffect(() => {
    if (router.isReady) {
      if (roomId && typeof roomId === 'string' && roomId.trim().length > 0) {
        // Basic validation: check if roomId looks like a valid MongoDB ObjectId
        const isValidFormat = /^[0-9a-fA-F]{24}$/.test(roomId);
        setIsValidRoomId(isValidFormat);
      } else {
        setIsValidRoomId(false);
      }
      setIsLoading(false);
    }
  }, [router.isReady, roomId]);

  const handleLeaveRoom = () => {
    router.push('/verbfy-talk');
  };

  // Show loading state while router is initializing
  if (isLoading) {
    return (
      <DashboardLayout title="VerbfyTalk">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading room...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error if roomId is invalid or missing
  if (!roomId || !isValidRoomId) {
    return (
      <DashboardLayout title="VerbfyTalk">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h1>
            <p className="text-gray-600 mb-6">
              {!roomId 
                ? 'No room ID provided.' 
                : 'The room ID format is invalid or the room does not exist.'
              }
            </p>
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
        <ErrorBoundary fallback={<RoomErrorFallback onLeave={handleLeaveRoom} />}>
          <VoiceChatRoom roomId={roomId} onLeave={handleLeaveRoom} />
        </ErrorBoundary>
      </DashboardLayout>
    </>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('VerbfyTalk Room Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Error Fallback Component
function RoomErrorFallback({ onLeave }: { onLeave: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Room Error</h1>
        <p className="text-gray-600 mb-6">
          Something went wrong while loading the room. Please try again.
        </p>
        <button
          onClick={onLeave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Back to Rooms
        </button>
      </div>
    </div>
  );
}

// Static generation paths - return empty array to disable static generation
export async function getStaticPaths() {
  // Since rooms are dynamic and user-specific, we don't pre-generate any paths
  // This prevents build-time errors and allows dynamic routing
  return {
    paths: [],
    fallback: 'blocking' // This allows dynamic routes to be generated on-demand
  };
}

// Static props - return empty props to prevent build-time data fetching
export async function getStaticProps() {
  // No static props needed for this dynamic page
  return {
    props: {},
    revalidate: 60 // Revalidate every 60 seconds if using ISR
  };
}
