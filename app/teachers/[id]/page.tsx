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
  const [activeTab, setActiveTab] = useState<'hakkinda' | 'yorumlar'>('hakkinda');

  // DİNAMİK TAKVİM SİSTEMİ STATE'LERİ
  const [availableDates, setAvailableDates] = useState<{date: Date, dayName: string, label: string}[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  useEffect(() => {
    const dates = [];
    const dayMap = { 0: 'Pazar', 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi' };
    
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

        const { data: lessonData } = await supabase
          .from('dersler')
          .select('*')
          .eq('user_id', targetUserId)
          .neq('durum', 'İptal Edilen');
        setBookedLessons(lessonData || []);

        const { data: yorumData } = await supabase
          .from('yorumlar')
          .select('*')
          .eq('egitmen_id', targetUserId);
        setYorumlar(yorumData || []);
      }
    } catch (err) {
      console.error("Veri yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 600, color: '#475569' }}>Bilgiler yükleniyor...</div>;
  if (!teacher) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 600, color: '#ef4444' }}>Eğitmen profili bulunamadı.</div>;

  const embedVideoUrl = getYouTubeEmbedUrl(teacher?.video_url);

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', color: '#0f172a', backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      <nav style={{ padding: '20px 8%', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button onClick={() => router.back()} style={{ padding: '10px 16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>← Geri Dön</button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Turkish Learning Academy.</h1>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '40px auto 0', padding: '0 20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', alignItems: 'start' }}>
        
        <div>
          {/* VİDEO ALANI */}
          <div style={{ width: '100%', height: '350px', backgroundColor: '#1e1b4b', borderRadius: '24px', overflow: 'hidden' }}>
            {teacher?.video_url ? <iframe src={embedVideoUrl || ''} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6366f1' }}>Video bulunamadı</div>}
          </div>

          <div style={{ marginTop: '32px' }}>
            {/* 🚀 YENİ: AVATAR VE İSİM BÖLÜMÜ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={teacher?.avatar_url || `https://ui-avatars.com/api/?name=${teacher?.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5&size=100&bold=true`} 
                  alt={teacher?.tam_ad}
                  style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #ffffff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                />
                <div style={{ position: 'absolute', bottom: 4, right: 4, width: '20px', height: '20px', backgroundColor: '#22c55e', border: '3px solid #ffffff', borderRadius: '50%' }}></div>
              </div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>{teacher?.tam_ad}</h2>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <span style={{ padding: '6px 12px', background: '#eef2ff', color: '#4f46e5', borderRadius: '8px', fontWeight: 700 }}>{teacher?.ders_turu || 'Uzman Eğitmen'}</span>
              <span style={{ padding: '6px 12px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}>📍 {teacher?.konum || 'Türkiye'}</span>
            </div>
            
            {/* ETİKETLER */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
              {teacher?.amac && teacher.amac.split(',').map((item: string, idx: number) => (
                item.trim() && <span key={`amac-${idx}`} style={{ padding: '6px 14px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700 }}>🎯 {item.trim()}</span>
              ))}
              {teacher?.odak && teacher.odak.split(',').map((item: string, idx: number) => (
                item.trim() && <span key={`odak-${idx}`} style={{ padding: '6px 14px', background: '#fce7f3', color: '#be185d', border: '1px solid #fbcfe8', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700 }}>⭐ {item.trim()}</span>
              ))}
              {teacher?.seviye && teacher.seviye.split(',').map((item: string, idx: number) => (
                item.trim() && <span key={`seviye-${idx}`} style={{ padding: '6px 14px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700 }}>📈 {item.trim()}</span>
              ))}
              {teacher?.sure && teacher.sure.split(',').map((item: string, idx: number) => (
                item.trim() && <span key={`sure-${idx}`} style={{ padding: '6px 14px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700 }}>⏱️ {item.trim()}</span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '40px', borderBottom: '2px solid #e2e8f0', display: 'flex', gap: '32px' }}>
            <button onClick={() => setActiveTab('hakkinda')} style={{ background: 'none', border: 'none', padding: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: activeTab === 'hakkinda' ? '#4f46e5' : '#64748b', borderBottom: activeTab === 'hakkinda' ? '3px solid #4f46e5' : '3px solid transparent', cursor: 'pointer' }}>Hakkında</button>
            <button onClick={() => setActiveTab('yorumlar')} style={{ background: 'none', border: 'none', padding: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: activeTab === 'yorumlar' ? '#4f46e5' : '#64748b', borderBottom: activeTab === 'yorumlar' ? '3px solid #4f46e5' : '3px solid transparent', cursor: 'pointer' }}>Öğrenci Yorumları</button>
          </div>

          <div style={{ marginTop: '32px' }}>
            {/* 🚀 YENİ: HAKKINDA & METODOLOJİ BİRLEŞTİRİLDİ */}
            {activeTab === 'hakkinda' && (
              <div style={{ background: '#ffffff', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Eğitmen Biyografisi</h3>
                  <p style={{ lineHeight: 1.8, color: '#475569', whiteSpace: 'pre-line', margin: 0 }}>
                    {teacher?.biyografi || "Biyografi eklenmemiş."}
                  </p>
                </div>

                {/* Eğer veritabanında ogretim_yaklasimi (veya metodoloji) doluysa burası görünür */}
                {(teacher?.ogretim_yaklasimi || teacher?.metodoloji) && (
                  <div style={{ paddingTop: '32px', borderTop: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Öğretim Yaklaşımı & Metodoloji</h3>
                    <p style={{ lineHeight: 1.8, color: '#475569', whiteSpace: 'pre-line', margin: 0 }}>
                      {teacher?.ogretim_yaklasimi || teacher?.metodoloji}
                    </p>
                  </div>
                )}
                
              </div>
            )}
            
            {activeTab === 'yorumlar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {yorumlar.length > 0 ? (
                  yorumlar.map((y, i) => (
                    <div key={i} style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{y.ogrenci_adi}</div>
                      <p style={{ color: '#475569', marginTop: 8 }}>{y.yorum_metni}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '20px', border: '1px dashed #e2e8f0', color: '#64748b' }}>Henüz yorum yapılmamış.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ TARAF: DİNAMİK REZERVASYON TAKVİMİ */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{teacher?.saatlik_ucret}₺ <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>/ saat</span></div>
            </div>

            {/* GÜN SEÇİMİ */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>1. Gün Seçin</label>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                {availableDates.map((item, idx) => {
                  const isSelected = selectedDate?.toDateString() === item.date.toDateString();
                  return (
                    <button 
                      key={idx}
                      onClick={() => { setSelectedDate(item.date); setSelectedHour(null); }}
                      style={{ 
                        flex: '0 0 auto', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        background: isSelected ? '#4f46e5' : '#f8fafc',
                        border: isSelected ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                        color: isSelected ? 'white' : '#0f172a',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#c7d2fe' : '#64748b' }}>{item.dayName}</span>
                      <span style={{ fontSize: '15px', fontWeight: 800 }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SAAT SEÇİMİ */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>2. Saat Seçin</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '280px', overflowY: 'auto', padding: '4px', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                {selectedDate && HOURS.map(hour => {
                  const status = checkSlotStatus(selectedDate, hour);
                  const isSelected = selectedHour === hour;

                  return (
                    <button 
                      key={hour} 
                      disabled={status.disabled} 
                      onClick={() => setSelectedHour(hour)} 
                      style={{
                        padding: '12px', borderRadius: '10px', fontSize: '14px',
                        cursor: status.disabled ? 'not-allowed' : 'pointer',
                        background: isSelected ? '#4f46e5' : (status.disabled ? '#f1f5f9' : '#ffffff'),
                        border: isSelected ? '1px solid #4f46e5' : (status.disabled ? '1px dashed #cbd5e1' : '1px solid #e2e8f0'),
                        color: isSelected ? 'white' : (status.disabled ? '#94a3b8' : '#0f172a'),
                        fontWeight: 700,
                        transition: 'all 0.1s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                      }}>
                      {hour}
                      {status.disabled && <span style={{ fontSize: '10px', fontWeight: 600, color: '#ef4444' }}>{status.reason}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleBooking} disabled={bookingLoading || !selectedHour} 
              style={{ width: '100%', padding: '18px', background: !selectedHour ? '#cbd5e1' : '#4f46e5', color: '#fff', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: !selectedHour ? 'not-allowed' : 'pointer', fontSize: '16px', transition: 'all 0.2s' }}>
              {bookingLoading ? "İşleniyor..." : (selectedHour ? `${selectedHour} - Rezervasyon Yap` : "Önce Saat Seçin")}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}