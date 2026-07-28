'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AgoraRTC, {
  AgoraRTCProvider,
  LocalVideoTrack,
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRTCClient,
  useRemoteUsers,
  useRemoteAudioTracks,
} from 'agora-rtc-react';

// 🚀 YENİ: VideoRoom artık kullanıcının rolünü (Öğretmen/Öğrenci) dışarıdan alıyor!
interface DersOdasiProps {
  channelName?: string;
  userRole?: "ogretmen" | "ogrenci" | "secim"; 
}

function RoomContent({ channelName, userRole }: { channelName: string, userRole: string }) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''; 
  const router = useRouter();
  const client = useRTCClient();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [screenTrack, setScreenTrack] = useState<any>(null);
  const [screenClient, setScreenClient] = useState<any>(null); 
  const [token, setToken] = useState<string | null>(null);

  const SCREEN_SHARE_UID = 88888888; 

  // Dinamik İsimlendirme Mantığı
  const benimRolum = userRole === "ogretmen" ? "Öğretmen" : "Öğrenci";
  const karsiTarafRolu = userRole === "ogretmen" ? "Öğrenci" : "Öğretmen";

  useEffect(() => {
    async function getToken() {
      try {
        const response = await fetch('/api/agora', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName })
        });
        const data = await response.json();
        if (data.token) setToken(data.token);
      } catch (error) { console.error("API Hatası:", error); }
    }
    if (channelName) getToken();
  }, [channelName]);

  useJoin({ appid: appId, channel: channelName, token: token }, !!appId && !!token);
  
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { localCameraTrack } = useLocalCameraTrack();
  
  usePublish([localMicrophoneTrack, localCameraTrack].filter(Boolean));
  
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers); 

  useEffect(() => {
    audioTracks.map(track => track.play());
  }, [audioTracks]);

  const toggleMic = () => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localCameraTrack) {
      localCameraTrack.setMuted(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!screenTrack) {
      try {
        const track = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_1" }, "disable");
        setScreenTrack(track);

        const sClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        await sClient.join(appId, channelName, token, SCREEN_SHARE_UID); 
        await sClient.publish(track);
        setScreenClient(sClient);

        track.on('track-ended', async () => {
          track.close();
          setScreenTrack(null);
          await sClient.leave();
          setScreenClient(null);
        });
      } catch (error) { console.error("Ekran paylaşılamadı:", error); }
    } else {
      screenTrack.close();
      setScreenTrack(null);
      if (screenClient) {
        await screenClient.leave();
        setScreenClient(null);
      }
    }
  };

  const leaveRoom = async () => {
    // Kişinin rolüne göre uyarı mesajı ver
    const mesaj = userRole === "ogretmen" 
      ? "Dersi tamamen sonlandırmak istediğinize emin misiniz?" 
      : "Dersten çıkmak istediğinize emin misiniz? (İstediğiniz zaman tekrar katılabilirsiniz)";

    if (confirm(mesaj)) {
      try {
        if (screenTrack) {
          screenTrack.close();
          if (screenClient) await screenClient.leave();
        }
        localMicrophoneTrack?.close();
        localCameraTrack?.close();
        await client.leave();
      } catch(e) { console.error(e); }
      router.back(); 
    }
  };

  const isLocalSharing = screenTrack !== null;
  const remoteScreenUser = remoteUsers.find(u => Number(u.uid) === SCREEN_SHARE_UID);
  const remoteCameraUsers = remoteUsers.filter(u => Number(u.uid) !== SCREEN_SHARE_UID);
  const firstRemoteCamera = remoteCameraUsers.length > 0 ? remoteCameraUsers[0] : null;

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', color: 'white', fontFamily: '"Inter", system-ui, sans-serif', overflow: 'hidden' }}>
      
      <header style={{ height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🎓</div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>TLA Academy Live <span style={{color: '#10b981'}}>(v3 - Akıllı)</span></span>
          <div style={{ height: '20px', width: '1px', backgroundColor: '#475569', margin: '0 12px' }}></div>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Ders ID: {channelName.slice(0, 10)}...</span>
        </div>
      </header>

      <main style={{ flex: 1, padding: '24px', display: 'flex', gap: '24px', overflow: 'hidden', height: 'calc(100vh - 170px)' }}>
        
        {/* ANA EKRAN */}
        <div style={{ flex: 3, backgroundColor: '#020617', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          {isLocalSharing ? (
            <>
              <LocalVideoTrack track={screenTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <NameBadge name="💻 Sizin Ekranınız" isLocal={true} />
            </>
          ) : remoteScreenUser ? (
            <>
              <RemoteUser user={remoteScreenUser} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              {/* Dinamik Ekran Sahibi İsmi */}
              <NameBadge name={`💻 ${karsiTarafRolu} Ekranı`} isLocal={false} />
            </>
          ) : firstRemoteCamera ? (
            <>
              <RemoteUser user={firstRemoteCamera} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Dinamik Karşı Taraf İsmi */}
              <NameBadge name={karsiTarafRolu} isLocal={false} />
            </>
          ) : (
            <>
              {localCameraTrack && !isVideoOff ? (
                <LocalVideoTrack track={localCameraTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              ) : (
                <CameraOffState name="Kameranız Kapalı" />
              )}
              {/* Dinamik Kendi İsmin */}
              <NameBadge name={`Sen (${benimRolum}) - Oda Boş`} isLocal={true} />
            </>
          )}
        </div>

        {/* YAN PANEL */}
        {(isLocalSharing || remoteScreenUser || firstRemoteCamera) && (
          <div style={{ flex: 1, maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            
            <div style={{ width: '100%', height: '240px', minHeight: '240px', backgroundColor: '#020617', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid #334155' }}>
              {localCameraTrack && !isVideoOff ? (
                <LocalVideoTrack track={localCameraTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              ) : (
                <CameraOffState name="Kameranız Kapalı" />
              )}
              <NameBadge name={`Sen (${benimRolum})`} isLocal={true} />
            </div>

            {remoteCameraUsers.map(user => (
              <div key={user.uid} style={{ width: '100%', height: '240px', minHeight: '240px', backgroundColor: '#020617', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid #334155' }}>
                <RemoteUser user={user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <NameBadge name={karsiTarafRolu} isLocal={false} />
              </div>
            ))}
            
          </div>
        )}
      </main>

      <footer style={{ height: '100px', backgroundColor: '#1e293b', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={toggleMic} style={controlBtn(isMuted)}>{isMuted ? '🔇' : '🎤'}</button>
          <button onClick={toggleCamera} style={controlBtn(isVideoOff)}>{isVideoOff ? '🚫' : '📷'}</button>
          <div style={{ width: '1px', height: '40px', backgroundColor: '#334155', margin: '0 8px' }}></div>
          <button onClick={toggleScreenShare} style={{ ...controlBtn(isLocalSharing), width: 'auto', padding: '0 24px', gap: '8px', fontWeight: 600 }}>
            💻 {isLocalSharing ? 'Paylaşımı Durdur' : 'Ekranı Paylaş'}
          </button>
          
          {/* 🚀 DÜZELTİLEN KISIM: Buton yazısı role göre dinamik oldu */}
          <button onClick={leaveRoom} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', height: '52px', padding: '0 32px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginLeft: '16px', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}>
            {userRole === "ogretmen" ? "Dersi Bitir" : "Dersten Çık"}
          </button>
          
        </div>
      </footer>
    </div>
  );
}

function controlBtn(isActive: boolean) {
  return { width: '52px', height: '52px', borderRadius: '12px', border: '1px solid', borderColor: isActive ? '#ef4444' : '#475569', backgroundColor: isActive ? 'rgba(239, 68, 68, 0.1)' : '#334155', color: isActive ? '#ef4444' : '#f8fafc', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' };
}
function NameBadge({ name, isLocal }: { name: string, isLocal: boolean }) {
  return <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 10 }}><span style={{ color: isLocal ? '#10b981' : '#3b82f6', fontSize: '14px' }}>{isLocal ? '👤' : '🗣️'}</span>{name}</div>;
}
function CameraOffState({ name }: { name: string }) {
  return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #1e293b 0%, #020617 100%)', color: '#64748b' }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}><div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🚫</div><span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{name}</span></div></div>;
}

export default function VideoRoom({ channelName = 'denemedersi', userRole = 'ogrenci' }: DersOdasiProps) {
  const client = useRTCClient(AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' }));
  return (
    <AgoraRTCProvider client={client}>
      <RoomContent channelName={channelName} userRole={userRole} />
    </AgoraRTCProvider>
  );
}