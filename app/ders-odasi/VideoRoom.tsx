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
  PenTool,
  Trash2,
  Eraser,
  Type,
  ImageIcon,
  Search,
  MousePointer2
} from 'lucide-react';

if (typeof window !== 'undefined') {
  AgoraRTC.setLogLevel(4);
  (AgoraRTC as any)?.setParameter?.('ENABLE_AUDIO_RMS', true);
}

interface DersOdasiProps {
  channelName?: string;
  userRole?: "ogretmen" | "ogrenci" | "secim";
}

// 🚀 NESNE MOTORU TİPLEMELERİ (Yazı ve Resimler İçin)
interface CanvasObject {
  id: string;
  type: 'text' | 'image';
  x: number; 
  y: number; 
  w: number; 
  h: number; 
  text?: string;
  url?: string;
  color?: string;
  imgElement?: HTMLImageElement;
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
  const [tokenLoading, setTokenLoading] = useState(true);

  const [gercekRol, setGercekRol] = useState(userRole);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [studentScreenAllowed, setStudentScreenAllowed] = useState(false);
  const [teacherPermissionState, setTeacherPermissionState] = useState(false);
  const [isScreenStarting, setIsScreenStarting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ================= BEYAZ TAHTA STATE'LERİ =================
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser' | 'text' | 'move'>('pen');
  const [drawColor, setDrawColor] = useState('#0f172a');
  
  // Ekranda Yazı Yazma State'i
  const [textInput, setTextInput] = useState({ visible: false, id: '', x: 0, y: 0, realX: 0, realY: 0, text: '' });

  // Görsel Arama Modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [imageSearchResults, setImageSearchResults] = useState<string[]>([]);
  const [isSearchingImage, setIsSearchingImage] = useState(false);

  // Canvas ve Motor Referansları
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const posRef = useRef({ x: 0, y: 0 });
  
  // 🚀 İKİ FARKLI KATMAN: Çizgiler ayrı, Nesneler (Yazı/Resim) ayrı tutulur
  const linesRef = useRef<any[]>([]);
  const objectsRef = useRef<CanvasObject[]>([]);
  const selectedObjIdRef = useRef<string | null>(null);
  const interactRef = useRef({ action: 'none', id: '', offsetX: 0, offsetY: 0 });

  const pendingDraws = useRef<any[]>([]);
  const lastEmitTime = useRef(0);

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

  const toggleStudentPermission = () => {
    const newState = !teacherPermissionState;
    setTeacherPermissionState(newState);
    supabase.channel(`ders_odasi_${channelName}`).send({ type: 'broadcast', event: 'room_action', payload: { type: 'permission', allowed: newState } });
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = { type: 'chat', sender: benimRolum, text: chatInput, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) };
    supabase.channel(`ders_odasi_${channelName}`).send({ type: 'broadcast', event: 'room_action', payload: msg });
    setChatMessages(prev => [...prev, msg]);
    setChatInput("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => { if (client) client.enableDualStream().catch(() => {}); }, [client]);

  // 🚀 GERÇEK ZAMANLI VERİ DİNLEYİCİSİ (Ağ Senkronizasyonu)
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
        else if (veri.type === 'whiteboard_toggle') {
          setIsWhiteboardActive(veri.active);
        }
        else if (veri.type === 'draw_batch') {
          veri.lines.forEach((line: any) => {
            linesRef.current.push(line);
          });
          redrawAll();
        }
        else if (veri.type === 'sync_objects') {
          veri.objects.forEach((newObj: CanvasObject) => {
            if (newObj.type === 'image') {
              const existing = objectsRef.current.find(o => o.id === newObj.id);
              if (existing && existing.url === newObj.url && existing.imgElement) {
                newObj.imgElement = existing.imgElement;
              } else {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = newObj.url!;
                newObj.imgElement = img;
                img.onload = redrawAll;
              }
            }
          });
          objectsRef.current = veri.objects;
          redrawAll();
        }
        else if (veri.type === 'clear_board') {
          linesRef.current = [];
          objectsRef.current = [];
          redrawAll();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(roomChannel); };
  }, [channelName, gercekRol, screenTrack]);

  // ================= BEYAZ TAHTA ÇEKİRDEK KODLARI =================
  const toggleWhiteboard = () => {
    const newState = !isWhiteboardActive;
    setIsWhiteboardActive(newState);
    supabase.channel(`ders_odasi_${channelName}`).send({ type: 'broadcast', event: 'room_action', payload: { type: 'whiteboard_toggle', active: newState } });
  };

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, clientX: 0, clientY: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
      clientX: clientX - rect.left,
      clientY: clientY - rect.top
    };
  };

  const emitObjects = () => {
    // Görsellerin HTML elementlerini (imgElement) temizleyip gönderiyoruz ki Supabase hata vermesin
    supabase.channel(`ders_odasi_${channelName}`).send({ 
      type: 'broadcast', event: 'room_action', payload: { type: 'sync_objects', objects: objectsRef.current.map(o => ({...o, imgElement: undefined})) } 
    });
  };

  // 🚀 TÜM TAHTAYI YENİDEN ÇİZEN ANA MOTOR
  const redrawAll = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Zemin
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Kalem Çizgileri Katmanı
    linesRef.current.forEach(line => {
      ctx.beginPath();
      ctx.moveTo(line.x0 * canvas.width, line.y0 * canvas.height);
      ctx.lineTo(line.x1 * canvas.width, line.y1 * canvas.height);
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.closePath();
    });

    // 2. Nesneler (Yazı ve Resim) Katmanı
    objectsRef.current.forEach(obj => {
      if (obj.type === 'text') {
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillStyle = obj.color || '#000';
        ctx.textBaseline = "top";
        ctx.fillText(obj.text || '', obj.x * canvas.width, obj.y * canvas.height);
        
        const metrics = ctx.measureText(obj.text || '');
        obj.w = metrics.width / canvas.width;
        obj.h = 30 / canvas.height;
      } 
      else if (obj.type === 'image' && obj.imgElement) {
        ctx.drawImage(obj.imgElement, obj.x * canvas.width, obj.y * canvas.height, obj.w * canvas.width, obj.h * canvas.height);
      }

      // Seçim ve Boyutlandırma Çerçevesi
      if (activeTool === 'move' && selectedObjIdRef.current === obj.id) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(obj.x * canvas.width - 4, obj.y * canvas.height - 4, obj.w * canvas.width + 8, obj.h * canvas.height + 8);
        ctx.setLineDash([]);
        
        if (obj.type === 'image') {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect((obj.x + obj.w) * canvas.width - 6, (obj.y + obj.h) * canvas.height - 6, 12, 12);
        }
      }
    });
  };

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        redrawAll();
      }
    };
    if (isWhiteboardActive) {
      setTimeout(resizeCanvas, 100);
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [isWhiteboardActive]);

  const getHitResult = (nx: number, ny: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    for (let i = objectsRef.current.length - 1; i >= 0; i--) {
      const obj = objectsRef.current[i];
      
      if (obj.type === 'image' && selectedObjIdRef.current === obj.id) {
        const handleR = 15 / canvas.width;
        const hx = obj.x + obj.w;
        const hy = obj.y + obj.h;
        if (Math.abs(nx - hx) < handleR && Math.abs(ny - hy) < handleR) {
          return { action: 'resize', id: obj.id };
        }
      }

      if (nx >= obj.x && nx <= obj.x + obj.w && ny >= obj.y && ny <= obj.y + obj.h) {
        return { action: 'drag', id: obj.id };
      }
    }
    return null;
  };

  // 🚀 TAHTAYA TIKLANDIĞINDA
  const startDraw = (e: any) => {
    const pos = getPos(e);

    // Eğer ekranda önceden açık bir yazı kutusu varsa mühürle
    if (textInput.visible) {
      if (textInput.text.trim()) {
        const newObj: CanvasObject = { id: textInput.id, type: 'text', x: textInput.realX, y: textInput.realY, w: 0.1, h: 0.05, text: textInput.text, color: drawColor };
        objectsRef.current.push(newObj);
        emitObjects();
        redrawAll();
      }
      setTextInput({ ...textInput, visible: false, text: '' });
    }

    // Yazı aracındaysak yeni kutu aç
    if (activeTool === 'text') {
      const id = Date.now().toString();
      setTextInput({ visible: true, id, x: pos.clientX, y: pos.clientY, realX: pos.x, realY: pos.y, text: '' });
      return;
    }

    // Seç ve Taşı aracındaysak nesneyi yakala
    if (activeTool === 'move') {
      const hit = getHitResult(pos.x, pos.y);
      if (hit) {
        selectedObjIdRef.current = hit.id;
        const obj = objectsRef.current.find(o => o.id === hit.id);
        interactRef.current = { action: hit.action, id: hit.id, offsetX: pos.x - (obj?.x || 0), offsetY: pos.y - (obj?.y || 0) };
      } else {
        selectedObjIdRef.current = null;
      }
      redrawAll();
      return;
    }
    
    // Kalem veya Silgi
    isDrawingRef.current = true;
    posRef.current = pos;
  };

  // 🚀 TAHTA ÜZERİNDE FARE HAREKET ETTİĞİNDE
  const moveDraw = (e: any) => {
    const pos = getPos(e);

    // Taşıma veya Ölçekleme
    if (activeTool === 'move' && interactRef.current.action !== 'none') {
      const obj = objectsRef.current.find(o => o.id === interactRef.current.id);
      if (obj) {
        if (interactRef.current.action === 'drag') {
          obj.x = pos.x - interactRef.current.offsetX;
          obj.y = pos.y - interactRef.current.offsetY;
        } else if (interactRef.current.action === 'resize') {
          obj.w = Math.max(0.05, pos.x - obj.x);
          obj.h = Math.max(0.05, pos.y - obj.y);
        }
        redrawAll();
        
        const now = Date.now();
        if (now - lastEmitTime.current > 40) {
          emitObjects();
          lastEmitTime.current = now;
        }
      }
      return;
    }

    if (!isDrawingRef.current || activeTool === 'text') return;
    
    // Silgi
    const color = activeTool === 'eraser' ? '#ffffff' : drawColor;
    const width = activeTool === 'eraser' ? 30 : 3;

    linesRef.current.push({ x0: posRef.current.x, y0: posRef.current.y, x1: pos.x, y1: pos.y, color, width });
    
    pendingDraws.current.push({ x0: posRef.current.x, y0: posRef.current.y, x1: pos.x, y1: pos.y, color, width });
    const now = Date.now();
    if (now - lastEmitTime.current > 40) { 
      supabase.channel(`ders_odasi_${channelName}`).send({ type: 'broadcast', event: 'room_action', payload: { type: 'draw_batch', lines: pendingDraws.current } });
      pendingDraws.current = [];
      lastEmitTime.current = now;
    }

    posRef.current = pos;
    redrawAll();
  };

  const stopDraw = () => {
    if (activeTool === 'move') {
      interactRef.current = { action: 'none', id: '', offsetX: 0, offsetY: 0 };
      emitObjects(); 
    }

    if (isDrawingRef.current && pendingDraws.current.length > 0) {
      supabase.channel(`ders_odasi_${channelName}`).send({ type: 'broadcast', event: 'room_action', payload: { type: 'draw_batch', lines: pendingDraws.current } });
      pendingDraws.current = [];
    }
    isDrawingRef.current = false;
  };

  const clearCanvas = (emit: boolean) => {
    linesRef.current = [];
    objectsRef.current = [];
    selectedObjIdRef.current = null;
    redrawAll();
    if (emit) {
      supabase.channel(`ders_odasi_${channelName}`).send({ type: 'broadcast', event: 'room_action', payload: { type: 'clear_board' } });
    }
  };

  // 🚀 YENİ NESİL OTOMATİK ÇEVİRİLİ GÖRSEL ARAMA
  const searchImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageSearchQuery.trim()) return;
    setIsSearchingImage(true);
    setImageSearchResults([]);

    try {
      // 1. Adım: Türkçe arama kelimesini ücretsiz olarak İngilizce'ye çevir. (MyMemory API)
      const trText = encodeURIComponent(imageSearchQuery.trim());
      const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${trText}&langpair=tr|en`);
      const transData = await transRes.json();
      
      let englishQuery = imageSearchQuery; 
      if (transData?.responseData?.translatedText) {
        englishQuery = transData.responseData.translatedText;
      }

      // 2. Adım: Çevrilen kelime ile Wikimedia'da Thumbnail (Küçük hızlı resim) ara.
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(englishQuery)}&gsrlimit=20&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*`);
      const data = await res.json();
      
      if (data?.query?.pages) {
        const pages = data.query.pages;
        const urls = Object.values(pages)
          .map((p: any) => p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url)
          .filter((url: any) => url); 
        setImageSearchResults(urls as string[]);
      } else {
        setImageSearchResults([]);
      }
    } catch (err) {
      alert("Görseller aranırken bir hata oluştu.");
    } finally {
      setIsSearchingImage(false);
    }
  };

  const addImageToCanvas = (url: string) => {
    const id = Date.now().toString();
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ratio = img.width / img.height;
      const w = 0.3; // Ekranda %30'luk bir yer kaplasın
      const h = w * (canvas.width / canvas.height) / ratio;
      
      const newObj: CanvasObject = { id, type: 'image', url, x: 0.35, y: 0.35, w, h, imgElement: img };
      objectsRef.current.push(newObj);
      selectedObjIdRef.current = id;
      setActiveTool('move');
      redrawAll();
      emitObjects();
    };
    img.src = url;
    setIsImageModalOpen(false);
    setImageSearchQuery("");
    setImageSearchResults([]);
  };

  // ================= VİDEO VE SİSTEM FONKSİYONLARI =================
  useEffect(() => {
    let isMounted = true;
    async function getToken() {
      try {
        setTokenLoading(true);
        const response = await fetch('/api/agora', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channelName }) });
        const data = await response.json();
        if (!isMounted) return;
        if (data.token) { setToken(data.token); } 
      } catch (error: any) { } 
      finally { if (isMounted) setTokenLoading(false); }
    }
    if (channelName) getToken();
    return () => { isMounted = false; };
  }, [channelName]);

  useJoin({ appid: appId, channel: channelName, token: token }, !!appId && !!channelName && !!token);
  
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { localCameraTrack } = useLocalCameraTrack();
  
  useEffect(() => {
    if (localCameraTrack) localCameraTrack.setEncoderConfiguration("480p_1").catch(() => {});
  }, [localCameraTrack]);

  usePublish([localMicrophoneTrack, localCameraTrack].filter(Boolean));
  
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  useEffect(() => { 
    audioTracks.forEach(track => { try { track.play(); } catch(e) { } }); 
  }, [audioTracks]);

  const toggleMic = () => { if (localMicrophoneTrack) { localMicrophoneTrack.setMuted(!isMuted); setIsMuted(!isMuted); } };
  const toggleCamera = () => { if (localCameraTrack) { localCameraTrack.setMuted(!isVideoOff); setIsVideoOff(!isVideoOff); } };

  const toggleScreenShare = async () => {
    if (gercekRol === "ogrenci" && !studentScreenAllowed && !screenTrack) {
      alert("Ekran paylaşabilmek için lütfen öğretmeninizden izin isteyin."); return;
    }

    if (!screenTrack) {
      try {
        setIsScreenStarting(true);
        const track = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_1", optimizationMode: "detail" }, "disable");
        
        if (localCameraTrack) await client.unpublish(localCameraTrack);
        setScreenTrack(track);

        const sClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        await sClient.join(appId, channelName, token, SCREEN_SHARE_UID);
        await sClient.enableDualStream().catch(() => {}); 
        await sClient.publish(track);
        setScreenClient(sClient);

        track.on('track-ended', async () => {
          track.close(); setScreenTrack(null);
          await sClient.leave(); setScreenClient(null);
          if (localCameraTrack) await client.publish(localCameraTrack);
        });
      } catch (error: any) { 
        if (error?.message?.includes('Permission denied') || error?.name === 'NotAllowedError') {
          // İptal edildi
        }
      } finally { setIsScreenStarting(false); }
    } else {
      screenTrack.close(); setScreenTrack(null);
      if (screenClient) { await screenClient.leave(); setScreenClient(null); }
      if (localCameraTrack) await client.publish(localCameraTrack);
    }
  };

  const leaveRoom = async () => {
    const mesaj = gercekRol === "ogretmen" ? "Dersi tamamen sonlandırmak istediğinize emin misiniz?" : "Dersten çıkmak istediğinize emin misiniz?";
    if (confirm(mesaj)) {
      try {
        if (screenTrack) { screenTrack.close(); if (screenClient) await screenClient.leave(); }
        localMicrophoneTrack?.close(); localCameraTrack?.close();
        await client.leave();
      } catch(e) { }
      router.back();
    }
  };

  const isLocalSharing = screenTrack !== null;
  const remoteScreenUser = remoteUsers.find(u => Number(u.uid) === SCREEN_SHARE_UID);
  const remoteCameraUsers = remoteUsers.filter(u => Number(u.uid) !== SCREEN_SHARE_UID);
  const firstRemoteCamera = remoteCameraUsers.length > 0 ? remoteCameraUsers[0] : null;

  const toolBtnStyle = (isActive: boolean) => ({
    background: isActive ? '#eef2ff' : 'transparent',
    color: isActive ? '#4f46e5' : '#64748b',
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', color: '#0f172a', fontFamily: '"Inter", system-ui, sans-serif', overflow: 'hidden' }}>
      
      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>

      <header style={{ height: '72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 28px', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' }}>T</div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', display: 'block', lineHeight: 1.2 }}>Turkish Learning Academy</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Birebir Canlı Eğitim Odası</span>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1', margin: '0 8px' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 700 }}>Oda: {channelName.slice(0, 15)}</span>
          </div>
          
          {!tokenLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fef2f2', padding: '6px 12px', borderRadius: '20px', border: '1px solid #fecaca', marginLeft: '8px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'pulseDot 2s infinite' }}></span>
              <span style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 800, letterSpacing: '0.5px' }}>CANLI</span>
            </div>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: '20px 28px', display: 'flex', gap: '20px', overflow: 'hidden', height: 'calc(100vh - 170px)' }}>
        
        <div style={{ flex: (isChatOpen || isWhiteboardActive) ? 2.5 : 3, backgroundColor: '#000000', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '2px solid #ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', transition: 'all 0.3s' }}>
          {tokenLoading ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '1.1rem', fontWeight: 600, gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #334155', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span>Güvenli ders bağlantısı kuruluyor...</span>
            </div>
          ) : isWhiteboardActive ? (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden' }}>
              
              {/* 🚀 ANINDA YAZI YAZMA KUTUSU */}
              {textInput.visible && (
                <input
                  autoFocus
                  type="text"
                  value={textInput.text}
                  onChange={(e) => {
                    setTextInput(prev => ({...prev, text: e.target.value}));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (textInput.text.trim()) {
                        const action = { type: 'text', text: textInput.text, x: textInput.realX, y: textInput.realY, color: drawColor, font: 'bold 24px Inter, sans-serif' };
                        objectsRef.current.push({ id: textInput.id, type: 'text', x: textInput.realX, y: textInput.realY, w: 0.1, h: 0.05, text: textInput.text, color: drawColor });
                        emitObjects();
                        redrawAll();
                      }
                      setTextInput(prev => ({...prev, visible: false}));
                      setActiveTool('move'); 
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${textInput.x}px`,
                    top: `${textInput.y - 12}px`,
                    color: drawColor,
                    font: 'bold 24px Inter, sans-serif',
                    background: 'transparent',
                    border: '2px dashed #4f46e5',
                    outline: 'none',
                    padding: '4px 8px',
                    minWidth: '200px',
                    zIndex: 9999
                  }}
                />
              )}

              <canvas
                ref={canvasRef}
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={stopDraw}
                onMouseOut={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={moveDraw}
                onTouchEnd={stopDraw}
                style={{ width: '100%', height: '100%', cursor: activeTool === 'text' ? 'text' : (activeTool === 'move' ? 'move' : 'crosshair'), touchAction: 'none' }}
              />
              
              <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', alignItems: 'center', zIndex: 40 }}>
                 
                 <button onClick={() => setActiveTool('move')} title="Seç & Taşı / Ölçekle" style={toolBtnStyle(activeTool === 'move')}><MousePointer2 size={20} /></button>
                 <button onClick={() => setActiveTool('pen')} title="Kalem" style={toolBtnStyle(activeTool === 'pen')}><PenTool size={20} /></button>
                 <button onClick={() => setActiveTool('eraser')} title="Kısmi Silgi" style={toolBtnStyle(activeTool === 'eraser')}><Eraser size={20} /></button>
                 <button onClick={() => setActiveTool('text')} title="Yazı Yaz (Ekrana Tıkla)" style={toolBtnStyle(activeTool === 'text')}><Type size={20} /></button>
                 <button onClick={() => setIsImageModalOpen(true)} title="Görsel Arama" style={toolBtnStyle(false)}><Search size={20} /></button>

                 <div style={{ width: 1, height: 24, backgroundColor: '#cbd5e1', margin: '0 8px' }} />

                 <div style={{ display: 'flex', gap: 6, opacity: activeTool === 'eraser' ? 0.3 : 1, pointerEvents: activeTool === 'eraser' ? 'none' : 'auto' }}>
                   {['#0f172a', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                      <button 
                        key={c} 
                        onClick={() => setDrawColor(c)} 
                        style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: c, border: drawColor === c ? '3px solid #cbd5e1' : 'none', cursor: 'pointer', transition: 'transform 0.1s' }} 
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'} 
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} 
                      />
                   ))}
                 </div>
                 
                 <div style={{ width: 1, height: 24, backgroundColor: '#cbd5e1', margin: '0 8px' }} />
                 <button onClick={() => clearCanvas(true)} title="Tüm Tahtayı Temizle" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, gap: '6px' }}><Trash2 size={16} /> Temizle</button>
              </div>
              
              <NameBadge name="Ortak Beyaz Tahta" isLocal={false} />
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

        {(isLocalSharing || remoteScreenUser || firstRemoteCamera || isChatOpen || isWhiteboardActive) && (
          <div style={{ flex: 1, maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
            
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
                onClick={toggleWhiteboard} 
                style={{
                  ...controlBtn(isWhiteboardActive),
                  width: 'auto',
                  borderRadius: '24px', 
                  padding: '0 20px', 
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  backgroundColor: isWhiteboardActive ? '#eef2ff' : '#ffffff',
                  color: isWhiteboardActive ? '#4f46e5' : '#0f172a',
                  borderColor: isWhiteboardActive ? '#c7d2fe' : '#e2e8f0'
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}
              >
                <PenTool size={18} />
                <span>{isWhiteboardActive ? 'Tahtayı Kapat' : 'Beyaz Tahta'}</span>
              </button>

              <button 
                onClick={toggleScreenShare} 
                disabled={isScreenStarting}
                style={{
                  ...controlBtn(isLocalSharing),
                  width: 'auto',
                  borderRadius: '24px', 
                  padding: '0 20px', 
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isScreenStarting ? 'wait' : 'pointer',
                  backgroundColor: isScreenStarting ? '#eab308' : (isLocalSharing ? '#fee2e2' : '#ffffff'),
                  color: isScreenStarting ? '#ffffff' : (isLocalSharing ? '#ef4444' : '#0f172a'),
                  borderColor: isScreenStarting ? '#eab308' : (isLocalSharing ? '#fca5a5' : '#e2e8f0')
                }}
                onMouseEnter={e => { if(!isScreenStarting) e.currentTarget.style.filter = 'brightness(0.95)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
              >
                <Share2 size={18} />
                <span>{isScreenStarting ? 'Hazırlanıyor...' : (isLocalSharing ? 'Paylaşımı Durdur' : 'Ekran Paylaş')}</span>
              </button>
            
              <button 
                onClick={toggleStudentPermission} 
                title="Öğrenci Ekran İznini Değiştir" 
                style={{ 
                  backgroundColor: teacherPermissionState ? '#dcfce7' : '#f1f5f9', 
                  color: teacherPermissionState ? '#16a34a' : '#475569', 
                  border: '1px solid', 
                  borderColor: teacherPermissionState ? '#bbf7d0' : '#e2e8f0', 
                  height: '48px', 
                  padding: '0 20px', 
                  borderRadius: '24px', 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}
              >
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
                borderRadius: '24px', 
                padding: '0 20px', 
                gap: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                opacity: (!studentScreenAllowed && !isLocalSharing) ? 0.5 : 1,
                cursor: isScreenStarting ? 'wait' : ((!studentScreenAllowed && !isLocalSharing) ? 'not-allowed' : 'pointer'),
                backgroundColor: isScreenStarting ? '#eab308' : (isLocalSharing ? '#fee2e2' : '#ffffff'),
                color: isScreenStarting ? '#ffffff' : (isLocalSharing ? '#ef4444' : '#0f172a'),
                borderColor: isScreenStarting ? '#eab308' : (isLocalSharing ? '#fca5a5' : '#e2e8f0')
              }}
              title={(!studentScreenAllowed && !isLocalSharing) ? "Öğretmeninizden izin istemelisiniz" : ""}
              onMouseEnter={e => { if(studentScreenAllowed || isLocalSharing) e.currentTarget.style.filter = 'brightness(0.95)' }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
            >
              <Share2 size={18} />
              <span>{isScreenStarting ? 'Hazırlanıyor...' : (isLocalSharing ? 'Paylaşımı Durdur' : 'Ekran Paylaş')}</span>
              {(!studentScreenAllowed && !isLocalSharing) && <Lock size={16} />}
            </button>
          )}

          <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>

          <button 
            onClick={leaveRoom} 
            style={{ 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              height: '48px', 
              padding: '0 24px', 
              borderRadius: '24px', 
              fontWeight: 700, 
              fontSize: '0.95rem', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' 
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            <PhoneOff size={18} />
            <span>{gercekRol === "ogretmen" ? "Dersi Bitir" : "Dersten Çık"}</span>
          </button>
        </div>
      </footer>

      {/* 🚀 ÜCRETSİZ GÖRSEL ARAMA MODALI */}
      {isImageModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '700px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Sınıfa Görsel Ekle</h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>İngilizce veya Türkçe kelimelerle arama yaparak görselleri derse dahil edin.</p>
              </div>
              <button onClick={() => {setIsImageModalOpen(false); setImageSearchQuery(""); setImageSearchResults([]);}} style={{ border: 'none', background: '#f1f5f9', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
              <form onSubmit={searchImages} style={{ display: 'flex', gap: 12 }}>
                <input 
                  autoFocus
                  value={imageSearchQuery} 
                  onChange={(e) => setImageSearchQuery(e.target.value)} 
                  placeholder="Örn: Araba, Kedi, İstanbul..." 
                  style={{ flex: 1, padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', backgroundColor: '#f8fafc' }} 
                />
                <button type="submit" disabled={!imageSearchQuery.trim() || isSearchingImage} style={{ padding: '0 24px', background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: (!imageSearchQuery.trim() || isSearchingImage) ? 'not-allowed' : 'pointer' }}>
                  {isSearchingImage ? 'Aranıyor...' : 'Görsel Ara'}
                </button>
              </form>

              {imageSearchResults.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {imageSearchResults.map((url, i) => (
                    <div 
                      key={i} 
                      onClick={() => addImageToCanvas(url)}
                      style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.2s', backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                    />
                  ))}
                </div>
              ) : (
                !isSearchingImage && imageSearchQuery && <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Görsel bulunamadı. Lütfen başka bir kelime deneyin.</div>
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}

function controlBtn(isActive: boolean): React.CSSProperties {
  return {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '1px solid',
    borderColor: isActive ? '#fca5a5' : '#e2e8f0',
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