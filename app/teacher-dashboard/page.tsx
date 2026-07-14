'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TeacherDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [userId, setUserId] = useState('');
  
  // Eyalet tanımlamaları (Canlı veriler)
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // İstatistik durumları
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLessons: 0,
    completedLessons: 0,
    upcomingLessons: 0,
    canceledLessons: 0,
    activeStudents: 0
  });

  // Ders ve Öğrenci listeleri
  const [allLessonsList, setAllLessonsList] = useState<any[]>([]);
  const [upcomingLessonsList, setUpcomingLessonsList] = useState<any[]>([]);
  const [scheduleLessons, setScheduleLessons] = useState<any[]>([]);
  const [myStudentsList, setMyStudentsList] = useState<any[]>([]);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadTeacherProfile();
      loadDashboardStats();
      loadUpcomingLessons();
    }
  }, [userId]);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUserId(data?.user?.id || '');
  }

  async function loadTeacherProfile() {
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('egitmenler')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Profil yüklenirken hata oluştu:", error);
      }
      if (data) setTeacherProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadDashboardStats() {
    try {
      const { data: lessonData } = await supabase
        .from('dersler')
        .select('*')
        .eq('user_id', userId)
        .order('tarih_saat', { ascending: true });
      
      const safeLessons = lessonData || [];
      setAllLessonsList(safeLessons);

      const uniqueStudentsMap = new Map();
      safeLessons.forEach(lesson => {
        if (lesson.ogrenci_adi) {
          const key = lesson.ogrenci_adi.trim();
          if (!uniqueStudentsMap.has(key)) {
            uniqueStudentsMap.set(key, {
              adi: lesson.ogrenci_adi,
              ders_turu: lesson.ders_turu,
              toplam_ders: 0,
              son_ders_tarihi: lesson.tarih_saat
            });
          }
          const student = uniqueStudentsMap.get(key);
          student.toplam_ders += 1;
          if (new Date(lesson.tarih_saat) > new Date(student.son_ders_tarihi)) {
            student.son_ders_tarihi = lesson.tarih_saat;
          }
        }
      });

      const processedStudents = Array.from(uniqueStudentsMap.values());
      setMyStudentsList(processedStudents);
      
      const completedCount = safeLessons.filter(l => l.durum === 'Tamamlanan').length;
      const upcomingCount = safeLessons.filter(l => l.durum === 'Yaklaşan').length;
      const canceledCount = safeLessons.filter(l => l.durum === 'İptal Edilen').length;

      setStats({
        totalStudents: processedStudents.length,
        totalLessons: safeLessons.length,
        completedLessons: completedCount,
        upcomingLessons: upcomingCount,
        canceledLessons: canceledCount,
        activeStudents: processedStudents.length
      });

    } catch (err) {
      console.error("İstatistikler yüklenirken hata:", err);
    }
  }

  async function loadUpcomingLessons() {
    const { data } = await supabase
      .from('dersler')
      .select('*')
      .order('tarih_saat', { ascending: true });
    
    const myLessons = data?.filter(d => String(d.egitmen_id || d.user_id).trim() === String(userId).trim()) || [];
    
    setUpcomingLessonsList(myLessons.filter(d => d.durum === 'Yaklaşan').slice(0, 5));
    setScheduleLessons(data || []);
  }

  // DERSİ TAMAMLANDI OLARAK İŞARETLEME FONKSİYONU
  async function handleCompleteLesson(dersId: string) {
    try {
      const { error } = await supabase
        .from('dersler')
        .update({ durum: 'Tamamlanan' }) 
        .eq('id', dersId);

      if (error) throw error;
      
      loadDashboardStats();
      loadUpcomingLessons();
    } catch (err: any) {
      alert("Durum güncellenirken hata oluştu: " + err.message);
    }
  }

  // 🎯 SUPABASE İLE ETKİLEŞİMLİ VE ANINDA EKRANDAN SİLEN İPTAL FONKSİYONU
  async function handleCancelLesson(dersId: string) {
    if (!confirm("Bu dersi iptal etmek istediğinize emin misiniz? Öğrencinin takviminden de tamamen kaldırılacaktır.")) return;
    try {
      const { error } = await supabase
        .from('dersler')
        .delete()
        .eq('id', dersId);

      if (error) throw error;
      
      alert("Ders başarıyla silindi ve iptal edildi! 🎉");
      
      setAllLessonsList(prev => prev.filter(l => l.id !== dersId));
      setUpcomingLessonsList(prev => prev.filter(l => l.id !== dersId));
      setScheduleLessons(prev => prev.filter(l => l.id !== dersId));

      loadDashboardStats();
      loadUpcomingLessons();
    } catch (err: any) {
      alert("İptal işlemi sırasında hata oluştu: " + err.message);
    }
  }

  const menu = [
    { key: 'dashboard', label: '📊 Genel Bakış' },
    { key: 'profile', label: '👤 Profilim' },
    { key: 'lessons', label: '📚 Derslerim' },
    { key: 'schedule', label: '📅 Takvim' },
    { key: 'students', label: '👨‍🎓 Öğrencilerim' },
    { key: 'messages', label: '💬 Mesajlar' },
    { key: 'earnings', label: '💰 Kazançlar' },
    { key: 'settings', label: '⚙️ Ayarlar' }
  ];

  return (
    <div style={layout}>
      {/* SIDEBAR */}
      <aside style={{
        width: '280px',
        background: '#0f172a',
        color: '#94a3b8',
        padding: '30px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRight: '1px solid #1e293b'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 35 }}>
            <div style={{ width: 12, height: 24, borderRadius: 4, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}></div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Turkish Learning<br /><span style={{ color: '#3b82f6', fontSize: 14 }}>Academy</span>
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {menu.map(m => {
              const isActive = tab === m.key;
              return (
                <div
                  key={m.key}
                  onClick={() => setTab(m.key)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#fff' : '#94a3b8',
                    background: isActive ? '#1e293b' : 'transparent',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  {m.label}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            style={{
              width: "100%",
              padding: '12px',
              borderRadius: 10,
              border: "1px solid #334155",
              background: "transparent",
              color: '#f87171',
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: 'all 0.2s'
            }}
          >
            🚪 Oturumu Kapat
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={content}>
        {loadingProfile && tab !== 'messages' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#64748b', fontSize: 15, fontWeight: 500 }}>
            ✨ Bilgileriniz güvenle yükleniyor...
          </div>
        ) : (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {tab === 'dashboard' && (
              <Dashboard 
                profile={teacherProfile} 
                stats={stats} 
                upcomingLessons={upcomingLessonsList} 
                userId={userId}
                onComplete={handleCompleteLesson} 
                onCancel={handleCancelLesson} 
              />
            )}
            {tab === 'profile' && <Profile profile={teacherProfile} stats={stats} />}
            {tab === 'lessons' && <Lessons lessons={allLessonsList} stats={stats} onComplete={handleCompleteLesson} onCancel={handleCancelLesson} />} 
            
            {/* YENİ TAKVİM BİLEŞENİ ÇAĞRISI BURADA */}
            {tab === 'schedule' && <Schedule profile={teacherProfile} userId={userId} onProfileUpdate={loadTeacherProfile} />}
            
            {tab === 'students' && <Students students={myStudentsList} stats={stats} />}
            {tab === 'messages' && <Messages userId={userId} />}
            {tab === 'earnings' && <Earnings profile={teacherProfile} stats={stats} />}
            {tab === 'settings' && (
              <Settings 
                profile={teacherProfile} 
                userId={userId} 
                onProfileUpdate={() => {
                  loadTeacherProfile();
                  loadDashboardStats();
                  loadUpcomingLessons();
                }} 
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------------- LAYOUT STYLES ---------------- */
const layout = {
  display: 'grid',
  gridTemplateColumns: '280px 1fr',
  minHeight: '100vh',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  background: '#f8fafc',
  color: '#0f172a'
};
const content = { padding: '40px 50px', overflowY: 'auto' as const };

/* ---------------- 1. DASHBOARD COMPONENT ---------------- */
function Dashboard({ profile, stats, upcomingLessons, userId, onComplete, onCancel }: any) {
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: '30px 35px',
        borderRadius: '20px',
        boxShadow: '0 10px 25px -5px rgb(15 23 42 / 0.15)',
        marginBottom: 35,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-10%', top: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
        
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '6px' }}>
            Eğitmen Yönetim Paneli
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', margin: 0 }}>
            Tekrar hoş geldiniz, <span style={{ color: '#60a5fa' }}>{profile?.tam_ad || "Değerli Eğitmenimiz"}</span> 👋
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '8px 0 0 0', fontWeight: 400 }}>
            Bugün projeniz için harika bir gün. Öğrencileriniz ve güncel ders takviminiz aşağıda listelenmiştir.
          </p>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(userId);
              alert("Eğitmen ID başarıyla kopyalandı:\n" + userId);
            }}
            style={{ marginTop: '16px', background: '#2563eb', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            📋 Supabase için Eğitmen ID'mi Kopyala
          </button>
        </div>
        <div style={{ fontSize: '40px', background: 'rgba(255,255,255,0.05)', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}>
          🎓
        </div>
      </div>

      <div style={grid}>
        <Box title="Toplam Öğrenci" value={stats.totalStudents} icon="👨‍🎓" />
        <Box title="Toplam Ders" value={stats.totalLessons} icon="📚" />
        <Box title="Saatlik Ücretiniz" value={`${profile?.saatlik_ucret || 0} TL`} icon="💰" />
        <Box title="Ortalama Puan" value="5.0 ⭐" icon="📈" />
      </div>

      <div style={{ ...grid, marginTop: 24 }}>
        <Box title="Tamamlanan Dersler" value={stats.completedLessons} color="#f0fdf4" textColor="#16a34a" />
        <Box title="Yaklaşan Dersler" value={stats.upcomingLessons} color="#eff6ff" textColor="#2563eb" />
        <Box title="İptal Edilen" value={stats.canceledLessons} color="#fef2f2" textColor="#dc2626" />
        <Box title="Aktif Öğrenci" value={stats.activeStudents} color="#fdfaf2" textColor="#d97706" />
      </div>

      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>⏰ Yaklaşan Ders Planı</h3>
          {upcomingLessons.length === 0 ? (
            <div style={{ textTransform: 'none', textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
              Planlanmış yakın bir dersiniz bulunmuyor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {upcomingLessons.map((lesson: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>{lesson.ogrenci_adi || "Öğrenci"}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{lesson.ders_turu}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ fontWeight: 600, color: '#2563eb', fontSize: 14 }}>
                      {new Date(lesson.tarih_saat).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => onCancel(lesson.id)}
                        style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✕ İptal
                      </button>
                      <button 
                        onClick={() => onComplete(lesson.id)}
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✓ Tamamlandı
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>⚡ Hızlı Özet</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, color: '#334155' }}>
            <div style={summaryRow}><span style={{ color: '#64748b' }}>🔥 Toplam Süreç:</span> <strong>{stats.totalLessons} Ders</strong></div>
            <div style={summaryRow}><span style={{ color: '#64748b' }}>✅ Bitirilen:</span> <strong>{stats.completedLessons} Saat</strong></div>
            <div style={summaryRow}><span style={{ color: '#64748b' }}>❌ İptaller:</span> <strong>{stats.canceledLessons} Adet</strong></div>
            <div style={summaryRow}><span style={{ color: '#64748b' }}>⭐ Durum:</span> <span style={{ padding: '2px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Mükemmel</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const summaryRow = { display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' };

/* ---------------- 2. PROFILE COMPONENT ---------------- */
function Profile({ profile, stats }: any) {
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        height: '140px',
        borderRadius: '20px 20px 0 0',
        position: 'relative'
      }}></div>

      <div style={{
        background: 'white',
        borderRadius: '0 0 20px 20px',
        padding: '0 35px 35px 35px',
        border: '1px solid #e2e8f0',
        borderTop: 'none',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
        marginBottom: '30px',
        position: 'relative'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: '#2563eb',
          backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          fontSize: profile?.avatar_url ? '0px' : '36px',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px solid white',
          position: 'absolute',
          top: '-50px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {!profile?.avatar_url && (profile?.tam_ad?.charAt(0).toUpperCase() || 'E')}
        </div>

        <div style={{ paddingTop: '65px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.5px' }}>
                {profile?.tam_ad || "Egemen Tüzmen"}
              </h1>
              <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                ✓ DOĞRULANMIŞ EĞİTMEN
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', color: '#475569', fontSize: '15px', fontWeight: 500 }}>
              {profile?.ders_turu || "Türkçe (Yabancılar İçin)"} Uzmanı
            </p>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
              <span>📍 {profile?.konum || "Ankara, Türkiye"}</span>
              <span>🎓 {profile?.egitim || "Gazi Üniversitesi (Ph.D. Adayı)"}</span>
              <span>🗣️ {profile?.diller || "Türkçe (Ana Dil)"}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', background: '#f8fafc', padding: '12px 20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Saatlik Ücret</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', margin: '2px 0' }}>{profile?.saatlik_ucret || 0} TL</div>
            <div style={{ fontSize: '13px', color: '#d97706', fontWeight: 600 }}>⭐ 5.0 (Mükemmel Skor)</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>📝 Hakkımda / Biyografi</h3>
            <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '15px', margin: 0, whiteSpace: 'pre-line' }}>
              {profile?.biyografi || "Henüz bir tanıtım metni doldurulmamış. Ayarlar sekmesinden kendinizi tanıtan profesyonel bir biyografi ekleyebilirsiniz."}
            </p>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>🎯 Öğretim Yaklaşımı & Metodoloji</h3>
            <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '15px', margin: 0, whiteSpace: 'pre-line' }}>
              {profile?.metodoloji || "Derslerimde tamamen iletişimsel yaklaşımı (Communicative Approach) benimsiyorum. Dil öğrenimini sadece gramer kalıplarından ibaret görmüyor, ilk dersten itibaren öğrencilerin aktif şekilde Türkçe konuşmasını hedefliyorum. Yapay zeka destekli materyaller ogüncel kaynaklarla desteklenen ders süreçleri, her öğrencinin kendi öğrenme hızına özel olarak yapılandırılmaktadır."}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={{ ...cardTitleStyle, marginBottom: '16px' }}>📊 Eğitim İstatistikleri</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>👥 Toplam Öğrenci:</span>
                <strong style={{ color: '#0f172a' }}>{stats.totalStudents} Kişi</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>📚 Verilen Toplam Ders:</span>
                <strong style={{ color: '#0f172a' }}>{stats.totalLessons} Saat</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>💬 Cevaplama Hızı:</span>
                <strong style={{ color: '#16a34a' }}>%100 (Anında)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px' }}>
                <span style={{ color: '#64748b' }}>🔒 Hesap Durumu:</span>
                <span style={{ padding: '2px 8px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 3. LESSONS COMPONENT ---------------- */
function Lessons({ lessons, stats, onComplete, onCancel }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'upcoming' | 'completed'>('all');

  const filteredLessons = lessons.filter((lesson: any) => {
    if (activeSubTab === 'upcoming') return lesson.durum === 'Yaklaşan';
    if (activeSubTab === 'completed') return lesson.durum === 'Tamamlanan';
    return true;
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 0, marginRight: 0, marginBottom: 24, marginLeft: 0, letterSpacing: '-0.75px' }}>📚 Derslerim</h1>
      
      <div style={grid}>
        <Box title="Toplam Planlama" value={`${stats.totalLessons} Ders`} icon="📅" />
        <Box title="Kazanmaya Hazır (Yaklaşan)" value={`${stats.upcomingLessons} Saat`} color="#eff6ff" textColor="#2563eb" />
        <Box title="Arşivlenen (Tamamlanan)" value={`${stats.completedLessons} Saat`} color="#f0fdf4" textColor="#16a34a" />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        {(['all', 'upcoming', 'completed'] as const).map(tabKey => {
          const labels = { all: '🗂️ Tüm Dersler', upcoming: '⏰ Yaklaşan Dersler', completed: '✅ Geçmiş Dersler' };
          const isSelected = activeSubTab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => setActiveSubTab(tabKey)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: isSelected ? '#1e293b' : 'transparent',
                color: isSelected ? 'white' : '#64748b',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {labels[tabKey]}
            </button>
          );
        })}
      </div>

      <div style={{ ...cardStyle, marginTop: '20px', padding: 0, overflow: 'hidden' }}>
        {filteredLessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8', fontSize: '14px' }}>
            Seçilen filtreye uygun herhangi bir ders kaydı bulunamadı.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Öğrenci Adı</th>
                <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Ders Türü</th>
                <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Tarih & Saat</th>
                <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Ücret</th>
                <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Durum</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((lesson: any, idx: number) => {
                const isCompleted = lesson.durum === 'Tamamlanan';
                const statusBg = isCompleted ? '#dcfce7' : (lesson.durum === 'İptal Edilen' ? '#fef2f2' : '#dbeafe');
                const statusColor = isCompleted ? '#15803d' : (lesson.durum === 'İptal Edilen' ? '#dc2626' : '#1e40af');

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#0f172a' }}>
                      <span style={{ marginRight: '8px' }}>👤</span> {lesson.ogrenci_adi}
                    </td>
                    <td style={{ padding: '16px 24px', color: '#475569' }}>
                      {lesson.ders_turu}
                    </td>
                    <td style={{ padding: '16px 24px', color: '#1e3a8a', fontWeight: 500 }}>
                      {new Date(lesson.tarih_saat).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a' }}>
                      {lesson.ucret || 0} TL
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: statusBg,
                          color: statusColor,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-block'
                        }}>
                          {lesson.durum}
                        </span>
                        {lesson.durum === 'Yaklaşan' && (
                          <>
                            <button 
                              onClick={() => onComplete(lesson.id)}
                              title="Dersi Tamamla"
                              style={{ background: '#10b981', color: 'white', border: 'none', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              ✓
                            </button>
                            <button 
                              onClick={() => onCancel(lesson.id)}
                              title="Dersi İptal Et"
                              style={{ background: '#ef4444', color: 'white', border: 'none', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------------- 4. YEPYENİ 7x24 ÇALIŞMA SAATLERİ (SCHEDULE) COMPONENT ---------------- */
function Schedule({ profile, userId, onProfileUpdate }: any) {
  const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 🚀 EKSİK OLAN HAYATİ KOD BURASI: 
  // Sekme her açıldığında veya profil güncellendiğinde kayıtlı saatleri ekrana getirir.
  useEffect(() => {
    if (profile?.musait_olmayan_saatler) {
      setBlockedSlots(profile.musait_olmayan_saatler);
    }
  }, [profile]);

  const toggleSlot = (day: string, hour: string) => {
    const slotKey = `${day}-${hour}`;
    setBlockedSlots((prev) => {
      if (prev.includes(slotKey)) {
        return prev.filter(slot => slot !== slotKey);
      } else {
        return [...prev, slotKey]; 
      }
    });
  };

  const resetAll = () => {
    if(confirm("Tüm saatleri müsait olarak işaretlemek istiyor musunuz?")) {
      setBlockedSlots([]);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) {
      alert("⚠️ Önce 'Ayarlar' sekmesinden profil bilgilerinizi bir kez kaydedin ki sistem sizi tanısın!");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('egitmenler')
        .update({ musait_olmayan_saatler: blockedSlots })
        .eq('user_id', userId);

      if (error) throw error;
      
      alert("Müsaitlik durumunuz başarıyla kaydedildi! 🚀 Öğrenciler artık bu saatleri kapalı görecek.");
      if (onProfileUpdate) onProfileUpdate(); 
    } catch (err: any) {
      alert("Kaydedilirken hata oluştu: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.75px' }}>📅 Çalışma Saatlerim</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
            Ders vermek <strong>istediğiniz</strong> saatleri yeşil, <strong>müsait olmadığınız</strong> saatleri kırmızı yapmak için kutulara tıklayın.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={resetAll} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            🔄 Hepsini Temizle
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: saving ? 'default' : 'pointer', transition: 'all 0.2s' }}>
            {saving ? 'Kaydediliyor...' : '💾 Değişiklikleri Kaydet'}
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '700px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <tr>
                <th style={{ padding: '15px', background: '#f8fafc', borderBottom: '2px solid #cbd5e1', borderRight: '1px solid #e2e8f0', width: '80px', color: '#475569', fontSize: 14 }}>Saat</th>
                {DAYS.map(day => (
                  <th key={day} style={{ padding: '15px', background: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontWeight: 700, color: '#1e293b', fontSize: 15 }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td style={{ padding: '10px', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, color: '#64748b', fontSize: 13, position: 'sticky', left: 0, zIndex: 5 }}>
                    {hour}
                  </td>
                  {DAYS.map(day => {
                    const slotKey = `${day}-${hour}`;
                    const isBlocked = blockedSlots.includes(slotKey);
                    
                    return (
                      <td 
                        key={slotKey} 
                        onClick={() => toggleSlot(day, hour)}
                        style={{ 
                          borderRight: '1px solid #e2e8f0',
                          borderBottom: '1px solid #e2e8f0',
                          background: isBlocked ? '#fef2f2' : '#f0fdf4',
                          cursor: 'pointer',
                          transition: 'all 0.1s ease',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {isBlocked ? (
                          <span style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold' }}>✕</span>
                        ) : (
                          <span style={{ color: '#22c55e', fontSize: '18px', fontWeight: 'bold' }}>✓</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 5. STUDENTS COMPONENT ---------------- */
function Students({ students, stats }: any) {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 0, marginRight: 0, marginBottom: 24, marginLeft: 0, letterSpacing: '-0.75px' }}>👨‍🎓 Öğrencilerim</h1>
      
      <div style={grid}>
        <Box title="Toplam Benzersiz Öğrenci" value={stats.totalStudents} icon="👥" />
        <Box title="Aktif Takip Edilen" value={stats.activeStudents} icon="✨" />
      </div>

      <div style={{ ...cardStyle, marginTop: 28 }}>
        <h3 style={{ ...cardTitleStyle, marginBottom: 20 }}>📋 Öğrenci Profil Listesi</h3>
        
        {students.length === 0 ? (
          <div style={{ textTransform: 'none', textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
            Sistemde henüz adınıza kayıtlı bir öğrenci bulunmuyor.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {students.map((student: any, idx: number) => (
              <div 
                key={idx} 
                style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  background: '#f8fafc',
                  boxShadow: '0 2px 4px rgb(0 0 0 / 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                      {student.adi?.charAt(0).toUpperCase() || 'Ö'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{student.adi}</h4>
                      <span style={{ fontSize: '12px', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                        {student.ders_turu || 'Genel Ders'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>📚 Toplam Alınan Ders:</span>
                    <strong style={{ color: '#0f172a' }}>{student.toplam_ders} Saat</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>📅 Son Ders Tarihi:</span>
                    <strong style={{ color: '#1e40af' }}>
                      {new Date(student.son_ders_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 6. MESSAGES COMPONENT (GÜNCELLENDİ) ---------------- */
function Messages({ userId }: any) {
  const [students, setStudents] = useState<any[]>([]); // İletişim listesi
  const [selectedStudent, setSelectedStudent] = useState<any>(null); // Seçili öğrenci
  const [messages, setMessages] = useState<any[]>([]); // Mesaj geçmişi
  const [text, setText] = useState('');

  useEffect(() => {
    if (!userId) return;
    loadStudents();
  }, [userId]);

  useEffect(() => {
    if (!selectedStudent) return;
    
    loadMessages();
    
    // Canlı mesaj dinleyicisi
    const channel = supabase
      .channel('chat-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mesajlar' }, (payload: any) => {
        const msg = payload.new;
        const isRelevant = (msg.gonderen_id === userId && msg.alici_id === selectedStudent.id) || 
                           (msg.gonderen_id === selectedStudent.id && msg.alici_id === userId);
        
        if (isRelevant) {
          // Eğer mesaj zaten local olarak eklenmediyse (çift eklenmeyi önlemek için kontrol)
          setMessages(prev => {
            const exists = prev.some(m => m.id === msg.id || (m.icerik === msg.icerik && m.gonderen_id === msg.gonderen_id));
            return exists ? prev : [...prev, msg];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStudent, userId]);

  // 🎯 Öğrenci İsimlerini ogrenciler Tablosundan Çeken Akıllı Fonksiyon
  async function loadStudents() {
    const { data, error } = await supabase
      .from('mesajlar')
      .select('gonderen_id, alici_id')
      .or(`gonderen_id.eq.${userId},alici_id.eq.${userId}`);

    if (!data || error) return;
    
    // Kendimiz dışındaki tüm benzersiz kullanıcı ID'lerini toplayalım
    const ids = new Set<string>();
    data.forEach(m => {
      if (m.gonderen_id !== userId) ids.add(m.gonderen_id);
      if (m.alici_id !== userId) ids.add(m.alici_id);
    });
    
    const idList = Array.from(ids);
    if (idList.length === 0) return;

    // Öğrenciler tablosundan bu ID'lere sahip kişilerin gerçek adlarını çekiyoruz
    const { data: ogrenciProfilleri } = await supabase
      .from('ogrenciler')
      .select('user_id, tam_ad')
      .in('user_id', idList);

    // ID'leri gerçek isimlerle eşleştiriyoruz
    const mappedStudents = idList.map(id => {
      const profil = ogrenciProfilleri?.find(p => p.user_id === id);
      return {
        id: id,
        tam_ad: profil?.tam_ad || `Gizli Öğrenci (${id.slice(0, 4)})`
      };
    });

    setStudents(mappedStudents);
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('mesajlar')
      .select('*')
      .or(`and(gonderen_id.eq.${userId},alici_id.eq.${selectedStudent.id}),and(gonderen_id.eq.${selectedStudent.id},alici_id.eq.${userId})`)
      .order('olusturulma_tarihi', { ascending: true });
    setMessages(data || []);
  }

  // 🎯 Mesajın Ekranda Kaybolmasını Engelleyen Gönderme Fonksiyonu
  async function send() {
    if (!text || !selectedStudent) return;
    
    const mesajIcerigi = text;
    
    // Mesajı Supabase'e göndermeden ÖNCE ekrana anında yazdırıyoruz
    // DÜZELTME YAPILDI: "anlikMesajTaslagi" bitişik yazıldı
    const anlikMesajTaslagi = {
      gonderen_id: userId,
      alici_id: selectedStudent.id,
      icerik: mesajIcerigi,
      olusturulma_tarihi: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, anlikMesajTaslagi]);
    setText(''); // Giriş kutusunu hemen temizle

    // Şimdi arka planda sessizce Supabase'e kaydediyoruz
    const { error } = await supabase
      .from('mesajlar')
      .insert({ gonderen_id: userId, alici_id: selectedStudent.id, icerik: mesajIcerigi });

    if (error) {
      alert("Mesaj iletilemedi: " + error.message);
      // Eğer veritabanı kaydı başarısız olursa ekrandan geri siliyoruz
      setMessages(prev => prev.filter(m => m !== anlikMesajTaslagi));
      setText(mesajIcerigi);
    }
  }

  return (
    <div style={{ display: 'flex', height: '72vh', gap: 20, background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
      {/* SOL MENÜ: KİŞİ LİSTESİ */}
      <div style={{ width: 280, borderRight: '1px solid #f1f5f9', paddingRight: 16, overflowY: 'auto' }}>
        <div style={{ padding: '0 0 12px 4px', fontWeight: 700, fontSize: 16, color: '#0f172a' }}>👨‍🎓 Mesajlaştığım Öğrenciler</div>
        {students.map((s, i) => (
          <div key={i} onClick={() => setSelectedStudent(s)} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6, transition: 'all 0.2s', background: selectedStudent?.id === s.id ? '#eff6ff' : 'transparent' }}>
            {/* BURADA ARTIK GERÇEK İSİM YAZIYOR */}
            <div style={{ fontWeight: 600, color: selectedStudent?.id === s.id ? '#2563eb' : '#334155', fontSize: 14 }}>{s.tam_ad}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>ID: {s.id.slice(0, 8)}...</div>
          </div>
        ))}
      </div>
      
      {/* SAĞ MENÜ: SOHBET PENCERESİ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingBottom: 12, borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b' }}>
          {selectedStudent ? `💬 Aktif Sohbet: ${selectedStudent.tam_ad}` : 'Lütfen soldan bir sohbet seçin'}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {messages.map((m, i) => {
            const isMe = m.gonderen_id === userId;
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                <div style={{ maxWidth: '65%', padding: '10px 16px', borderRadius: 14, fontSize: 14, lineHeight: 1.5, background: isMe ? '#2563eb' : '#f1f5f9', color: isMe ? 'white' : '#1e293b' }}>{m.icerik}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Mesajınızı yazın..." style={{ flex: 1, padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', fontSize: 14 }} />
          <button onClick={send} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Gönder</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 7. EARNINGS COMPONENT ---------------- */
function Earnings({ profile, stats }: any) {
  const tahminiKazanc = (stats.completedLessons || 0) * (profile?.saatlik_ucret || 0);
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 0, marginRight: 0, marginBottom: 24, marginLeft: 0 }}>💰 Kazançlar</h1>
      <div style={grid}>
        <Box title="Toplam Kazanılan Tutar" value={`${tahminiKazanc} TL`} icon="💎" />
        <Box title="Tamamlanan Toplam Ders" value={`${stats.completedLessons} Saat`} />
        <Box title="Mevcut Saatlik Ücret" value={`${profile?.saatlik_ucret || 0} TL`} />
      </div>
    </div>
  );
}

/* ---------------- 8. SETTINGS COMPONENT ---------------- */
function Settings({ profile, userId, onProfileUpdate }: any) {
  const localInputStyle = { 
    width: "100%", 
    padding: '12px', 
    border: "1px solid #e2e8f0", 
    borderRadius: '10px', 
    outline: "none", 
    fontSize: '14px', 
    color: '#0f172a', 
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s',
    marginTop: '4px'
  };

  const [name, setName] = useState(profile?.tam_ad || "");
  const [bio, setBio] = useState(profile?.biyografi || "");
  const [price, setPrice] = useState(profile?.saatlik_ucret || 250);
  const [subject, setSubject] = useState(profile?.ders_turu || "Türkçe (Yabancılar İçin)");
  const [konum, setKonum] = useState(profile?.konum || "Ankara, Türkiye");
  const [egitim, setEgitim] = useState(profile?.egitim || "Gazi Üniversitesi (Ph.D. Adayı)");
  const [diller, setDiller] = useState(profile?.diller || "Türkçe (Ana Dil)");
  const [metodoloji, setMetodoloji] = useState(profile?.metodoloji || "");
  const [videoUrl, setVideoUrl] = useState(profile?.video_url || "");
  
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.tam_ad || "");
      setBio(profile.biyografi || "");
      setPrice(profile.saatlik_ucret || 250);
      setSubject(profile.ders_turu || "Türkçe (Yabancılar İçin)");
      setKonum(profile.konum || "Ankara, Türkiye");
      setEgitim(profile.egitim || "Gazi Üniversitesi (Ph.D. Adayı)");
      setDiller(profile.diller || "Türkçe (Ana Dil)");
      setMetodoloji(profile.metodoloji || "");
      setAvatarUrl(profile.avatar_url || "");
      setVideoUrl(profile.video_url || "");
    }
  }, [profile]);

  async function handleAvatarUpload(event: any) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Lütfen yüklemek için bir resim dosyası seçin.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      alert("Fotoğraf başarıyla yüklendi! Değişikliklerin kalıcı olması için alttaki 'Değişiklikleri Kaydet' butonuna basmayı unutmayın.");
    } catch (error: any) {
      alert('Resim yüklenirken hata oluştu: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!userId) return alert("Kullanıcı oturumu bulunamadı.");
    try {
      setSaving(true);
      const updateData = {
        user_id: userId,
        tam_ad: name,
        biyografi: bio,
        saatlik_ucret: Number(price),
        ders_turu: subject,
        konum: konum,
        egitim: egitim,
        diller: diller,
        metodoloji: metodoloji,
        avatar_url: avatarUrl,
        video_url: videoUrl
      };

      let error;
      if (profile?.id) {
        const { error: err } = await supabase.from('egitmenler').update(updateData).eq('user_id', userId);
        error = err;
      } else {
        const { error: err } = await supabase.from('egitmenler').insert([updateData]);
        error = err;
      }

      if (error) throw error;
      alert("Değişiklikler başarıyla kaydedildi!");
      onProfileUpdate();
    } catch (err: any) {
      console.error(err);
      alert("Hata: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 0, marginRight: 0, marginBottom: 24, marginLeft: 0, letterSpacing: '-0.75px' }}>⚙️ Ayarlar</h1>
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: 0, marginRight: 0, marginBottom: 20, marginLeft: 0 }}>👤 Profil Ayarları</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: '#e2e8f0',
              backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: '#64748b',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              {!avatarUrl && '📷'}
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: '4px' }}>Profil Fotoğrafı</label>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b' }}>JPEG veya PNG formatında profesyonel bir fotoğraf yükleyin.</p>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                disabled={uploading} 
                style={{ fontSize: '13px', color: '#475569' }}
              />
              {uploading && <span style={{ fontSize: '12px', color: '#2563eb', marginLeft: '10px', fontWeight: 600 }}>Yükleniyor...</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Ad Soyad</label>
                <input value={name} onChange={(e) => setName(e.target.value)} style={localInputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Uzmanlık / Ders Türü</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} style={localInputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>📍 Konum (Şehir, Ülke)</label>
                <input value={konum} onChange={(e) => setKonum(e.target.value)} style={localInputStyle} />
              </div>
              <div>
                <label style={labelStyle}>🎓 Eğitim / Akademik Ünvan</label>
                <input value={egitim} onChange={(e) => setEgitim(e.target.value)} style={localInputStyle} />
              </div>
              <div>
                <label style={labelStyle}>🗣️ Konuştuğu Diller</label>
                <input value={diller} onChange={(e) => setDiller(e.target.value)} style={localInputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Saatlik Ücret (TL)</label>
                <input value={price} type="number" onChange={(e) => setPrice(Number(e.target.value))} style={localInputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>🎬 Tanıtım Videosu (YouTube Linki)</label>
              <input 
                value={videoUrl} 
                onChange={(e) => setVideoUrl(e.target.value)} 
                placeholder="Örn: https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                style={localInputStyle} 
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Öğrencilerin sesinizi ve hitabetinizi duyabilmesi için profesyonel bir YouTube tanıtım video linki ekleyin.
              </span>
            </div>

            <div>
              <label style={labelStyle}>📝 Hakkımda (Biyografi)</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} style={{ ...localInputStyle, height: 100, resize: 'vertical' }} />
            </div>

            <div>
              <label style={labelStyle}>🎯 Öğretim Yaklaşımı & Metodoloji</label>
              <textarea value={metodoloji} onChange={(e) => setMetodoloji(e.target.value)} placeholder="Derslerinizi hangi yaklaşımlarla ve materyallerle işliyorsunuz?" style={{ ...localInputStyle, height: 100, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          marginTop: 28, width: "100%", padding: 14, borderRadius: 10, border: "none",
          background: saving ? "#94a3b8" : "#2563eb", color: "white", fontWeight: 600, fontSize: 15, cursor: saving ? "default" : "pointer", transition: 'all 0.2s'
        }}>
          {saving ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- REUSABLE BÖLÜMLER (UI COMPONENTS) ---------------- */
function Box({ title, value, icon, color, textColor }: any) {
  return (
    <div style={{
      background: color || 'white',
      padding: '24px',
      borderRadius: '16px',
      border: color ? 'none' : '1px solid #e2e8f0',
      boxShadow: color ? 'none' : '0 1px 3px 0 rgb(0 0 0 / 0.05)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: textColor || '#64748b', marginBottom: '6px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: textColor || '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
      </div>
      {icon && <div style={{ fontSize: '24px', opacity: 0.8 }}>{icon}</div>}
    </div>
  );
}

const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' };
const cardStyle = { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' };
const cardTitleStyle = { fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: 0, marginRight: 0, marginBottom: 16, marginLeft: 0 };
const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' };