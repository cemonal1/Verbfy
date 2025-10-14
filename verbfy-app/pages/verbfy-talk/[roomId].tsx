import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { verbfyTalkAPI } from '@/lib/api';
import { VerbfyTalkRoom } from '@/types/verbfyTalk';
import { useAuthContext } from '@/context/AuthContext';
import { useWebRTC } from '@/features/lessonRoom/webrtc/useWebRTC';
import LessonChatBox from '@/features/lesson-chat/components/LessonChatBox';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  ComputerDesktopIcon,
  PhoneIcon,
  UsersIcon,
  AcademicCapIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

function VerbfyTalkRoomPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { roomId } = router.query;
  const [room, setRoom] = useState<VerbfyTalkRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [volume, setVolume] = useState(50);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'speaker' | 'gallery'>('grid');
  const [speakerParticipant, setSpeakerParticipant] = useState<string | null>(null);

  // WebRTC setup
  const peerIds = user && roomId ? {
    self: `${user.id}-verbfy-talk-${roomId}`,
    remote: undefined,
  } : { self: '', remote: undefined };

  const participants: string[] = []; // TODO: Implement participant tracking
  
  const {
    localStream,
    remoteStreams,
    isMicOn,
    isCameraOn,
    toggleMic,
    toggleCamera,
    reconnect,
    status,
    error,
    muteStates,
    videoStates,
    toggleRemoteMute,
    toggleRemoteVideo,
    isInitializing,
  } = useWebRTC(roomId as string, peerIds, participants);

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [peerId: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    if (roomId && typeof roomId === 'string') {
      loadRoomDetails();
    }
  }, [roomId]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([peerId, stream]) => {
      const videoElement = remoteVideoRefs.current[peerId];
      if (videoElement && stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const loadRoomDetails = async () => {
    try {
      setLoading(true);
      const response = await verbfyTalkAPI.getRoomDetails(roomId as string);
      setRoom(response.data);
    } catch (error) {
      toast.error('Failed to load room details');
      router.push('/verbfy-talk');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await verbfyTalkAPI.leaveRoom(roomId as string);
      toast.success('Left room successfully');
      router.push('/verbfy-talk');
    } catch (error: any) {
      // If user is not in room (400 error), treat as successful leave
      if (error.response?.status === 400 && error.response?.data?.message === 'Not in room') {
        toast.success('Left room successfully');
        router.push('/verbfy-talk');
      } else {
        console.error('Leave room error:', error);
        toast.error('Failed to leave room');
      }
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'text-green-600';
      case 'Intermediate':
        return 'text-yellow-600';
      case 'Advanced':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (loading || isInitializing) {
    return (
      <DashboardLayout allowedRoles={['student', 'teacher']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {loading ? 'Loading room...' : 'Requesting microphone and camera access...'}
            </p>
            {isInitializing && (
              <p className="mt-2 text-sm text-gray-500">
                Please allow access to your microphone and camera when prompted
              </p>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!room) {
    return (
      <DashboardLayout allowedRoles={['student', 'teacher']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Room not found</p>
            <button
              onClick={() => router.push('/verbfy-talk')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Back to Rooms
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show media access error
  if (error && status === 'error') {
    return (
      <DashboardLayout allowedRoles={['student', 'teacher']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4">
              <MicrophoneIcon className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Media Access Required</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={reconnect}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/verbfy-talk')}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded transition-colors"
              >
                Back to Rooms
              </button>
            </div>
            <div className="mt-6 text-sm text-gray-500">
              <p className="font-medium mb-2">To fix this issue:</p>
              <ul className="text-left space-y-1">
                <li>• Click the camera/microphone icon in your browser's address bar</li>
                <li>• Select "Allow" for both camera and microphone</li>
                <li>• Refresh the page and try again</li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const activeParticipants: any[] = []; // TODO: Implement participant tracking
  const isCreator = typeof room.createdBy === 'object' ? room.createdBy._id === user?.id : room.createdBy === user?.id;

  return (
    <DashboardLayout allowedRoles={['student', 'teacher']}>
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/verbfy-talk')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{room.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className={`flex items-center gap-1 ${getLevelColor(room.level)}`}>
                    <AcademicCapIcon className="w-4 h-4" />
                    {room.level}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <UsersIcon className="w-4 h-4" />
                    {activeParticipants.length}/{room.maxParticipants}
                  </span>
                  {room.topic && (
                    <>
                      <span>•</span>
                      <span>{room.topic}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Controls */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('speaker')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'speaker' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Speaker
                </button>
                <button
                  onClick={() => setViewMode('gallery')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'gallery' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Gallery
                </button>
              </div>

              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <UsersIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleLeaveRoom}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Video Area */}
          <div className="flex-1 flex flex-col">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">Media Access Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={reconnect}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        disabled={isInitializing}
                      >
                        {isInitializing ? 'Retrying...' : 'Try Again'}
                      </button>
                      <button
                        onClick={() => router.push('/verbfy-talk/test-media')}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Test Media
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Initializing Display */}
            {isInitializing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Initializing Media</h3>
                    <p className="text-sm text-blue-700">Requesting access to your camera and microphone...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Video Layout */}
            <div className="flex-1 p-4">
              {/* Video Container with responsive layout */}
              <div className="h-full flex flex-col">
                {/* Main video area */}
                <div className="flex-1 flex items-center justify-center">
                  {/* Grid View */}
                  {viewMode === 'grid' && (
                    <div className={`
                      w-full h-full grid gap-2
                      ${activeParticipants.length <= 1 ? 'grid-cols-1' : ''}
                      ${activeParticipants.length === 2 ? 'grid-cols-1 md:grid-cols-2' : ''}
                      ${activeParticipants.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
                      ${activeParticipants.length === 4 ? 'grid-cols-2' : ''}
                      ${activeParticipants.length >= 5 ? 'grid-cols-2 md:grid-cols-3' : ''}
                    `}>
                    {/* Local Video */}
                    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video min-h-0">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      {/* Video overlay with user info */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Status indicators */}
                        <div className="absolute top-2 left-2 flex gap-1">
                          {!isMicOn && (
                            <div className="bg-red-500 text-white p-1 rounded-full relative">
                              <MicrophoneIcon className="w-3 h-3" />
                              <XMarkIcon className="w-2 h-2 absolute -top-0.5 -right-0.5 bg-red-600 rounded-full" />
                            </div>
                          )}
                          {!isCameraOn && (
                            <div className="bg-red-500 text-white p-1 rounded-full relative">
                              <VideoCameraIcon className="w-3 h-3" />
                              <XMarkIcon className="w-2 h-2 absolute -top-0.5 -right-0.5 bg-red-600 rounded-full" />
                            </div>
                          )}
                        </div>
                        
                        {/* Connection status */}
                        {status === 'connecting' && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                            Connecting...
                          </div>
                        )}
                        {status === 'connected' && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                            Connected
                          </div>
                        )}
                        
                        {/* User name */}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
                          You
                        </div>
                      </div>
                      
                      {/* Camera off placeholder */}
                      {!isCameraOn && (
                        <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-2xl font-bold">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <p className="text-sm">Camera is off</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remote Videos */}
                    {activeParticipants
                      .filter(p => p.userId._id !== user?.id)
                      .map((participant, index) => (
                        <div key={participant.userId._id} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video min-h-0">
                          <video
                            ref={(el) => {
                              remoteVideoRefs.current[participant.userId._id] = el;
                            }}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Video overlay */}
                          <div className="absolute inset-0 pointer-events-none">
                            {/* Participant status indicators */}
                            <div className="absolute top-2 left-2 flex gap-1">
                              {muteStates[participant.userId._id] && (
                                <div className="bg-red-500 text-white p-1 rounded-full relative">
                                  <MicrophoneIcon className="w-3 h-3" />
                                  <XMarkIcon className="w-2 h-2 absolute -top-0.5 -right-0.5 bg-red-600 rounded-full" />
                                </div>
                              )}
                              {!videoStates[participant.userId._id] && (
                                <div className="bg-red-500 text-white p-1 rounded-full relative">
                                  <VideoCameraIcon className="w-3 h-3" />
                                  <XMarkIcon className="w-2 h-2 absolute -top-0.5 -right-0.5 bg-red-600 rounded-full" />
                                </div>
                              )}
                            </div>
                            
                            {/* Participant name */}
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
                              {participant.userId.name}
                            </div>
                          </div>
                          
                          {/* Camera off placeholder */}
                          {!videoStates[participant.userId._id] && (
                            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                              <div className="text-center text-white">
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <span className="text-2xl font-bold">
                                    {participant.userId.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm">Camera is off</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                     </div>
                   )}

                   {/* Speaker View */}
                   {viewMode === 'speaker' && (
                     <div className="w-full h-full flex flex-col gap-2">
                       {/* Main speaker video */}
                       <div className="flex-1 flex items-center justify-center">
                         {speakerParticipant ? (
                           <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video max-h-full max-w-full">
                             <video
                               ref={(el) => {
                                 remoteVideoRefs.current[speakerParticipant] = el;
                               }}
                               autoPlay
                               playsInline
                               className="w-full h-full object-cover"
                             />
                             <div className="absolute inset-0 pointer-events-none">
                               <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
                                 {activeParticipants.find(p => p.userId._id === speakerParticipant)?.userId.name}
                               </div>
                             </div>
                           </div>
                         ) : (
                           <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video max-h-full max-w-full">
                             <video
                               ref={localVideoRef}
                               autoPlay
                               muted
                               playsInline
                               className="w-full h-full object-cover"
                             />
                             <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
                               You
                             </div>
                           </div>
                         )}
                       </div>
                       
                       {/* Thumbnail videos */}
                       <div className="flex gap-2 justify-center max-h-32">
                         {/* Local video thumbnail */}
                         {speakerParticipant && (
                           <div 
                             className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video w-24 h-18 cursor-pointer hover:ring-2 hover:ring-blue-500"
                             onClick={() => setSpeakerParticipant(null)}
                           >
                             <video
                               ref={localVideoRef}
                               autoPlay
                               muted
                               playsInline
                               className="w-full h-full object-cover"
                             />
                             <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs">
                               You
                             </div>
                           </div>
                         )}
                         
                         {/* Remote video thumbnails */}
                         {activeParticipants
                           .filter(p => p.userId._id !== user?.id && p.userId._id !== speakerParticipant)
                           .map((participant) => (
                             <div 
                               key={participant.userId._id}
                               className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video w-24 h-18 cursor-pointer hover:ring-2 hover:ring-blue-500"
                               onClick={() => setSpeakerParticipant(participant.userId._id)}
                             >
                               <video
                                 ref={(el) => {
                                   remoteVideoRefs.current[participant.userId._id] = el;
                                 }}
                                 autoPlay
                                 playsInline
                                 className="w-full h-full object-cover"
                               />
                               <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs">
                                 {participant.userId.name}
                               </div>
                             </div>
                           ))}
                       </div>
                     </div>
                   )}

                   {/* Gallery View */}
                   {viewMode === 'gallery' && (
                     <div className="w-full h-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 content-start">
                       {/* Local Video */}
                       <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                         <video
                           ref={localVideoRef}
                           autoPlay
                           muted
                           playsInline
                           className="w-full h-full object-cover"
                         />
                         <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs">
                           You
                         </div>
                       </div>

                       {/* Remote Videos */}
                       {activeParticipants
                         .filter(p => p.userId._id !== user?.id)
                         .map((participant) => (
                           <div key={participant.userId._id} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                             <video
                               ref={(el) => {
                                 remoteVideoRefs.current[participant.userId._id] = el;
                               }}
                               autoPlay
                               playsInline
                               className="w-full h-full object-cover"
                             />
                             <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs">
                               {participant.userId.name}
                             </div>
                           </div>
                         ))}
                     </div>
                   )}
                 </div>
               </div>
             </div>

            {/* Controls */}
            <div className="bg-white border-t px-6 py-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full relative transition-colors ${
                    isMicOn ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  <MicrophoneIcon className="w-6 h-6" />
                  {!isMicOn && (
                    <XMarkIcon className="w-4 h-4 absolute -top-1 -right-1 bg-red-600 rounded-full text-white p-0.5" />
                  )}
                </button>

                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full relative transition-colors ${
                    isCameraOn ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  <VideoCameraIcon className="w-6 h-6" />
                  {!isCameraOn && (
                    <XMarkIcon className="w-4 h-4 absolute -top-1 -right-1 bg-red-600 rounded-full text-white p-0.5" />
                  )}
                </button>

                <button
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className={`p-3 rounded-full relative transition-colors ${
                    isScreenSharing ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <ComputerDesktopIcon className="w-6 h-6" />
                  {!isScreenSharing && (
                    <XMarkIcon className="w-4 h-4 absolute -top-1 -right-1 bg-gray-600 rounded-full text-white p-0.5" />
                  )}
                </button>

                <button
                  onClick={handleLeaveRoom}
                  className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                >
                  <PhoneIcon className="w-6 h-6 transform rotate-[135deg]" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-white border-l flex flex-col">
            {/* Participants */}
            {showParticipants && (
              <div className="border-b p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Participants</h3>
                <div className="space-y-2">
                  {activeParticipants.map((participant) => (
                    <div key={participant.userId._id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {participant.userId.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {participant.userId.name}
                          {participant.userId._id === user?.id && ' (You)'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(participant.joinedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lesson Chat */}
            <div className="flex-1 flex flex-col">
              <LessonChatBox lessonId={roomId as string} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default VerbfyTalkRoomPage;