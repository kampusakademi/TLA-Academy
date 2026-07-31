'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
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
  
  // 🚀 KURUMSAL USUL: Resmi yetki token'ı state'i
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  const [gercekRol, setGercekRol] = useState(userRole);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [studentScreenAllowed, setStudentScreenAllowed] = useState(false); 
  const [teacherPermissionState, setTeacherPermissionState] = useState(false); 
  const [isScreenStarting, setIsScreenStarting] = useState(false); 
  const chatEndRef = useRef<HTMLDivElement>(null);

  const SCREEN_SHARE_UID = 88888888; 

  useEffect(() => {
    async function rolTespitEt() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: egitmenData } = await supabase.from('egitmenler').select('id').eq('user_id', user.id).maybeSingle();
        if (egitmenData) setGercekRol("ogretmen");
        else setGercekRol("ogrenci");
      }
    }
    rolTespitEt();
  }, []);

  const benimRolum = gercekRol === "ogretmen" ? "Öğretmen" : "Öğrenci";
  const karsiTarafRolu = gercekRol === "ogretmen" ? "Öğrenci" : "Öğretmen";

  // Supabase Broadcast (Sohbet & Ekran Paylaşımı İzinleri)
  useEffect(() => {
    if (!channelName) return;
    
    const roomChannel = supabase.channel(`ders_odasi_${channelName}`);

    roomChannel
      .on('broadcast', { event: 'room_action' }, (payload) => {
        const veri = payload.payload;
        
        if (veri.type === 'chat') {
          setChatMessages(prev => [...prev, veri]);
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
        else if (veri.type === 'permission') {
          if (gercekRol === "ogrenci") {
            setStudentScreenAllowed(veri.allowed);
            if (!veri.allowed && screenTrack) {
               toggleScreenShare(); 
               alert("Öğretmen ekran paylaşımı izninizi kaldırdı.");
            }
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(roomChannel); };
  }, [channelName, gercekRol, screenTrack]);

  const toggleStudentPermission = () => {
    const newState = !teacherPermissionState;
    setTeacherPermissionState(newState);
    
    supabase.channel(`ders_odasi_${channelName}`).send({
      type: 'broadcast',
      event: 'room_action',
      payload: { type: 'permission', allowed: newState }
    });
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msg = { 
      type: 'chat', 
      sender: benimRolum, 
      text: chatInput, 
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
    };
    
    supabase.channel(`ders_odasi_${channelName}`).send({ type: 'broadcast', event: 'room_action', payload: msg });
    
    setChatMessages(prev => [...prev, msg]);
    setChatInput("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // 🚀 RESMİ VE GÜVENLİ TOKEN ALMA İŞLEMİ
  useEffect(() => {
    let isMounted = true;
    async function getToken() {
      try {
        setTokenLoading(true);
        const response = await fetch('/api/agora', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ channelName }) 
        });
        const data = await response.json();
        if (isMounted && data.token) {
          setToken(data.token);
        } else {
          console.error("Token alınamadı:", data.error);
        }
      } catch (error) { 
        console.error("Token API Hatası:", error); 
      } finally {
        if (isMounted) setTokenLoading(false);
      }
    }

    if (channelName) {
      getToken();
    }
    return () => { isMounted = false; };
  }, [channelName]);

  // 🚀 USULÜNE UYGUN BAĞLANTI: Token gelmeden odaya girilmez, token gelince anında bağlanılır
  useJoin(
    { appid: appId, channel: channelName, token: token },
    !!appId && !!channelName && !!token
  );
  
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { localCameraTrack } = useLocalCameraTrack();
  
  usePublish([localMicrophoneTrack, localCameraTrack].filter(Boolean));
  
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers); 

  useEffect(() => { 
    audioTracks.forEach(track => {
      try { track.play(); } catch(e) { console.warn("Ses hatası:", e); }
    }); 
  }, [audioTracks]);

  const toggleMic = () => { if (localMicrophoneTrack) { localMicrophoneTrack.setMuted(!isMuted); setIsMuted(!isMuted); } };
  const toggleCamera = () => { if (localCameraTrack) { localCameraTrack.setMuted(!isVideoOff); setIsVideoOff(!isVideoOff); } };

  const toggleScreenShare = async () => {
    if (gercekRol === "ogrenci" && !studentScreenAllowed && !screenTrack) {
      alert("Ekran paylaşabilmek için lütfen öğretmeninizden izin isteyin.");
      return;
    }

    if (!screenTrack) {
      try {
        setIsScreenStarting(true); 
        const track = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "720p_2" }, "disable");
        setScreenTrack(track);

        const sClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        await sClient.join(appId, channelName, token, SCREEN_SHARE_UID); 
        await sClient.publish(track);
        setScreenClient(sClient);

        track.on('track-ended', async () => {
          track.close(); setScreenTrack(null);
          await sClient.leave(); setScreenClient(null);
        });
      } catch (error) { 
        console.error("Ekran paylaşılamadı:", error); 
      } finally {
        setIsScreenStarting(false); 
      }
    } else {
      screenTrack.close(); setScreenTrack(null);
      if (screenClient) { await screenClient.leave(); setScreenClient(null); }
    }
  };

  const leaveRoom = async () => {
    const mesaj = gercekRol === "ogretmen" ? "Dersi tamamen sonlandırmak istediğinize emin misiniz?" : "Dersten çıkmak istediğinize emin misiniz? (İstediğiniz zaman tekrar katılabilirsiniz)";
    if (confirm(mesaj)) {
      try {
        if (screenTrack) { screenTrack.close(); if (screenClient) await screenClient.leave(); }
        localMicrophoneTrack?.close(); localCameraTrack?.close();
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
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>TLA Academy Live</span>
          <div style={{ height: '20px', width: '1px', backgroundColor: '#475569', margin: '0 12px' }}></div>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Ders ID: {channelName.slice(0, 10)}...</span>
        </div>
      </header>

      <main style={{ flex: 1, padding: '24px', display: 'flex', gap: '24px', overflow: 'hidden', height: 'calc(100vh - 170px)' }}>
        
        {/* ANA EKRAN */}
        <div style={{ flex: isChatOpen ? 2.5 : 3, backgroundColor: '#020617', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transition: 'all 0.3s' }}>
          {tokenLoading ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.1rem', fontWeight: 600 }}>
              🔒 Güvenli ders bağlantısı kuruluyor...
            </div>
          ) : isLocalSharing ? (
            <>
              <LocalVideoTrack track={screenTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <NameBadge name="💻 Sizin Ekranınız" isLocal={true} />
            </>
          ) : remoteScreenUser ? (
            <>
              <RemoteUser user={remoteScreenUser} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <NameBadge name={`💻 ${karsiTarafRolu} Ekranı`} isLocal={false} />
            </>
          ) : firstRemoteCamera ? (
            <>
              <RemoteUser user={firstRemoteCamera} playVideo={true} playAudio={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <NameBadge name={karsiTarafRolu} isLocal={false} />
            </>
          ) : (
            <>
              {localCameraTrack && !isVideoOff ? (
                <LocalVideoTrack track={localCameraTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              ) : (
                <CameraOffState name="Kameranız Kapalı" />
              )}
              <NameBadge name={`Sen (${benimRolum}) - Oda Boş`} isLocal={true} />
            </>
          )}
        </div>

        {/* SAĞ PANEL (Kişiler ve Sohbet) */}
        {(isLocalSharing || remoteScreenUser || firstRemoteCamera || isChatOpen) && (
          <div style={{ flex: 1, maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
            
            {/* KAMERALAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: isChatOpen ? '45%' : '100%' }}>
              <div style={{ width: '100%', height: '200px', minHeight: '200px', backgroundColor: '#020617', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid #334155' }}>
                {localCameraTrack && !isVideoOff ? (
                  <LocalVideoTrack track={localCameraTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                ) : (
                  <CameraOffState name="Kameranız Kapalı" />
                )}
                <NameBadge name={`Sen (${benimRolum})`} isLocal={true} />
              </div>

              {remoteCameraUsers.map(user => (
                <div key={user.uid} style={{ width: '100%', height: '200px', minHeight: '200px', backgroundColor: '#020617', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid #334155' }}>
                  <RemoteUser user={user} playVideo={true} playAudio={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <NameBadge name={karsiTarafRolu} isLocal={false} />
                </div>
              ))}
            </div>

            {/* SOHBET PANELİ */}
            {isChatOpen && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155', fontWeight: 700, fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>💬 Ders Sohbeti</span>
                  <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✖</button>
                </div>
                
                <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '20px' }}>Henüz mesaj yok.</div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} style={{ alignSelf: msg.sender === benimRolum ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', textAlign: msg.sender === benimRolum ? 'right' : 'left' }}>{msg.sender} • {msg.time}</div>
                        <div style={{ backgroundColor: msg.sender === benimRolum ? '#3b82f6' : '#334155', padding: '8px 12px', borderRadius: '12px', fontSize: '0.9rem', lineHeight: 1.4, borderBottomRightRadius: msg.sender === benimRolum ? 0 : '12px', borderBottomLeftRadius: msg.sender === benimRolum ? '12px' : 0 }}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendChatMessage} style={{ padding: '12px', borderTop: '1px solid #334155', display: 'flex', gap: '8px' }}>
                  <input 
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    placeholder="Mesaj yazın..." 
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: 'white', outline: 'none', fontSize: '0.9rem' }}
                  />
                  <button type="submit" disabled={!chatInput.trim()} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: chatInput.trim() ? '#3b82f6' : '#334155', color: 'white', cursor: chatInput.trim() ? 'pointer' : 'not-allowed' }}>➤</button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ height: '100px', backgroundColor: '#1e293b', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={toggleMic} style={controlBtn(isMuted)}>{isMuted ? '🔇' : '🎤'}</button>
          <button onClick={toggleCamera} style={controlBtn(isVideoOff)}>{isVideoOff ? '🚫' : '📷'}</button>
          <button onClick={() => setIsChatOpen(!isChatOpen)} style={{ ...controlBtn(isChatOpen), border: 'none' }}>💬</button>
          
          <div style={{ width: '1px', height: '40px', backgroundColor: '#334155', margin: '0 8px' }}></div>
          
          {gercekRol === "ogretmen" ? (
            <>
              <button 
                onClick={toggleScreenShare} 
                disabled={isScreenStarting}
                style={{ 
                  ...controlBtn(isLocalSharing), 
                  width: 'auto', 
                  padding: '0 20px', 
                  gap: '8px', 
                  fontWeight: 600,
                  cursor: isScreenStarting ? 'wait' : 'pointer',
                  backgroundColor: isScreenStarting ? '#eab308' : (isLocalSharing ? 'rgba(239, 68, 68, 0.1)' : '#334155'),
                  color: isScreenStarting ? '#ffffff' : (isLocalSharing ? '#ef4444' : '#f8fafc'),
                  borderColor: isScreenStarting ? '#eab308' : (isLocalSharing ? '#ef4444' : '#475569')
                }}
              >
                💻 {isScreenStarting ? 'Hazırlanıyor...' : (isLocalSharing ? 'Ekranı Durdur' : 'Ekran Paylaş')}
              </button>
              
              <button onClick={toggleStudentPermission} style={{ backgroundColor: teacherPermissionState ? '#10b981' : '#334155', color: '#ffffff', border: 'none', height: '52px', padding: '0 20px', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {teacherPermissionState ? '🔓 Öğrenci Ekran Paylaşabilir' : '🔒 Öğrenci Ekran İzni Kapalı'}
              </button>
            </>
          ) : (
            <button 
              onClick={toggleScreenShare} 
              disabled={isScreenStarting || (!studentScreenAllowed && !isLocalSharing)}
              style={{ 
                ...controlBtn(isLocalSharing), 
                width: 'auto', 
                padding: '0 20px', 
                gap: '8px', 
                fontWeight: 600, 
                opacity: (!studentScreenAllowed && !isLocalSharing) ? 0.5 : 1, 
                cursor: isScreenStarting ? 'wait' : ((!studentScreenAllowed && !isLocalSharing) ? 'not-allowed' : 'pointer'),
                backgroundColor: isScreenStarting ? '#eab308' : (isLocalSharing ? 'rgba(239, 68, 68, 0.1)' : '#334155'),
                color: isScreenStarting ? '#ffffff' : (isLocalSharing ? '#ef4444' : '#f8fafc'),
                borderColor: isScreenStarting ? '#eab308' : (isLocalSharing ? '#ef4444' : '#475569')
              }}
              title={(!studentScreenAllowed && !isLocalSharing) ? "Öğretmeninizden izin istemelisiniz" : ""}
            >
              💻 {isScreenStarting ? 'Hazırlanıyor...' : (isLocalSharing ? 'Paylaşımı Durdur' : 'Ekranı Paylaş')} {(!studentScreenAllowed && !isLocalSharing) && '🔒'}
            </button>
          )}

          <button onClick={leaveRoom} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', height: '52px', padding: '0 32px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginLeft: 'auto' }}>
            {gercekRol === "ogretmen" ? "Dersi Bitir" : "Dersten Çık"}
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