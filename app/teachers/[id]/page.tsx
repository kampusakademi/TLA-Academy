'use client';

import { useEffect, useState } from 'react';
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

  // 🚀 FAVORİ (KAYDETME) STATE'LERİ
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [availableDates, setAvailableDates] = useState<{date: Date, dayName: string, label: string}[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  useEffect(() => {
    const dates = [];
    const dayMap = { 0: 'Paz', 1: 'Pzt', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cmt' };
    
    for(let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i); 
        dates.push({
            date: d,
            dayName: dayMap[d.getDay() as keyof typeof dayMap],
            label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
        });
    }
    setAvailableDates(dates);
    setSelectedDate(dates[0].date);

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

        // 🚀 KULLANICI GİRİŞ YAPMIŞSA FAVORİ DURUMUNU KONTROL ET
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
          .select('durum, ogrenci_id')
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

  // 🚀 FAVORİYE EKLE / ÇIKAR VE BİLDİRİM (MESAJ) GÖNDERME FONKSİYONU
  async function handleFavoriteToggle() {
    if (!currentUserId) {
      alert("⚠️ Eğitmenleri favorilerinize eklemek için giriş yapmalısınız.");
      return;
    }

    setFavLoading(true);
    const targetUserId = teacher.user_id || teacher.id;

    try {
      if (isFavorited) {
        // Favorilerden Çıkar
        await supabase
          .from('favoriler')
          .delete()
          .eq('ogrenci_id', currentUserId)
          .eq('egitmen_id', targetUserId);
        
        setIsFavorited(false);
      } else {
        // Favorilere Ekle
        await supabase
          .from('favoriler')
          .insert([{ ogrenci_id: currentUserId, egitmen_id: targetUserId }]);
        
        setIsFavorited(true);

        // 🚀 ÖĞRETMENE OTOMATİK MESAJ/BİLDİRİM GÖNDER
        // Öğrencinin adını bulalım
        const { data: ogrenciData } = await supabase
          .from('ogrenciler')
          .select('tam_ad')
          .eq('user_id', currentUserId)
          .maybeSingle();

        const ogrenciAdi = ogrenciData?.tam_ad || "Bir öğrenci";

        // Öğretmenin mesaj kutusuna düşecek olan dikkat çekici sistem notu
        const otomatikMesaj = `📌 Sistem Bildirimi: Merhaba! ${ogrenciAdi} adlı öğrenci profilinizi inceledi ve sizi Favorilerine ekledi. \n\nOna kısa bir "Merhaba, hedeflerinize nasıl yardımcı olabilirim?" mesajı göndererek ilk adımı atabilirsiniz.`;

        await supabase
          .from('mesajlar')
          .insert([{
            gonderen_id: currentUserId, // Öğrenciden gelmiş gibi görünür ki öğretmen direkt cevap yazabilsin
            alici_id: targetUserId,
            icerik: otomatikMesaj,
            okundu: false
          }]);
      }
    } catch (error: any) {
      alert("Bir hata oluştu: " + error.message);
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

  function checkSlotStatus(date: Date, hour: string) {
    if (!teacher) return { disabled: true, reason: '' };

    const now = new Date();
    const [saatNum] = hour.split(':').map(Number);
    
    const slotDateTime = new Date(date);
    slotDateTime.setHours(saatNum, 0, 0, 0);

    if (slotDateTime < now) {
        return { disabled: true, reason: 'Geçti' };
    }

    const dayMap = { 0: 'Pazar', 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi' };
    const dayName = dayMap[date.getDay() as keyof typeof dayMap];
    const slotKey = `${dayName}-${hour}`;

    if (teacher.musait_olmayan_saatler && teacher.musait_olmayan_saatler.includes(slotKey)) {
        return { disabled: true, reason: 'Kapalı' };
    }

    const isBooked = bookedLessons.some(lesson => {
        try {
            const lDate = new Date(lesson.tarih_saat);
            return lDate.getFullYear() === date.getFullYear() &&
                   lDate.getMonth() === date.getMonth() &&
                   lDate.getDate() === date.getDate() &&
                   lDate.getHours() === saatNum;
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
        alert("Lütfen ders ayırtmak için hesabınıza giriş yapın.");
        return;
      }

      const { data: ogrenciData } = await supabase
        .from('ogrenciler')
        .select('tam_ad')
        .eq('user_id', user.id)
        .maybeSingle();

      const finalOgrenciAdi = ogrenciData?.tam_ad || user?.user_metadata?.full_name || "Öğrenci";

      const [saat] = selectedHour.split(':');
      const islemTarihi = new Date(selectedDate);
      islemTarihi.setHours(Number(saat), 0, 0, 0); 
      const targetTimestamp = islemTarihi.toISOString(); 

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
      
      alert("Rezervasyon başarıyla oluşturuldu! 🎉 Eğitmeniniz sizi bekliyor.");
      setSelectedHour(null);
      loadData(teacher.id); 
      
    } catch (err: any) { 
      alert("Hata: " + err.message); 
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
        alert("Lütfen mesaj göndermek için hesabınıza giriş yapın.");
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
      alert("Mesaj gönderilirken bir hata oluştu: " + error.message);
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

  // 🚀 DİNAMİK YANIT SÜRESİ HESAPLAYICISI 
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }}>Bilgiler yükleniyor...</div>;
  if (!teacher) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 600, color: '#ef4444', backgroundColor: '#f8fafc' }}>Eğitmen profili bulunamadı.</div>;

  const embedVideoUrl = getYouTubeEmbedUrl(teacher?.video_url);
  const isTeacherOnline = isOnline(teacher?.son_gorulme);

  // Yanıt süresini hesapla
  const yanitSuresiMetni = getDynamicResponseTime(teacher?.son_gorulme);
  const isCevrimici = yanitSuresiMetni.includes("Şu an aktif");

  // 🚀 AKILLI DİL AYIKLAYICI (Köşeli parantezleri temizler)
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
  const doluYildizSayisi = dinamikOrtalama ? Math.round(Number(dinamikOrtalama)) : 0;

  const avatarGradients = [
    'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    'linear-gradient(135deg, #dcfce3 0%, #bbf7d0 100%)',
    'linear-gradient(135deg, #ffedd5 0%, #fde047 100%)',
    'linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%)'
  ];
  const avatarTextColors = ['#3730a3', '#831843', '#14532d', '#713f12', '#1e3a8a'];

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a', backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* Glassmorphism Navigasyon */}
      <nav style={{ padding: '16px 8%', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
          <span style={{ fontSize: '1.2rem' }}>←</span> Geri dön
        </button>
      </nav>

      <div style={{ maxWidth: '1140px', margin: '40px auto 0', padding: '0 24px', display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* SOL TARAF */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Profil Üst Kart */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.06)' }}>
            <div style={{ height: '140px', background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 50%, #f3e8ff 100%)' }}></div>
            
            <div style={{ padding: '0 32px 32px 32px', display: 'flex', gap: '28px', alignItems: 'flex-start', marginTop: '-54px' }}>
              <div style={{ position: 'relative', flexShrink: 0, padding: '4px', background: 'linear-gradient(135deg, #818cf8 0%, #10b981 100%)', borderRadius: '50%', boxShadow: '0 15px 35px -5px rgba(99, 102, 241, 0.3)' }}>
                <img 
                  src={teacher?.avatar_url || `https://ui-avatars.com/api/?name=${teacher?.tam_ad || 'Eğitmen'}&background=c7d2fe&color=3730a3&size=140&bold=true`} 
                  alt={teacher?.tam_ad}
                  style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #ffffff' }} 
                />
                {isTeacherOnline && (
                  <div style={{ position: 'absolute', bottom: 8, right: 8, width: '22px', height: '22px', backgroundColor: '#10b981', border: '3px solid #ffffff', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} title="Çevrimiçi"></div>
                )}
              </div>
              
              <div style={{ flex: 1, paddingTop: '62px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.1 }}>
                      {teacher?.tam_ad}
                    </h1>
                    <p style={{ margin: 0, fontSize: '1.15rem', color: '#4f46e5', fontWeight: 700, letterSpacing: '-0.2px' }}>
                      {teacher?.ders_turu || 'Türkçe Öğretmeni'}
                    </p>

                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)' }}>
                        <span style={{ fontSize: '1.1rem' }}>🌟</span> {tamamlananDersSayisi} Ders Tamamlandı
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {dinamikOrtalama ? (
                      <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{dinamikOrtalama}</span>
                          <span style={{ color: '#fbbf24', fontSize: '1.4rem' }}>★</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                          {gecerliPuanlar.length} değerlendirme
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '16px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1d4ed8', marginBottom: '2px' }}>✨ Yeni</div>
                        <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>Henüz puanlanmadı</div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
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
                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: '12px 16px', borderRadius: '16px' }}>
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
                <div style={{ width: '64px', height: '64px', background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '16px' }}>🎥</div>
                <span style={{ fontWeight: 600 }}>Tanıtım videosu bulunmuyor</span>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                </div>
                Uzmanlık ve Odak Alanları
              </h2>
              {(teacher?.amac || teacher?.odak) ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {teacher?.amac && teacher.amac.split(',').map((item: string, idx: number) => (
                    item.trim() && <span key={`amac-${idx}`} style={{ padding: '8px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>{item.trim()}</span>
                  ))}
                  {teacher?.odak && teacher.odak.split(',').map((item: string, idx: number) => (
                    item.trim() && <span key={`odak-${idx}`} style={{ padding: '8px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>{item.trim()}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>Eğitmen henüz uzmanlık alanı belirtmemiş.</p>
              )}
            </div>

            <div style={{ height: '1px', background: '#f1f5f9' }}></div>

            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>💡</div>
                Öğretim Yaklaşımı
              </h2>
              <p style={{ lineHeight: 1.8, color: '#475569', fontSize: '1.05rem', whiteSpace: 'pre-line', margin: 0 }}>
                {teacher?.ogretim_yaklasimi || teacher?.metodoloji || "Eğitmen henüz öğretim yaklaşımı bilgisi eklememiş."}
              </p>
            </div>

            <div style={{ height: '1px', background: '#f1f5f9' }}></div>

            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>👤</div>
                Eğitmen Hakkında
              </h2>
              <p style={{ lineHeight: 1.8, color: '#475569', fontSize: '1.05rem', whiteSpace: 'pre-line', margin: 0 }}>
                {teacher?.biyografi || "Eğitmen henüz bir biyografi eklememiş."}
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

            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Gün Seçin</h3>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '8px' }}>
                {selectedDate && HOURS.map(hour => {
                  const status = checkSlotStatus(selectedDate, hour);
                  const isSelected = selectedHour === hour;

                  return (
                    <button 
                      key={hour} 
                      disabled={status.disabled} 
                      onClick={() => setSelectedHour(hour)} 
                      style={{
                        padding: '12px 0', borderRadius: '12px', fontSize: '0.95rem',
                        cursor: status.disabled ? 'not-allowed' : 'pointer',
                        background: isSelected ? '#4f46e5' : (status.disabled ? '#f1f5f9' : '#ffffff'),
                        border: isSelected ? '1px solid #4f46e5' : (status.disabled ? '1px dashed #cbd5e1' : '1px solid #cbd5e1'),
                        color: isSelected ? 'white' : (status.disabled ? '#94a3b8' : '#0f172a'),
                        fontWeight: 700,
                        transition: 'all 0.15s'
                      }}>
                      {hour}
                    </button>
                  );
                })}
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

            {/* 🚀 FAVORİ (KALP) VE MESAJ BUTONLARI YAN YANA */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowMsgModal(true)}
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