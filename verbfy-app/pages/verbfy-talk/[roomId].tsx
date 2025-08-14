import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useI18n } from '@/lib/i18n';
import { verbfyTalkAPI } from '@/lib/api';
import dynamic from 'next/dynamic';

const LiveKitRoom = dynamic<any>(
  () => import('@/components/livekit/LiveKitRoom' as any) as any,
  { ssr: false }
);

export default function VerbfyTalkRoomPage() {
  const router = useRouter();
  const { roomId } = router.query as { roomId?: string };
  const { t } = useI18n();
  const [room, setRoom] = useState<any | null>(null);
  const [joinData, setJoinData] = useState<{ token?: string; url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      try {
        const res: any = await verbfyTalkAPI.getRoomDetails(roomId);
        setRoom(res.data || res);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roomId]);

  const handleJoin = async () => {
    if (!roomId) return;
    try {
      setJoining(true);
      const res: any = await verbfyTalkAPI.joinRoom(roomId);
      setJoinData({ token: res.token ?? res.data?.token, url: res.url ?? res.data?.url });
    } finally {
      setJoining(false);
    }
  };

  return (
    <DashboardLayout title={room?.name || t('talk.title','VerbfyTalk Rooms')}>
      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : joinData?.token && joinData?.url ? (
        <div className="rounded-lg border overflow-hidden">
          <LiveKitRoom token={joinData.token} url={joinData.url} />
        </div>
      ) : (
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-xl font-semibold text-gray-900">{room?.name || t('home.room','Room')}</div>
          <div className="text-sm text-gray-600 mb-4">{room?.isPrivate ? t('home.private','Private') : t('home.public','Public')}</div>
          <button onClick={handleJoin} disabled={joining} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            {joining ? t('talk.joining','Joining...') : t('talk.join','Join Room')}
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}