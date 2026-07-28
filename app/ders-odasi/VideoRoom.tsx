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

interface DersOdasiProps {
  channelName?: string;
}

// ----------------------------------------------------
// 1. İÇ BİLEŞEN: Stabil Arayüz ve Kamera Kontrolleri
// ----------------------------------------------------
function RoomContent({ channelName }: { channelName: string }) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''; 
  const router = useRouter();
  const client = useRTCClient();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [screenTrack, setScreenTrack] = useState<any>(null);
  
  // 🚀 YENİ: Token (Şifre) State'i eklendi
  const [token, setToken] = useState<string | null>(null);

  // 🚀 YENİ: Odaya girmeden önce API'den şifre (bilet) al
  useEffect(() => {
    async function getToken() {
      try {
        const response = await fetch('/api/agora', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName })
        });
        const data = await response.json();
        
        if (data.token) {
          setToken(data.token);
        } else {
          console.error("Şifre alınamadı:", data.error);
        }
      } catch (error) {
        console.error("API'ye ulaşılamadı:", error);
      }
    }
    
    if (channelName) getToken();
  }, [channelName]);

  // 🚀 GÜNCELLENDİ: Artık token null değil, API'den gelen token ile giriyor
  useJoin(
    { appid: appId, channel: channelName, token: token }, 
    !!appId && !!token 
  );
  
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { localCameraTrack } = useLocalCameraTrack();
  
  // Ekran paylaşımı varsa onu, yoksa kamerayı yayına ver
  usePublish([
    localMicrophoneTrack, 
    screenTrack ? screenTrack : localCameraTrack
  ].filter(Boolean));
  
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

        track.on('track-ended', () => {
          track.close();
          setScreenTrack(null);
        });
      } catch (error) {
        console.error("Ekran paylaşımı başlatılamadı:", error);
      }
    } else {
      screenTrack.close();
      setScreenTrack(null);
    }
  };

  const leaveRoom = async () => {
    if (confirm("Dersten ayrılıp panele dönmek istediğinize emin misiniz?")) {
      try {
        if (screenTrack) screenTrack.close();
        localMicrophoneTrack?.close();
        localCameraTrack?.close();
        await client.leave();
      } catch(e) { console.error(e); }
      router.back(); 
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 100%)', color: 'white', fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      {/* --- ÜST BİLGİ --- */}
      <header style={{ position: 'absolute', top: 20, left: 20, right: 20, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '16px 24px', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎓</div>
            TLA Academy
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }}></span>
            Oda: {channelName.slice(0, 8)}...
          </div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.05)' }}>
          🔴 CANLI YAYIN
        </div>
      </header>

      {/* --- ANA SAHNE --- */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px 40px 120px 40px', gap: '24px', overflow: 'hidden' }}>
        
        {screenTrack ? (
          /* EKRAN PAYLAŞIMI AKTİFSE */
          <div style={{ flex: 1, height: '100%', position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <LocalVideoTrack track={screenTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
            <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
              💻 Ekran Paylaşımı
            </div>
          </div>
        ) : (
          /* NORMAL KAMERA GÖRÜNÜMÜ */
          <div style={{ width: '100%', height: '100%', display: 'flex', gap: '24px', justifyContent: 'center' }}>
            
            {/* KARŞI TARAF */}
            {remoteUsers.length > 0 && (
              <div style={{ flex: 1, height: '100%', backgroundColor: '#020617', borderRadius: '30px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                {remoteUsers.map(user => (
                  <RemoteUser key={user.uid} user={user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ))}
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', padding: '10px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: '#3b82f6', borderRadius: '50%', fontSize: '12px' }}>🗣️</span> 
                  Karşı Taraf
                </div>
              </div>
            )}

            {/* KENDİ KAMERAN */}
            <div style={{ flex: 1, maxWidth: remoteUsers.length > 0 ? '50%' : '100%', height: '100%', backgroundColor: '#020617', borderRadius: '30px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', transition: 'all 0.3s ease' }}>
              {localCameraTrack && !isVideoOff ? (
                <LocalVideoTrack track={localCameraTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', background: 'radial-gradient(circle, #1e293b 0%, #020617 100%)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🚫</div>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>Kamera Kapalı</span>
                  </div>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: '24px', left: '24px', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', padding: '10px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: '#10b981', borderRadius: '50%', fontSize: '12px' }}>👤</span> 
                Sen
              </div>
            </div>

          </div>
        )}
      </main>

      {/* --- ALT KONTROL BAR'I --- */}
      <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '24px', display: 'flex', gap: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', alignItems: 'center' }}>
          <button onClick={toggleMic} style={actionBtn(isMuted)}>
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button onClick={toggleCamera} style={actionBtn(isVideoOff)}>
            {isVideoOff ? '🚫' : '📷'}
          </button>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>
          <button onClick={toggleScreenShare} style={{ ...actionBtn(screenTrack !== null), width: 'auto', padding: '0 24px', gap: 8 }}>
            💻 {screenTrack ? 'Paylaşımı Durdur' : 'Ekran Paylaş'}
          </button>
          <button onClick={leaveRoom} style={{ background: '#ef4444', color: 'white', border: 'none', height: 48, padding: '0 28px', borderRadius: '16px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', marginLeft: 8 }}>
            Dersten Ayrıl
          </button>
        </div>
      </div>
    </div>
  );
}

function actionBtn(isActive: boolean) {
  return {
    width: 48,
    height: 48,
    borderRadius: '16px',
    border: '1px solid',
    borderColor: isActive ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.1)',
    backgroundColor: isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
    color: isActive ? '#ef4444' : '#f8fafc',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  };
}

// ----------------------------------------------------
// 2. DIŞ BİLEŞEN: Agora Client Sağlayıcı
// ----------------------------------------------------
export default function VideoRoom({ channelName = 'denemedersi' }: DersOdasiProps) {
  const client = useRTCClient(AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' }));

  return (
    <AgoraRTCProvider client={client}>
      <RoomContent channelName={channelName} />
    </AgoraRTCProvider>
  );
}