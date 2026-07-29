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

  // 🚀 YENİ: Toplam Tamamlanan Ders Sayısı State'i
  const [tamamlananDersSayisi, setTamamlananDersSayisi] = useState(0);

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
      
      const { data: teacherData, error: teacherError } = await supabase
        .from('egitmenler')
        .select('*')
        .or(`user_id.eq.${teacherId},id.eq.${teacherId}`)
        .maybeSingle();

      if (teacherError) console.error("Eğitmen hatası:", teacherError);
      
      if (teacherData) {
        setTeacher(teacherData);
        const targetUserId = teacherData.user_id || teacherData.id;

        // 🚀 YENİ: Eğitmenin 'Tamamlanan' ders sayısını buluyoruz
        const { data: tumDerslerData } = await supabase
          .from('dersler')
          .select('durum')
          .eq('user_id', targetUserId);
        
        if (tumDerslerData) {
          const bitenSayisi = tumDerslerData.filter(l => l.durum === 'Tamamlanan').length;
          setTamamlananDersSayisi(bitenSayisi);
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 600, color: '#475569' }}>Bilgiler yükleniyor...</div>;
  if (!teacher) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 600, color: '#ef4444' }}>Eğitmen profili bulunamadı.</div>;

  const embedVideoUrl = getYouTubeEmbedUrl(teacher?.video_url);
  const dillerMetni = teacher?.konustugu_diller || teacher?.diller || '';
  const isTeacherOnline = isOnline(teacher?.son_gorulme);

  // 🚀 GERÇEK VE AKTİF PUAN HESAPLAMA:
  // Sadece puanı 0'dan büyük ve geçerli (1-5 arası) olan yorumları hesaba katıyoruz
  const gecerliPuanlar = yorumlar.filter(y => Number(y.puan) > 0 && Number(y.puan) <= 5);
  
  const dinamikOrtalama = gecerliPuanlar.length > 0
    ? (gecerliPuanlar.reduce((acc, curr) => acc + Number(curr.puan), 0) / gecerliPuanlar.length).toFixed(1)
    : (teacher?.ortalama_puan ? Number(teacher.ortalama_puan).toFixed(1) : null);

  // Sayısal puana göre kaç tane dolu yıldız (★) gösterileceğini hesaplar
  const doluYildizSayisi = dinamikOrtalama ? Math.round(Number(dinamikOrtalama)) : 0;

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#121117', backgroundColor: '#f4f4f5', minHeight: '100vh', paddingBottom: '80px' }}>
      
      <nav style={{ padding: '16px 8%', backgroundColor: '#ffffff', borderBottom: '1px solid #dcdce5', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#121117', fontSize: '15px' }}>
          ← Geri dön
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '32px auto 0', padding: '0 20px', display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* SOL TARAF */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 🚀 ÜST PROFİL KARTI - SADELEŞTİRİLDİ */}
          <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #dcdce5', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img 
                src={teacher?.avatar_url || `https://ui-avatars.com/api/?name=${teacher?.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5&size=120&bold=true`} 
                alt={teacher?.tam_ad}
                style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }} 
              />
              {isTeacherOnline && (
                <div style={{ position: 'absolute', bottom: 4, right: -4, width: '18px', height: '18px', backgroundColor: '#16a34a', border: '3px solid #ffffff', borderRadius: '50%' }}></div>
              )}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0', color: '#121117', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {teacher?.tam_ad}
                    <span style={{ color: '#3b82f6', fontSize: '1.2rem' }} title="Onaylı Eğitmen">✔</span>
                  </h1>
                  {/* Sadece Türkçe (Yabancılar İçin) / Ders Türü */}
                  <p style={{ margin: 0, fontSize: '1.1rem', color: '#3f3a5a', fontWeight: 500 }}>{teacher?.ders_turu || 'Türkçe (Yabancılar İçin)'}</p>

                  {/* 🚀 YENİ: Pembe Etiket yerine dinamik Toplam Tamamlanan Ders Rozeti */}
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ padding: '4px 10px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid #bbf7d0', display: 'inline-block' }}>
                      🏆 {tamamlananDersSayisi} Ders Tamamlandı
                    </span>
                  </div>
                </div>
                
                {/* 🚀 AKTİF VE DİNAMİK YILDIZLI PUANLAMA ALANI */}
                <div style={{ textAlign: 'right' }}>
                  {dinamikOrtalama ? (
                    <>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#121117', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span style={{ color: '#f59e0b', letterSpacing: '2px' }}>
                          {"★".repeat(doluYildizSayisi)}{"☆".repeat(5 - doluYildizSayisi)}
                        </span>
                        <span>{dinamikOrtalama}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontWeight: 600 }}>
                        {gecerliPuanlar.length} gerçek değerlendirme
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px', display: 'inline-block' }}>
                        ✨ Yeni Eğitmen
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
                        Henüz puanlanmadı
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SADECE KONUŞTUĞU DİLLER */}
              {dillerMetni && (
                <div style={{ marginTop: '16px', fontSize: '0.95rem', color: '#4b5563' }}>
                  <strong>🗣 Konuştuğu diller:</strong> {dillerMetni}
                </div>
              )}

              {/* SADECE KONUM VE OKUL (EĞİTİM) */}
              <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {teacher?.konum && <span style={{ padding: '6px 14px', background: '#f3f4f6', color: '#374151', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>📍 Konum: {teacher.konum}</span>}
                {teacher?.egitim && <span style={{ padding: '6px 14px', background: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>📚 {teacher.egitim}</span>}
              </div>
            </div>
          </div>

          {/* VİDEO ALANI */}
          <div style={{ width: '100%', height: '400px', backgroundColor: '#000000', borderRadius: '16px', overflow: 'hidden', border: '1px solid #dcdce5' }}>
            {teacher?.video_url ? (
              <iframe src={embedVideoUrl || ''} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>Tanıtım videosu eklenmemiş</div>
            )}
          </div>

          {/* SIRALAMA İLE BİLGİ KARTLARI */}
          <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #dcdce5', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* 1. ÖĞRETİM YAKLAŞIMI VE METODOLOJİ */}
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#121117', marginBottom: '16px' }}>Öğretim Yaklaşımı ve Metodoloji</h2>
              <p style={{ lineHeight: 1.7, color: '#3f3a5a', fontSize: '1.05rem', whiteSpace: 'pre-line', margin: 0 }}>
                {teacher?.ogretim_yaklasimi || teacher?.metodoloji || "Eğitmen henüz öğretim yaklaşımı bilgisi eklememiş."}
              </p>
            </div>

            {/* 2. UZMANLIK VE ODAK ALANLARI */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#121117', marginBottom: '16px' }}>Uzmanlık ve Odak Alanları</h2>
              {(teacher?.amac || teacher?.odak) ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {teacher?.amac && teacher.amac.split(',').map((item: string, idx: number) => (
                    item.trim() && <span key={`amac-${idx}`} style={{ padding: '8px 16px', background: '#f3f4f6', color: '#111827', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 500 }}>🎯 {item.trim()}</span>
                  ))}
                  {teacher?.odak && teacher.odak.split(',').map((item: string, idx: number) => (
                    item.trim() && <span key={`odak-${idx}`} style={{ padding: '8px 16px', background: '#f3f4f6', color: '#111827', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 500 }}>⭐ {item.trim()}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>Eğitmen henüz uzmanlık alanı belirtmemiş.</p>
              )}
            </div>

            {/* 3. EĞİTMEN HAKKINDA (BİYOGRAFİ) */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#121117', marginBottom: '16px' }}>Eğitmen Hakkında</h2>
              <p style={{ lineHeight: 1.7, color: '#3f3a5a', fontSize: '1.05rem', whiteSpace: 'pre-line', margin: 0 }}>
                {teacher?.biyografi || "Eğitmen henüz bir biyografi eklememiş."}
              </p>
            </div>

          </div>

          {/* 4. ÖĞRENCİ YORUMLARI */}
          <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #dcdce5', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#121117', marginBottom: '24px' }}>
              Öğrenci Yorumları <span style={{ color: '#6b7280', fontSize: '1.2rem', fontWeight: 500 }}>({yorumlar.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {yorumlar.length > 0 ? (
                yorumlar.map((y, i) => (
                  <div key={i} style={{ borderBottom: i !== yorumlar.length -1 ? '1px solid #f3f4f6' : 'none', paddingBottom: i !== yorumlar.length -1 ? '24px' : '0' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ width: '48px', height: '48px', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                        {y.ogrenci_adi ? y.ogrenci_adi.charAt(0).toUpperCase() : 'Ö'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#121117', fontSize: '1.05rem' }}>{y.ogrenci_adi || 'Öğrenci'}</div>
                        <div style={{ color: '#f59e0b', fontSize: '0.9rem', letterSpacing: '1px' }}>
                          {"★".repeat(Number(y.puan) || 5)}{"☆".repeat(5 - (Number(y.puan) || 5))}
                        </div>
                      </div>
                    </div>
                    <p style={{ color: '#3f3a5a', margin: 0, lineHeight: 1.6 }}>{y.yorum_metni}</p>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Bu eğitmen için henüz yorum yapılmamış.</div>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ TARAF - TAKVİM VE PROGRAM */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #dcdce5', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#121117' }}>{teacher?.saatlik_ucret}₺</span>
                <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}> / 50 dk ders</span>
              </div>
            </div>

            <div style={{ marginBottom: '24px', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', backgroundColor: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, color: '#121117' }}>Program</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
                {availableDates.map((item, idx) => {
                  const isSelected = selectedDate?.toDateString() === item.date.toDateString();
                  return (
                    <button 
                      key={idx}
                      onClick={() => { setSelectedDate(item.date); setSelectedHour(null); }}
                      style={{ 
                        flex: '0 0 auto', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                        background: isSelected ? '#121117' : '#ffffff',
                        border: isSelected ? '1px solid #121117' : '1px solid #dcdce5',
                        color: isSelected ? '#ffffff' : '#374151',
                        transition: 'all 0.1s'
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{item.dayName}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{item.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {selectedDate && HOURS.map(hour => {
                  const status = checkSlotStatus(selectedDate, hour);
                  const isSelected = selectedHour === hour;

                  return (
                    <button 
                      key={hour} 
                      disabled={status.disabled} 
                      onClick={() => setSelectedHour(hour)} 
                      style={{
                        padding: '10px 0', borderRadius: '8px', fontSize: '14px',
                        cursor: status.disabled ? 'not-allowed' : 'pointer',
                        background: isSelected ? '#3b82f6' : (status.disabled ? '#f3f4f6' : '#ffffff'),
                        border: isSelected ? '1px solid #3b82f6' : (status.disabled ? '1px solid #e5e7eb' : '1px solid #dcdce5'),
                        color: isSelected ? 'white' : (status.disabled ? '#9ca3af' : '#121117'),
                        fontWeight: 600,
                        transition: 'all 0.1s'
                      }}>
                      {hour}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleBooking} disabled={bookingLoading || !selectedHour} 
              style={{ 
                width: '100%', padding: '16px', background: !selectedHour ? '#e5e7eb' : '#121117', color: !selectedHour ? '#9ca3af' : '#ffffff', 
                borderRadius: '8px', border: 'none', fontWeight: 700, cursor: !selectedHour ? 'not-allowed' : 'pointer', fontSize: '1.1rem', transition: 'all 0.2s', marginBottom: '12px' 
              }}>
              {bookingLoading ? "İşleniyor..." : (selectedHour ? `Deneme dersi ayırt` : "Önce Saat Seçin")}
            </button>

            <button 
              onClick={() => setShowMsgModal(true)}
              style={{ 
                width: '100%', padding: '14px', background: '#ffffff', color: '#121117', 
                borderRadius: '8px', border: '1px solid #121117', fontWeight: 700, cursor: 'pointer', 
                fontSize: '1rem', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
            >
              ✉️ Mesaj gönder
            </button>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', marginTop: '16px' }}>⚡ Genellikle 1 saat içinde yanıt verir</p>
          </div>
        </div>
      </div>

      {/* AKILLI MINI-CHAT MODALI */}
      {showMsgModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={teacher?.avatar_url || `https://ui-avatars.com/api/?name=${teacher?.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5`} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  {isTeacherOnline && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', backgroundColor: '#16a34a', border: '2px solid #ffffff', borderRadius: '50%' }}></div>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#121117' }}>{teacher?.tam_ad}</h3>
                  <span style={{ color: isTeacherOnline ? '#16a34a' : '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                    {isTeacherOnline ? 'Çevrimiçi' : 'Son görülme: Yakınlarda'}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowMsgModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>

            {loadingChat ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Geçmiş mesajlarınız kontrol ediliyor...</div>
            ) : chatMessages.length > 0 ? (
              <>
                <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#ffffff', minHeight: '300px' }}>
                  {chatMessages.map((msg, idx) => {
                    const isMe = msg.gonderen_id === currentUserId;
                    return (
                      <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', backgroundColor: isMe ? '#4f46e5' : '#f1f5f9', color: isMe ? '#ffffff' : '#0f172a', padding: '12px 16px', borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', fontSize: '0.95rem', lineHeight: 1.4 }}>
                        {msg.icerik}
                        <div style={{ fontSize: '0.7rem', textAlign: 'right', marginTop: '6px', color: isMe ? '#c7d2fe' : '#94a3b8' }}>
                          {new Date(msg.olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleSendMessage} style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px', backgroundColor: '#f8fafc' }}>
                  <input 
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder="Mesaj yazın..."
                    style={{ flex: 1, padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
                  />
                  <button type="submit" disabled={sendingMsg || !msgText.trim()} style={{ padding: '0 24px', backgroundColor: (sendingMsg || !msgText.trim()) ? '#94a3b8' : '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: (sendingMsg || !msgText.trim()) ? 'not-allowed' : 'pointer' }}>
                    Gönder
                  </button>
                </form>
              </>
            ) : (
              <>
                <div style={{ padding: '32px' }}>
                  <p style={{ color: '#4b5563', marginBottom: '16px', fontSize: '0.95rem' }}>Eğitmene hedeflerinizden, şu anki seviyenizden ve beklentilerinizden bahsedin.</p>
                  
                  <textarea 
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder={`Merhaba ${teacher?.tam_ad?.split(' ')[0] || 'Öğretmenim'}, ders almak istiyorum...`}
                    style={{ width: '100%', minHeight: '120px', padding: '16px', borderRadius: '12px', border: '1px solid #dcdce5', backgroundColor: '#ffffff', fontSize: '1rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button 
                      onClick={handleSendMessage}
                      disabled={sendingMsg || !msgText.trim()}
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: (sendingMsg || !msgText.trim()) ? '#e5e7eb' : '#121117', color: (sendingMsg || !msgText.trim()) ? '#9ca3af' : '#ffffff', fontWeight: 700, fontSize: '1.05rem', cursor: (sendingMsg || !msgText.trim()) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
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