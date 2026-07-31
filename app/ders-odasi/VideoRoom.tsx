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
// 🚀 Yeni, zarif ve ince çizgili modern vektörel ikonlarımız
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Share2,
  MessageSquare,
  Unlock,
  Lock,
  X,
  Send,
  User,
  Users,
  AlertCircle
} from 'lucide-react';

// Safari/Mobil tarayıcılarda sesin sessiz kalmasını önlemek için standart ayar
if (typeof window !== 'undefined') {
  (AgoraRTC as any)?.setParameter?.('ENABLE_AUDIO_RMS', true);
}

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
        
        // 🚀 TS HATASI ÇÖZÜMÜ: Sadece localCameraTrack null değilse unpublish yap
        if (localCameraTrack) {
          await client.unpublish(localCameraTrack);
        }

        setScreenTrack(track);

        const sClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        await sClient.join(appId, channelName, token, SCREEN_SHARE_UID);
        await sClient.publish(track);
        setScreenClient(sClient);

        track.on('track-ended', async () => {
          track.close(); setScreenTrack(null);
          await sClient.leave(); setScreenClient(null);
          if (localCameraTrack) await client.publish(localCameraTrack);
        });
      } catch (error) { 
        console.error("Ekran paylaşılamadı:", error); 
      } finally {
        setIsScreenStarting(false);
      }
    } else {
      screenTrack.close(); setScreenTrack(null);
      if (screenClient) { await screenClient.leave(); setScreenClient(null); }
      if (localCameraTrack) await client.publish(localCameraTrack);
    }
  };

  const leaveRoom = async () => {
    const mesaj = gercekRol === "ogretmen" 
      ? "Dersi tamamen sonlandırmak istediğinize emin misiniz?" 
      : "Dersten çıkmak istediğinize emin misiniz? (İstediğiniz zaman tekrar katılabilirsiniz)";
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
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', color: '#0f172a', fontFamily: '"Inter", system-ui, sans-serif', overflow: 'hidden' }}>
      
      {/* 1. ÜST BİLGİ BAR (Şeffaf & Aydınlık) */}
      <header style={{ height: '72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 28px', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' }}>T</div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', display: 'block', lineHeight: 1.2 }}>Turkish Learning Academy</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Birebir Canlı Eğitim Odası</span>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1', margin: '0 8px' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 700 }}>Oda: {channelName.slice(0, 15)}</span>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '20px 28px', display: 'flex', gap: '20px', overflow: 'hidden', height: 'calc(100vh - 170px)' }}>
        
        {/* ANA EKRAN / SOL PANEL */}
        <div style={{ flex: isChatOpen ? 2.5 : 3, backgroundColor: '#000000', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '2px solid #ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', transition: 'all 0.3s' }}>
          {tokenLoading ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '1.1rem', fontWeight: 600, gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #334155', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span>Güvenli ders bağlantısı kuruluyor...</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : isLocalSharing ? (
            <>
              <LocalVideoTrack track={screenTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <NameBadge name="Sizin Ekranınız" isLocal={true} />
            </>
          ) : remoteScreenUser ? (
            <>
              <RemoteUser user={remoteScreenUser} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <NameBadge name={`${karsiTarafRolu} Ekranı`} isLocal={false} />
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
          <div style={{ flex: 1, maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
            
            {/* KAMERALAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: isChatOpen ? '45%' : '100%' }}>
              <div style={{ width: '100%', height: '200px', minHeight: '200px', backgroundColor: '#000000', borderRadius: '20px', overflow: 'hidden', position: 'relative', border: '2px solid #ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {localCameraTrack && !isVideoOff ? (
                  <LocalVideoTrack track={localCameraTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                ) : (
                  <CameraOffState name="Kameranız Kapalı" />
                )}
                <NameBadge name={`Sen (${benimRolum})`} isLocal={true} />
              </div>

              {remoteCameraUsers.map(user => (
                <div key={user.uid} style={{ width: '100%', height: '200px', minHeight: '200px', backgroundColor: '#000000', borderRadius: '20px', overflow: 'hidden', position: 'relative', border: '2px solid #ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <RemoteUser user={user} playVideo={true} playAudio={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <NameBadge name={karsiTarafRolu} isLocal={false} />
                </div>
              ))}
            </div>

            {/* SOHBET PANELİ */}
            {isChatOpen && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 800, fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', color: '#0f172a' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} color="#4f46e5" />
                    Ders Sohbeti
                  </span>
                  <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={18} />
                  </button>
                </div>
                
                <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '24px' }}>Henüz mesaj yok. İlk mesajı siz gönderin!</div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} style={{ alignSelf: msg.sender === benimRolum ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', textAlign: msg.sender === benimRolum ? 'right' : 'left', fontWeight: 600 }}>
                          {msg.sender} • {msg.time}
                        </div>
                        <div style={{ backgroundColor: msg.sender === benimRolum ? '#4f46e5' : '#f1f5f9', color: msg.sender === benimRolum ? '#ffffff' : '#0f172a', padding: '10px 14px', borderRadius: '14px', fontSize: '0.9rem', lineHeight: 1.4, borderBottomRightRadius: msg.sender === benimRolum ? 0 : '14px', borderBottomLeftRadius: msg.sender === benimRolum ? '14px' : 0, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendChatMessage} style={{ padding: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', backgroundColor: '#f8fafc' }}>
                  <input 
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    placeholder="Mesaj yazın..." 
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none', fontSize: '0.9rem' }}
                  />
                  <button type="submit" disabled={!chatInput.trim()} style={{ padding: '0 14px', borderRadius: '10px', border: 'none', backgroundColor: chatInput.trim() ? '#4f46e5' : '#e2e8f0', color: chatInput.trim() ? '#ffffff' : '#94a3b8', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 2. APPLE TARZI YÜZEN KONTROL ADASI (Floating Pill Bar) */}
      <footer style={{ paddingBottom: '24px', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(16px)', padding: '10px 20px', borderRadius: '40px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.08)' }}>
          
          <button onClick={toggleMic} title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'} style={controlBtn(isMuted)}>
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button onClick={toggleCamera} title={isVideoOff ? 'Kamerayı Aç' : 'Kamerayı Kapat'} style={controlBtn(isVideoOff)}>
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          <button onClick={() => setIsChatOpen(!isChatOpen)} title="Sohbeti Aç/Kapat" style={{ ...controlBtn(isChatOpen), borderColor: isChatOpen ? '#4f46e5' : '#e2e8f0', backgroundColor: isChatOpen ? '#eef2ff' : '#ffffff', color: isChatOpen ? '#4f46e5' : '#0f172a' }}>
            <MessageSquare size={20} />
          </button>
          
          <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>
          
          {gercekRol === "ogretmen" ? (
            <>
              <button 
                onClick={toggleScreenShare} 
                disabled={isScreenStarting}
                style={{
                  ...controlBtn(isLocalSharing),
                  width: 'auto',
                  padding: '0 18px', 
                  gap: '8px',
                  fontWeight: 700,
                  cursor: isScreenStarting ? 'wait' : 'pointer',
                  backgroundColor: isScreenStarting ? '#eab308' : (isLocalSharing ? '#fee2e2' : '#ffffff'),
                  color: isScreenStarting ? '#ffffff' : (isLocalSharing ? '#ef4444' : '#0f172a'),
                  borderColor: isScreenStarting ? '#eab308' : (isLocalSharing ? '#fee2e2' : '#e2e8f0')
                }}
              >
                <Share2 size={18} />
                <span>{isScreenStarting ? 'Hazırlanıyor...' : (isLocalSharing ? 'Paylaşımı Durdur' : 'Ekran Paylaş')}</span>
              </button>
            
              <button onClick={toggleStudentPermission} title="Öğrenci Ekran İznini Değiştir" style={{ backgroundColor: teacherPermissionState ? '#dcfce7' : '#f1f5f9', color: teacherPermissionState ? '#16a34a' : '#475569', border: '1px solid', borderColor: teacherPermissionState ? '#bbf7d0' : '#e2e8f0', height: '48px', padding: '0 18px', borderRadius: '24px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {teacherPermissionState ? <Unlock size={18} /> : <Lock size={18} />}
                <span>{teacherPermissionState ? 'Öğrenci Ekranı: Açık' : 'Öğrenci Ekranı: Kilitli'}</span>
              </button>
            </>
          ) : (
            <button 
              onClick={toggleScreenShare} 
              disabled={isScreenStarting || (!studentScreenAllowed && !isLocalSharing)}
              style={{
                ...controlBtn(isLocalSharing),
                width: 'auto',
                padding: '0 18px', 
                gap: '8px',
                fontWeight: 700,
                opacity: (!studentScreenAllowed && !isLocalSharing) ? 0.5 : 1,
                cursor: isScreenStarting ? 'wait' : ((!studentScreenAllowed && !isLocalSharing) ? 'not-allowed' : 'pointer'),
                backgroundColor: isScreenStarting ? '#eab308' : (isLocalSharing ? '#fee2e2' : '#ffffff'),
                color: isScreenStarting ? '#ffffff' : (isLocalSharing ? '#ef4444' : '#0f172a'),
                borderColor: isScreenStarting ? '#eab308' : (isLocalSharing ? '#fee2e2' : '#e2e8f0')
              }}
              title={(!studentScreenAllowed && !isLocalSharing) ? "Öğretmeninizden izin istemelisiniz" : ""}
            >
              <Share2 size={18} />
              <span>{isScreenStarting ? 'Hazırlanıyor...' : (isLocalSharing ? 'Paylaşımı Durdur' : 'Ekran Paylaş')}</span>
              {(!studentScreenAllowed && !isLocalSharing) && <Lock size={16} />}
            </button>
          )}

          <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>

          <button onClick={leaveRoom} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', height: '48px', padding: '0 24px', borderRadius: '24px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', transition: 'all 0.2s' }}>
            <PhoneOff size={18} />
            <span>{gercekRol === "ogretmen" ? "Dersi Bitir" : "Dersten Çık"}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

function controlBtn(isActive: boolean): React.CSSProperties {
  return {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '1px solid',
    borderColor: isActive ? '#fee2e2' : '#e2e8f0',
    backgroundColor: isActive ? '#ef4444' : '#ffffff',
    color: isActive ? '#ffffff' : '#0f172a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
  };
}

function NameBadge({ name, isLocal }: { name: string, isLocal: boolean }) {
  return (
    <div style={{ position: 'absolute', bottom: '16px', left: '16px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 10 }}>
      {isLocal ? <User size={14} color="#10b981" /> : <Users size={14} color="#3b82f6" />}
      <span>{name}</span>
    </div>
  );
}

function CameraOffState({ name }: { name: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#64748b' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1e293b', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
          <VideoOff size={28} />
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>{name}</span>
      </div>
    </div>
  );
}

export default function VideoRoom({ channelName = 'denemedersi', userRole = 'ogrenci' }: DersOdasiProps) {
  const client = useRTCClient(AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' }));
  return (
    <AgoraRTCProvider client={client}>
      <RoomContent channelName={channelName} userRole={userRole} />
    </AgoraRTCProvider>
  );
}