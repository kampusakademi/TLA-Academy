'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function TeacherProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [teacher, setTeacher] = useState<any>(null);
  const [bookedLessons, setBookedLessons] = useState<any[]>([]);
  const [yorumlar, setYorumlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [tamamlananDersSayisi, setTamamlananDersSayisi] = useState(0);
  const [hasPreviousLesson, setHasPreviousLesson] = useState(false);
  
  const [bookingStatsText, setBookingStatsText] = useState<string | null>(null);

  // FAVORİ STATE'LERİ
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // HAFTALIK TAKVİM İÇİN STATELER
  const [weekOffset, setWeekOffset] = useState(0); 
  const [availableDates, setAvailableDates] = useState<{date: Date, dayName: string, label: string}[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  const [userTimeZone, setUserTimeZone] = useState('Europe/Istanbul');

  useEffect(() => {
    try {
      setUserTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (e) {
      // Hata durumunda varsayılan İstanbul kalır
    }
  }, []);

  useEffect(() => {
    const dates = [];
    const dayMap = { 0: 'Paz', 1: 'Pzt', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cmt' };
    
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + (weekOffset * 7)); 

    for(let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i); 
        dates.push({
            date: d,
            dayName: dayMap[d.getDay() as keyof typeof dayMap],
            label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
        });
    }
    setAvailableDates(dates);
    setSelectedDate(dates[0].date); 
    setSelectedHour(null);
  }, [weekOffset]);

  useEffect(() => {
    if (id) {
      const rawId = Array.isArray(id) ? id[0] : id;
      loadData(rawId.trim());
    } else {
      setLoading(false);
    }
  }, [id]);

  async function loadData(teacherId: string) {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const { data: teacherData, error: teacherError } = await supabase
        .from('egitmenler')
        .select('*')
        .or(`user_id.eq.${teacherId},id.eq.${teacherId}`)
        .maybeSingle();

      if (teacherError) console.error("Eğitmen hatası:", teacherError);
      
      if (teacherData) {
        setTeacher(teacherData);
        const targetUserId = teacherData.user_id || teacherData.id;

        if (user) {
          const { data: favData } = await supabase
            .from('favoriler')
            .select('id')
            .eq('ogrenci_id', user.id)
            .eq('egitmen_id', targetUserId)
            .maybeSingle();
          
          if (favData) setIsFavorited(true);
        }

        const { data: tumDerslerData } = await supabase
          .from('dersler')
          .select('durum, ogrenci_id, created_at')
          .eq('user_id', targetUserId);
        
        if (tumDerslerData) {
          const bitenSayisi = tumDerslerData.filter(l => l.durum === 'Tamamlanan').length;
          setTamamlananDersSayisi(bitenSayisi);

          if (user) {
            const aldimi = tumDerslerData.some(l => l.ogrenci_id === user.id);
            setHasPreviousLesson(aldimi);
          }
        }

        const { data: lessonData } = await supabase
          .from('dersler')
          .select('*')
          .eq('user_id', targetUserId)
          .neq('durum', 'İptal Edilen');
        
        setBookedLessons(lessonData || []);

        if (lessonData && lessonData.length > 0) {
          const now = new Date();
          const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

          let bugunAyirtilan = 0;
          let sonIkiGunAyirtilan = 0;

          lessonData.forEach((lesson: any) => {
            if (lesson.created_at) {
              const createdTime = new Date(lesson.created_at);
              if (createdTime >= last24h) {
                bugunAyirtilan++;
                sonIkiGunAyirtilan++;
              } else if (createdTime >= last48h) {
                sonIkiGunAyirtilan++;
              }
            }
          });

          if (bugunAyirtilan > 0) {
            setBookingStatsText(`🔥 Bugün ${bugunAyirtilan} ders ayırtıldı`);
          } else if (sonIkiGunAyirtilan > 0) {
            setBookingStatsText(`📈 Son 2 günde ${sonIkiGunAyirtilan} ders ayırtıldı`);
          } else {
            setBookingStatsText(null);
          }
        }

        const { data: dersYorumlari } = await supabase
          .from('dersler')
          .select('id, ogrenci_adi, puan, yorum, tarih_saat')
          .eq('user_id', targetUserId)
          .not('puan', 'is', null)
          .order('tarih_saat', { ascending: false });

        const { data: yorumData } = await supabase
          .from('yorumlar')
          .select('*')
          .eq('egitmen_id', targetUserId);

        const eskiYorumlar = (yorumData || []).map(y => ({
          ogrenci_adi: y.ogrenci_adi || 'Öğrenci',
          puan: y.puan || 5,
          yorum_metni: y.yorum_metni || y.yorum || ''
        }));

        const yeniDersYorumlari = (dersYorumlari || []).map(dy => ({
          ogrenci_adi: dy.ogrenci_adi || 'Öğrenci',
          puan: dy.puan || 5,
          yorum_metni: dy.yorum || 'Değerlendirme yapıldı.'
        }));

        setYorumlar([...yeniDersYorumlari, ...eskiYorumlar]);
      }
    } catch (err) {
      console.error("Veri yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFavoriteToggle() {
    if (!currentUserId) {
      toast.error("⚠️ Eğitmenleri favorilerinize eklemek için giriş yapmalısınız.");
      return;
    }

    setFavLoading(true);
    const targetUserId = teacher.user_id || teacher.id;

    try {
      if (isFavorited) {
        await supabase
          .from('favoriler')
          .delete()
          .eq('ogrenci_id', currentUserId)
          .eq('egitmen_id', targetUserId);
        
        setIsFavorited(false);
      } else {
        await supabase
          .from('favoriler')
          .insert([{ ogrenci_id: currentUserId, egitmen_id: targetUserId }]);
        
        setIsFavorited(true);

        const { data: ogrenciData } = await supabase
          .from('ogrenciler')
          .select('tam_ad')
          .eq('user_id', currentUserId)
          .maybeSingle();

        const ogrenciAdi = ogrenciData?.tam_ad || "Bir öğrenci";

        const otomatikMesaj = `🏢 TLA Destek Ekibi:\n\nHarika bir haberimiz var! 🎉\n"${ogrenciAdi}" adlı öğrenci profilinizi inceledi ve sizi Favorilerine ekledi.\n\nBu sohbete yanıt yazarak doğrudan öğrenciyle iletişime geçebilir ve ilk adımı siz atabilirsiniz.`;

        await supabase
          .from('mesajlar')
          .insert([{
            gonderen_id: currentUserId,
            alici_id: targetUserId,
            icerik: otomatikMesaj,
            okundu: false
          }]);
      }
    } catch (error: any) {
      toast.error("Bir hata oluştu: " + error.message);
    } finally {
      setFavLoading(false);
    }
  }

  useEffect(() => {
    if (showMsgModal && teacher) {
      checkAndLoadChat();
    }
  }, [showMsgModal, teacher]);

  async function checkAndLoadChat() {
    setLoadingChat(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const targetId = teacher.user_id || teacher.id;
      const { data } = await supabase
        .from('mesajlar')
        .select('*')
        .or(`and(gonderen_id.eq.${user.id},alici_id.eq.${targetId}),and(gonderen_id.eq.${targetId},alici_id.eq.${user.id})`)
        .order('olusturulma_tarihi', { ascending: true });
      
      if (data) setChatMessages(data);
    }
    setLoadingChat(false);
  }

  useEffect(() => {
    if (!showMsgModal || !currentUserId || !teacher) return;
    const targetId = teacher.user_id || teacher.id;
    
    const channel = supabase
      .channel('profil-mini-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mesajlar' }, (payload: any) => {
        const newMsg = payload.new;
        if (
          (newMsg.gonderen_id === currentUserId && newMsg.alici_id === targetId) ||
          (newMsg.gonderen_id === targetId && newMsg.alici_id === currentUserId)
        ) {
          setChatMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id || (m.icerik === newMsg.icerik && m.gonderen_id === newMsg.gonderen_id));
            return exists ? prev : [...prev, newMsg];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showMsgModal, currentUserId, teacher]);

  function checkSlotStatus(slotDate: Date) {
    if (!teacher) return { disabled: true, reason: '' };

    const now = new Date();

    if (slotDate < now) {
        return { disabled: true, reason: 'Geçti' };
    }

    const minimumIzinVerilenZaman = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    if (slotDate < minimumIzinVerilenZaman) {
        return { disabled: true, reason: 'Çok Yakın' }; 
    }

    const trtDateStr = slotDate.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' });
    const trtDate = new Date(trtDateStr);
    
    const dayMap = { 0: 'Pazar', 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi' };
    const trtDayName = dayMap[trtDate.getDay() as keyof typeof dayMap];
    const trtHour = trtDate.getHours().toString().padStart(2, '0') + ':00';
    const slotKey = `${trtDayName}-${trtHour}`;

    if (teacher.musait_olmayan_saatler && teacher.musait_olmayan_saatler.includes(slotKey)) {
        return { disabled: true, reason: 'Kapalı' };
    }

    const isBooked = bookedLessons.some(lesson => {
        try {
            const lDate = new Date(lesson.tarih_saat);
            return lDate.getTime() === slotDate.getTime();
        } catch { return false; }
    });

    if (isBooked) return { disabled: true, reason: 'Dolu' };

    return { disabled: false, reason: '' };
  }

  function getYouTubeEmbedUrl(url: string) {
    if (!url) return null;
    try {
      let videoId = '';
      if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
      else if (url.includes('youtube.com/watch')) videoId = new URLSearchParams(new URL(url).search).get('v') || '';
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch { return null; }
  }

  async function handleBooking() {
    if (!selectedDate || !selectedHour || !teacher) return;
    try {
      setBookingLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error("Lütfen ders ayırtmak için hesabınıza giriş yapın.");
        return;
      }

      const { data: ogrenciData } = await supabase
        .from('ogrenciler')
        .select('tam_ad')
        .eq('user_id', user.id)
        .maybeSingle();

      const finalOgrenciAdi = ogrenciData?.tam_ad || user?.user_metadata?.full_name || "Öğrenci";

      const targetTimestamp = new Date(Number(selectedHour)).toISOString(); 

      const { error: insertError } = await supabase
        .from('dersler')
        .insert([{
          user_id: teacher.user_id || teacher.id,
          egitmen_adi: teacher.tam_ad || "Eğitmen",
          ogrenci_id: user.id, 
          ogrenci_adi: finalOgrenciAdi, 
          tarih_saat: targetTimestamp,   
          ders_turu: teacher.ders_turu || "Birebir Eğitim",
          ucret: Number(teacher.saatlik_ucret || 0),
          durum: 'Yaklaşan'
        }]);

      if (insertError) throw insertError;
      
      toast.success("Rezervasyon başarıyla oluşturuldu! 🎉 Eğitmeniniz sizi bekliyor.");
      setSelectedHour(null);
      loadData(teacher.id); 
      
    } catch (err: any) { 
      toast.error("Hata: " + err.message); 
    } finally { 
      setBookingLoading(false); 
    }
  }

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!msgText.trim()) return;
    setSendingMsg(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error("Lütfen mesaj göndermek için hesabınıza giriş yapın.");
        setShowMsgModal(false);
        return;
      }

      const targetId = teacher.user_id || teacher.id;
      const mesajIcerigi = msgText;

      const anlikMesaj = {
        gonderen_id: user.id,
        alici_id: targetId,
        icerik: mesajIcerigi,
        olusturulma_tarihi: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, anlikMesaj]);
      setMsgText(''); 

      const { error: insertError } = await supabase
        .from('mesajlar')
        .insert([{
          gonderen_id: user.id,
          alici_id: targetId,
          icerik: mesajIcerigi,
          okundu: false
        }]);

      if (insertError) throw insertError;

    } catch (error: any) {
      console.error(error);
      toast.error("Mesaj gönderilirken bir hata oluştu: " + error.message);
    } finally {
      setSendingMsg(false);
    }
  }

  const isOnline = (dateStr: string) => {
    if (!dateStr) return false;
    const lastSeen = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return (now - lastSeen) < 15 * 60 * 1000;
  };

  const getDynamicResponseTime = (sonGorulmeTarihi: string | null) => {
    if (!sonGorulmeTarihi) return "⏱️ Genellikle birkaç saat içinde yanıt verir";
    const lastSeen = new Date(sonGorulmeTarihi).getTime();
    const now = new Date().getTime();
    const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));

    if (diffInMinutes < 30) return "🟢 Şu an aktif - Hemen yanıt verebilir";
    if (diffInMinutes < 120) return "⚡ Genellikle 1 saat içinde yanıt verir";
    if (diffInMinutes < 1440) return "⏱️ Genellikle birkaç saat içinde yanıt verir";
    return "📅 Genellikle 1 gün içinde yanıt verir";
  };

  const getWeekRangeText = () => {
    if (availableDates.length === 0) return "";
    const first = availableDates[0].date;
    const last = availableDates[6].date;
    const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    
    const fDay = first.getDate();
    const lDay = last.getDate();
    const fMonth = monthNames[first.getMonth()];
    const lMonth = monthNames[last.getMonth()];
    const year = last.getFullYear();
    
    if (fMonth === lMonth) {
      return `${fDay} - ${lDay} ${lMonth} ${year}`;
    } else {
      return `${fDay} ${fMonth} - ${lDay} ${lMonth} ${year}`;
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }}>Bilgiler yükleniyor...</div>;
  if (!teacher) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 600, color: '#ef4444', backgroundColor: '#f8fafc' }}>Eğitmen profili bulunamadı.</div>;

  const embedVideoUrl = getYouTubeEmbedUrl(teacher?.video_url);
  const isTeacherOnline = isOnline(teacher?.son_gorulme);
  const yanitSuresiMetni = getDynamicResponseTime(teacher?.son_gorulme);
  const isCevrimici = yanitSuresiMetni.includes("Şu an aktif");

  let dillerArray: string[] = [];
  if (teacher?.diller) {
    try {
      let parsedDiller = teacher.diller;
      if (typeof parsedDiller === 'string') {
        if (parsedDiller.startsWith('[') || parsedDiller.startsWith('{')) {
          parsedDiller = JSON.parse(parsedDiller);
        } else {
          parsedDiller = parsedDiller.split(',').map((s:string)=>s.trim());
        }
      }
      if (Array.isArray(parsedDiller)) {
        dillerArray = parsedDiller.map((d:any) => typeof d === 'string' ? d.trim() : String(d)).filter(Boolean);
      }
    } catch(e) {
      const rawData = String(teacher.diller);
      const cleanedData = rawData.replace(/[\[\]"']/g, ''); 
      dillerArray = cleanedData.split(',').map((d: string) => d.trim()).filter(Boolean);
    }
  }

  const getSafeKonum = (konum: any) => {
    if (!konum) return null;
    if (typeof konum === 'object') {
      const ulke = konum.ulke || '';
      const sehir = konum.sehir || '';
      if (ulke && sehir) return `${ulke} - ${sehir}`;
      return ulke || sehir || null;
    }
    if (typeof konum === 'string') return konum.replace(/\s*-\s*/, ' - ');
    return String(konum);
  };

  const getSafeEgitim = (egitim: any) => {
    if (!egitim) return null;
    if (typeof egitim === 'object') {
      const seviye = egitim.seviye || egitim.egitim_seviyesi || '';
      const okul = egitim.okul || egitim.universite || egitim.okul_adi || '';
      if (seviye && okul) return `${seviye} - ${okul}`;
      return seviye || okul || null;
    }
    if (typeof egitim === 'string') return egitim.replace(/\s*-\s*/, ' - ');
    return String(egitim);
  };

  const safeKonum = getSafeKonum(teacher?.konum);
  const safeEgitim = getSafeEgitim(teacher?.egitim);

  const gecerliPuanlar = yorumlar.filter(y => Number(y.puan) > 0 && Number(y.puan) <= 5);
  const dinamikOrtalama = gecerliPuanlar.length > 0
    ? (gecerliPuanlar.reduce((acc, curr) => acc + Number(curr.puan), 0) / gecerliPuanlar.length).toFixed(1)
    : (teacher?.ortalama_puan ? Number(teacher.ortalama_puan).toFixed(1) : null);

  const avatarGradients = [
    'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    'linear-gradient(135deg, #dcfce3 0%, #bbf7d0 100%)',
    'linear-gradient(135deg, #ffedd5 0%, #fde047 100%)',
    'linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%)'
  ];
  const avatarTextColors = ['#3730a3', '#831843', '#14532d', '#713f12', '#1e3a8a'];

  const tumUzmanlikEtiketleri = [
    ...(teacher?.amac ? teacher.amac.split(',') : []),
    ...(teacher?.odak ? teacher.odak.split(',') : []),
    ...(teacher?.seviye ? teacher.seviye.split(',') : []),
    ...(teacher?.sure ? teacher.sure.split(',') : [])
  ].map(item => item.trim()).filter(Boolean);

  const benzersizEtiketler = Array.from(new Set(tumUzmanlikEtiketleri));

  const renderBadge = (etiket: string) => {
    if(!etiket) return null;
    const lower = etiket.toLowerCase();
    
    let bg = "#f8fafc";
    let color = "#475569";
    let border = "#e2e8f0";
    let icon = null;

    if (lower.includes('süper') || lower.includes('super')) {
      bg = "#fffbeb"; color = "#d97706"; border = "#fde68a";
      icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>; 
    } else if (lower.includes('uzman')) {
      bg = "#eff6ff"; color = "#2563eb"; border = "#bfdbfe";
      icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>; 
    } else if (lower.includes('profesyonel')) {
      bg = "#f5f3ff"; color = "#6d28d9"; border = "#ddd6fe";
      icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>; 
    }

    return (
        <span style={{ 
          padding: '8px 16px', backgroundColor: bg, color: color, borderRadius: '16px', 
          fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.5px', 
          display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${border}`,
          whiteSpace: 'nowrap', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          {icon}
          {etiket.toUpperCase()}
        </span>
    );
  };

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a', backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '100px' }}>
      
      <nav style={{ padding: '16px 8%', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
          <span style={{ fontSize: '1.2rem' }}>←</span> Geri dön
        </button>
      </nav>

      <div style={{ maxWidth: '1140px', margin: '40px auto 0', padding: '0 24px', display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* SOL TARAF */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.06)', position: 'relative' }}>
            
            <div style={{ height: '140px', background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 50%, #f3e8ff 100%)' }}></div>
            
            <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
              {teacher?.one_cikan_etiket && renderBadge(teacher.one_cikan_etiket)}
              
              {dinamikOrtalama ? (
                <div style={{ background: '#ffffff', padding: '8px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>{dinamikOrtalama}</div>
                  <span style={{ color: '#fbbf24', fontSize: '1.2rem', marginTop: '-2px' }}>★</span>
                  <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{gecerliPuanlar.length} Yorum</div>
                </div>
              ) : (
                <div style={{ background: '#f0fdf4', padding: '8px 16px', borderRadius: '16px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 800 }}>Yeni Eğitmen</span>
                </div>
              )}
            </div>

            <div style={{ padding: '0 32px 32px 32px', marginTop: '-54px', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              
              <div style={{ display: 'flex', flexDirection: 'row', gap: '28px', alignItems: 'flex-start', width: '100%' }}>
                
                <div style={{ position: 'relative', flexShrink: 0, padding: '4px', background: '#ffffff', borderRadius: '50%', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                  <img 
                    src={teacher?.avatar_url || `https://ui-avatars.com/api/?name=${teacher?.tam_ad || 'Eğitmen'}&background=c7d2fe&color=3730a3&size=140&bold=true`} 
                    alt={teacher?.tam_ad}
                    style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  {isTeacherOnline && (
                    <div style={{ position: 'absolute', bottom: 8, right: 8, width: '22px', height: '22px', backgroundColor: '#10b981', border: '3px solid #ffffff', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} title="Çevrimiçi"></div>
                  )}
                </div>
                
                <div style={{ flex: 1, paddingTop: '64px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 4px 0', color: '#0f172a', letterSpacing: '-1px', textAlign: 'left' }}>
                    {teacher?.tam_ad}
                  </h1>
                  <p style={{ margin: 0, fontSize: '1.1rem', color: '#4f46e5', fontWeight: 700, textAlign: 'left' }}>
                    {teacher?.ders_turu || 'Türkçe Öğretmeni'}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <div style={{ padding: '6px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    {tamamlananDersSayisi} Ders Tamamlandı
                  </div>

                  {bookingStatsText && (
                    <span style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {bookingStatsText}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-start', width: '100%' }}>
                  {safeKonum && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px 6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '24px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <div style={{ width: '28px', height: '28px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      {safeKonum}
                    </span>
                  )}
                  {safeEgitim && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px 6px 8px', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: '24px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <div style={{ width: '28px', height: '28px', background: '#fef3c7', color: '#d97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                      </div>
                      {safeEgitim}
                    </span>
                  )}
                </div>

                {dillerArray.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#64748b' }}>Konuştuğu Diller:</strong>
                    {dillerArray.map((dil: string, index: number) => {
                      const isAnaDil = dil.includes('(Ana Dil)');
                      return (
                        <span key={index} style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: isAnaDil ? 700 : 600, backgroundColor: isAnaDil ? '#eef2ff' : '#ffffff', color: isAnaDil ? '#4338ca' : '#475569', border: isAnaDil ? '1px solid #c7d2fe' : '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          {dil.replace('(Ana Dil)', '').trim()}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '420px', backgroundColor: '#0f172a', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', position: 'relative' }}>
            {teacher?.video_url ? (
              <iframe src={embedVideoUrl || ''} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                <div style={{ width: '64px', height: '64px', background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#818cf8' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>
                </div>
                <span style={{ fontWeight: 600 }}>Tanıtım videosu bulunmuyor</span>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '40px', marginBottom: '40px' }}>
            
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
                Uzmanlık ve Odak Alanları
              </h2>
              {benzersizEtiketler.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {benzersizEtiketler.map((item: string, idx: number) => (
                    <span key={`tag-${idx}`} style={{ padding: '8px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>{item}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>Eğitmen henüz uzmanlık alanı belirtmemiş.</p>
              )}
            </div>

            <div style={{ height: '1px', background: '#f1f5f9' }}></div>

            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
                Eğitmen Hakkında
              </h2>
              <p style={{ lineHeight: 1.8, color: '#475569', fontSize: '1.05rem', whiteSpace: 'pre-line', margin: 0 }}>
                {teacher?.biyografi || "Eğitmen henüz bir biyografi eklememiş."}
              </p>
            </div>

            <div style={{ height: '1px', background: '#f1f5f9' }}></div>

            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
                Öğretim Yaklaşımı
              </h2>
              <p style={{ lineHeight: 1.8, color: '#475569', fontSize: '1.05rem', whiteSpace: 'pre-line', margin: 0 }}>
                {teacher?.ogretim_yaklasimi || teacher?.metodoloji || "Eğitmen henüz öğretim yaklaşımı bilgisi eklememiş."}
              </p>
            </div>

          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03)', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Öğrenci Değerlendirmeleri</span>
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '12px', fontSize: '1rem' }}>{yorumlar.length} Yorum</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {yorumlar.length > 0 ? (
                yorumlar.map((y, i) => {
                  const gradIdx = i % avatarGradients.length;
                  return (
                    <div key={i} style={{ borderBottom: i !== yorumlar.length -1 ? '1px solid #f1f5f9' : 'none', paddingBottom: i !== yorumlar.length -1 ? '28px' : '0' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ width: '52px', height: '52px', background: avatarGradients[gradIdx], color: avatarTextColors[gradIdx], borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                          {y.ogrenci_adi ? y.ogrenci_adi.charAt(0).toUpperCase() : 'Ö'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>{y.ogrenci_adi || 'Öğrenci'}</div>
                          <div style={{ color: '#fbbf24', fontSize: '1rem', letterSpacing: '2px', marginTop: '2px' }}>
                            {"★".repeat(Number(y.puan) || 5)}{"☆".repeat(5 - (Number(y.puan) || 5))}
                          </div>
                        </div>
                      </div>
                      <p style={{ color: '#475569', margin: 0, lineHeight: 1.7, fontSize: '1rem' }}>{y.yorum_metni}</p>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px' }}>Bu eğitmen için henüz yorum yapılmamış. İlk yorumu sen yap!</div>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ TARAF - YAPIŞKAN (STICKY) SİPARİŞ KARTI */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}>
            
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{teacher?.saatlik_ucret}₺</span>
              <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600, paddingBottom: '4px' }}>/ 50 dk</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setWeekOffset(0)} 
                    disabled={weekOffset === 0}
                    style={{ padding: '8px 12px', background: weekOffset === 0 ? '#f1f5f9' : '#ffffff', border: 'none', borderRight: '1px solid #cbd5e1', cursor: weekOffset === 0 ? 'not-allowed' : 'pointer', color: weekOffset === 0 ? '#94a3b8' : '#0f172a' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button 
                    onClick={() => setWeekOffset(1)} 
                    disabled={weekOffset === 1}
                    style={{ padding: '8px 12px', background: weekOffset === 1 ? '#f1f5f9' : '#ffffff', border: 'none', cursor: weekOffset === 1 ? 'not-allowed' : 'pointer', color: weekOffset === 1 ? '#94a3b8' : '#0f172a' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                  {getWeekRangeText()}
                </span>
              </div>

              <select 
                value={userTimeZone}
                onChange={(e) => setUserTimeZone(e.target.value)}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '12px', 
                  border: '2px solid #3b82f6', 
                  outline: 'none', 
                  fontSize: '0.9rem', 
                  fontWeight: 700, 
                  color: '#0f172a', 
                  backgroundColor: '#ffffff', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
                  maxWidth: '220px',
                  textOverflow: 'ellipsis'
                }}
              >
                <option value="Pacific/Midway">Pacific/Midway (GMT-11)</option>
                <option value="Pacific/Honolulu">Pacific/Honolulu (GMT-10)</option>
                <option value="America/Anchorage">America/Anchorage (GMT-9)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (GMT-8)</option>
                <option value="America/Denver">America/Denver (GMT-7)</option>
                <option value="America/Chicago">America/Chicago (GMT-6)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="America/Caracas">America/Caracas (GMT-4)</option>
                <option value="America/Argentina/Buenos_Aires">America/Buenos_Aires (GMT-3)</option>
                <option value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</option>
                <option value="Atlantic/Azores">Atlantic/Azores (GMT-1)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                <option value="Europe/Berlin">Europe/Berlin (GMT+1)</option>
                <option value="Europe/Rome">Europe/Rome (GMT+1)</option>
                <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                <option value="Europe/Athens">Europe/Athens (GMT+2)</option>
                <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                <option value="Europe/Moscow">Europe/Moscow (GMT+3)</option>
                <option value="Asia/Kuwait">Asia/Kuwait (GMT+3)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                <option value="Asia/Karachi">Asia/Karachi (GMT+5)</option>
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (GMT+8)</option>
                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                <option value="Asia/Seoul">Asia/Seoul (GMT+9)</option>
                <option value="Australia/Sydney">Australia/Sydney (GMT+10)</option>
                <option value="Pacific/Noumea">Pacific/Noumea (GMT+11)</option>
                <option value="Pacific/Auckland">Pacific/Auckland (GMT+12)</option>
              </select>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Gün Seçin</h3>
              
              {/* 🚀 ESKİ GENİŞ VE BÜYÜK KUTU TASARIMINA GERİ DÖNÜLDÜ */}
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                {availableDates.map((item, idx) => {
                  const isSelected = selectedDate?.toDateString() === item.date.toDateString();
                  return (
                    <button 
                      key={idx}
                      onClick={() => { setSelectedDate(item.date); setSelectedHour(null); }}
                      style={{ 
                        flex: '0 0 auto', padding: '12px 16px', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        background: isSelected ? '#0f172a' : '#f8fafc',
                        border: isSelected ? '1px solid #0f172a' : '1px solid #e2e8f0',
                        color: isSelected ? '#ffffff' : '#475569',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isSelected ? '0 8px 16px -4px rgba(15, 23, 42, 0.2)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.7 }}>{item.dayName}</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{item.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', marginTop: '12px' }}>Saat Seçin</h3>
              
              {/* 🚀 ESKİ FERAH 3 SÜTUNLU GENİŞ SAAT KUTULARI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '8px' }}>
                
                {(() => {
                  const validSlots = [];
                  if (selectedDate) {
                    for (let i = 0; i < 24; i++) {
                      const slotDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), i, 0, 0);
                      const status = checkSlotStatus(slotDate);
                      
                      if (status.reason !== 'Geçti' && status.reason !== 'Çok Yakın') {
                        validSlots.push({ slotDate, status });
                      }
                    }
                  }

                  if (validSlots.length === 0) {
                    return (
                      <div style={{ gridColumn: 'span 3', padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                        Bu gün için seçilebilir saat bulunmuyor.
                      </div>
                    );
                  }

                  return validSlots.map(({ slotDate, status }) => {
                    const hourLabel = slotDate.toLocaleTimeString('tr-TR', { 
                      timeZone: userTimeZone, 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                    
                    const timestampStr = slotDate.getTime().toString();
                    const isSelected = selectedHour === timestampStr;

                    return (
                      <button 
                        key={timestampStr} 
                        disabled={status.disabled} 
                        onClick={() => setSelectedHour(timestampStr)}
                        title={status.reason ? `${status.reason}` : ''}
                        style={{
                          padding: '12px 0', borderRadius: '12px', fontSize: '0.95rem',
                          cursor: status.disabled ? 'not-allowed' : 'pointer',
                          background: isSelected ? '#4f46e5' : (status.disabled ? '#f1f5f9' : '#ffffff'),
                          border: isSelected ? '1px solid #4f46e5' : (status.disabled ? '1px dashed #cbd5e1' : '1px solid #cbd5e1'),
                          color: isSelected ? 'white' : (status.disabled ? '#94a3b8' : '#0f172a'),
                          fontWeight: 700,
                          transition: 'all 0.15s',
                          opacity: status.disabled ? 0.6 : 1
                        }}>
                        {hourLabel}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            <button 
              onClick={handleBooking} 
              disabled={bookingLoading || !selectedHour} 
              style={{ 
                width: '100%', 
                padding: '18px', 
                background: !selectedHour ? '#f1f5f9' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                color: !selectedHour ? '#94a3b8' : '#ffffff', 
                borderRadius: '16px', 
                border: 'none', 
                fontWeight: 800, 
                cursor: !selectedHour ? 'not-allowed' : 'pointer', 
                fontSize: '1.1rem', 
                transition: 'all 0.3s', 
                marginBottom: '16px',
                boxShadow: selectedHour ? '0 10px 25px -5px rgba(16, 185, 129, 0.4)' : 'none',
                transform: selectedHour ? 'translateY(-2px)' : 'none'
              }}
            >
              {bookingLoading ? "İşleniyor..." : (
                selectedHour 
                  ? (hasPreviousLesson ? "Saati Rezerve Et" : "Deneme Dersi Ayırt") 
                  : "Önce Saat Seçin"
              )}
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  if (!currentUserId) {
                    toast.error("⚠️ Eğitmene mesaj göndermek için lütfen önce giriş yapın veya kayıt olun.");
                    return;
                  }
                  setShowMsgModal(true);
                }}
                style={{ 
                  flex: 1, padding: '16px', background: '#ffffff', color: '#0f172a', 
                  borderRadius: '16px', border: '1px solid #cbd5e1', fontWeight: 700, cursor: 'pointer', 
                  fontSize: '1rem', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              >
                <span style={{ fontSize: '1.2rem' }}>✉️</span> Eğitmene Mesaj Gönder
              </button>

              <button 
                onClick={handleFavoriteToggle}
                disabled={favLoading}
                style={{ 
                  width: '56px', height: '56px', flexShrink: 0, borderRadius: '16px', 
                  background: isFavorited ? '#fee2e2' : '#ffffff', 
                  color: isFavorited ? '#ef4444' : '#64748b', 
                  border: `1px solid ${isFavorited ? '#fecaca' : '#cbd5e1'}`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: favLoading ? 'wait' : 'pointer', transition: 'all 0.2s' 
                }}
                onMouseEnter={(e) => { if (!isFavorited) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; } }}
                onMouseLeave={(e) => { if (!isFavorited) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>

            <p style={{ textAlign: 'center', color: isCevrimici ? '#10b981' : '#94a3b8', fontSize: '0.85rem', marginTop: '20px', fontWeight: isCevrimici ? 700 : 500 }}>
              {yanitSuresiMetni}
            </p>
          </div>
        </div>
      </div>

      {showMsgModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={teacher?.avatar_url || `https://ui-avatars.com/api/?name=${teacher?.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5`} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  {isTeacherOnline && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '14px', height: '14px', backgroundColor: '#10b981', border: '2px solid #ffffff', borderRadius: '50%' }}></div>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{teacher?.tam_ad}</h3>
                  <span style={{ color: isTeacherOnline ? '#10b981' : '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                    {isTeacherOnline ? 'Çevrimiçi' : 'Son görülme: Yakınlarda'}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowMsgModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b', transition: 'background 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='#e2e8f0'} onMouseLeave={(e)=>e.currentTarget.style.background='#f1f5f9'}>✕</button>
            </div>

            {loadingChat ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>Geçmiş mesajlarınız kontrol ediliyor...</div>
            ) : chatMessages.length > 0 ? (
              <>
                <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#f8fafc', minHeight: '300px' }}>
                  {chatMessages.map((msg, idx) => {
                    const isMe = msg.gonderen_id === currentUserId;
                    return (
                      <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', backgroundColor: isMe ? '#4f46e5' : '#ffffff', color: isMe ? '#ffffff' : '#0f172a', border: isMe ? 'none' : '1px solid #e2e8f0', padding: '14px 18px', borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', fontSize: '0.95rem', lineHeight: 1.5, boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                        {msg.icerik}
                        <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '8px', color: isMe ? '#c7d2fe' : '#94a3b8', fontWeight: 500 }}>
                          {new Date(msg.olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', backgroundColor: '#ffffff' }}>
                  <input 
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder="Bir mesaj yazın..."
                    style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', backgroundColor: '#f8fafc' }}
                  />
                  <button type="submit" disabled={sendingMsg || !msgText.trim()} style={{ padding: '0 24px', backgroundColor: (sendingMsg || !msgText.trim()) ? '#cbd5e1' : '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '16px', fontWeight: 800, cursor: (sendingMsg || !msgText.trim()) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                    Gönder
                  </button>
                </form>
              </>
            ) : (
              <>
                <div style={{ padding: '32px', backgroundColor: '#f8fafc', flex: 1 }}>
                  <p style={{ color: '#475569', marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.6 }}>Eğitmene hedeflerinizden, şu anki seviyenizden ve beklentilerinizden bahsedin.</p>
                  
                  <textarea 
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder={`Merhaba ${teacher?.tam_ad?.split(' ')[0] || 'Öğretmenim'}, ders almak istiyorum...`}
                    style={{ width: '100%', minHeight: '140px', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '1rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                  />

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button 
                      onClick={handleSendMessage}
                      disabled={sendingMsg || !msgText.trim()}
                      style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: (sendingMsg || !msgText.trim()) ? '#e2e8f0' : '#0f172a', color: (sendingMsg || !msgText.trim()) ? '#94a3b8' : '#ffffff', fontWeight: 800, fontSize: '1.05rem', cursor: (sendingMsg || !msgText.trim()) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: (sendingMsg || !msgText.trim()) ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.2)' }}
                    >
                      {sendingMsg ? 'Gönderiliyor...' : 'İlk Mesajı Gönder'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}