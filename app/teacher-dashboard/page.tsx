'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// =========================================================
// 🚀 DİNAMİK CANLI DERS BUTONU VE ZAMANLAYICI (TIMER) HOOK'U
// =========================================================
function useDersAktifMi(dersTarihiISO: string, dersSuresiDakika: number = 60) {
  const [isAktif, setIsAktif] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState("Zaman Hesaplanıyor...");

  useEffect(() => {
    if (!dersTarihiISO) return;

    const kontrolEt = () => {
      const suAn = new Date();
      const dersBaslangic = new Date(dersTarihiISO);

      // Aktifleşme: Dersin başlamasına 15 dakika kala
      const aktiflesmeZamani = new Date(dersBaslangic.getTime() - 15 * 60000);

      // Kapanma: Dersin başlangıcından itibaren (Ders Süresi + 15 dakika opsiyon) sonra
      const kapanmaZamani = new Date(dersBaslangic.getTime() + (dersSuresiDakika + 15) * 60000);

      if (suAn < aktiflesmeZamani) {
        setIsAktif(false);
        setDurumMesaji("Henüz Başlamadı");
      } else if (suAn > kapanmaZamani) {
        setIsAktif(false);
        setDurumMesaji("Süresi Doldu");
      } else {
        setIsAktif(true);
        setDurumMesaji("Canlı Derse Katıl");
      }
    };

    kontrolEt(); // Bileşen yüklendiğinde anında kontrol et
    const interval = setInterval(kontrolEt, 10000); // Sayfa yenilenmeden her 10 saniyede bir saati kontrol et

    return () => clearInterval(interval);
  }, [dersTarihiISO, dersSuresiDakika]);

  return { isAktif, durumMesaji };
}

// 🚀 AKILLI BUTON BİLEŞENİ (Artık Dışarıdan Almaya Gerek Yok)
function AkilliCanliDersButonu({ dersId, tarihSaat }: { dersId: string, tarihSaat: string }) {
  const router = useRouter();
  const { isAktif, durumMesaji } = useDersAktifMi(tarihSaat, 60); // 60 dakikalık ders süresi baz alınmıştır

  if (isAktif) {
    return (
      <button 
        onClick={() => router.push(`/ders-odasi/${dersId}`)} 
        style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"/><rect x="3" y="6" width="12" height="12" rx="2" ry="2"/></svg>
        {durumMesaji}
      </button>
    );
  }

  return (
    <button 
      disabled 
      style={{ background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}
      title="Oda dersin başlamasına 15 dakika kala açılır."
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      {durumMesaji}
    </button>
  );
}

// =========================================================
// 🚀 KURŞUN GEÇİRMEZ VERİ AYIKLAYICILAR (PARSERS)
// =========================================================
function parseKonum(konum: any) {
  if (!konum) return { ulke: '', sehir: '' };
  if (typeof konum === 'object') return { ulke: konum.ulke || '', sehir: konum.sehir || '' };
  const str = String(konum);
  if (str.includes('-')) {
      const parts = str.split('-');
      return { ulke: parts[0]?.trim() || '', sehir: parts[1]?.trim() || '' };
  }
  if (str.includes(',')) {
      const parts = str.split(',');
      return { ulke: parts[1]?.trim() || '', sehir: parts[0]?.trim() || '' };
  }
  return { ulke: str, sehir: '' };
}

function parseEgitim(egitim: any) {
  if (!egitim) return { seviye: '', okul: '' };
  if (typeof egitim === 'object') return { seviye: egitim.seviye || egitim.egitim_seviyesi || '', okul: egitim.okul || egitim.universite || '' };
  const str = String(egitim);
  if (str.includes('-')) {
      const parts = str.split('-');
      return { seviye: parts[0]?.trim() || '', okul: parts[1]?.trim() || '' };
  }
  return { seviye: '', okul: str };
}

function parseDiller(diller: any) {
  if (!diller) return { ana: '', diger: [] as string[] };
  let arr: string[] = [];
  if (Array.isArray(diller)) {
      arr = diller;
  } else if (typeof diller === 'string') {
      try { arr = JSON.parse(diller); } 
      catch(e) { arr = diller.replace(/[\[\]{}"']/g, '').split(',').map((s:string) => s.trim()); }
  }
  const ana = arr.find(d => d.includes('(Ana Dil)'))?.replace('(Ana Dil)', '')?.trim() || '';
  const digerList = arr.filter(d => !d.includes('(Ana Dil)')).map(d => d.trim()).filter(Boolean);
  return { ana, diger: digerList };
}

function parseMulti(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
      return val.replace(/[\[\]{}"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export default function TeacherDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [userId, setUserId] = useState('');
  
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const [stats, setStats] = useState({
    totalStudents: 0, totalLessons: 0, completedLessons: 0, upcomingLessons: 0, canceledLessons: 0, activeStudents: 0, computedRating: 'Yükleniyor...'
  });

  const [allLessonsList, setAllLessonsList] = useState<any[]>([]);
  const [upcomingLessonsList, setUpcomingLessonsList] = useState<any[]>([]);
  const [scheduleLessons, setScheduleLessons] = useState<any[]>([]);
  const [myStudentsList, setMyStudentsList] = useState<any[]>([]);

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (userId) { loadTeacherProfile(); loadDashboardStats(); loadUpcomingLessons(); loadUnreadCount(); }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    async function setOnlineStatus() {
      await supabase.from('egitmenler').update({ son_gorulme: new Date().toISOString() }).eq('user_id', userId);
    }
    setOnlineStatus(); 
    const interval = setInterval(setOnlineStatus, 5 * 60 * 1000); 

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesajlar' }, () => {
        if (tab !== 'messages') loadUnreadCount();
      }).subscribe();

    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [userId, tab]);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUserId(data?.user?.id || '');
  }

  async function loadUnreadCount() {
    if (!userId) return;
    const { count, error } = await supabase.from('mesajlar').select('id', { count: 'exact', head: true }).eq('alici_id', userId).eq('okundu', false).neq('gonderen_id', userId);
    if (!error && count !== null) setUnreadMsgCount(count);
  }

  async function loadTeacherProfile() {
    try {
      setLoadingProfile(true);
      const { data } = await supabase.from('egitmenler').select('*').eq('user_id', userId).single();
      if (data) setTeacherProfile(data);
    } catch (err) { console.error(err); } finally { setLoadingProfile(false); }
  }

  async function loadDashboardStats() {
    try {
      const { data: lessonData } = await supabase.from('dersler').select('*').eq('user_id', userId).order('tarih_saat', { ascending: true });
      const safeLessons = lessonData || []; setAllLessonsList(safeLessons);

      const uniqueStudentsMap = new Map();
      safeLessons.forEach(lesson => {
        if (lesson.ogrenci_adi) {
          const key = lesson.ogrenci_adi.trim();
          if (!uniqueStudentsMap.has(key)) { uniqueStudentsMap.set(key, { adi: lesson.ogrenci_adi, ders_turu: lesson.ders_turu, toplam_ders: 0, son_ders_tarihi: lesson.tarih_saat }); }
          const student = uniqueStudentsMap.get(key);
          student.toplam_ders += 1;
          if (new Date(lesson.tarih_saat) > new Date(student.son_ders_tarihi)) student.son_ders_tarihi = lesson.tarih_saat;
        }
      });
      const processedStudents = Array.from(uniqueStudentsMap.values()); setMyStudentsList(processedStudents);
      const completedCount = safeLessons.filter(l => l.durum === 'Tamamlanan').length;
      const upcomingCount = safeLessons.filter(l => l.durum === 'Yaklaşan').length;
      const canceledCount = safeLessons.filter(l => l.durum === 'İptal Edilen').length;

      const { data: dersYorumlari } = await supabase.from('dersler').select('puan').eq('user_id', userId).not('puan', 'is', null);
      const { data: digerYorumlar } = await supabase.from('yorumlar').select('puan').eq('egitmen_id', userId);
      const tumPuanlar = [...(dersYorumlari || []).map(y => Number(y.puan)), ...(digerYorumlar || []).map(y => Number(y.puan))].filter(p => p > 0 && p <= 5);
      const computedRating = tumPuanlar.length > 0 ? (tumPuanlar.reduce((a, b) => a + b, 0) / tumPuanlar.length).toFixed(1) : 'Yeni';

      setStats({ totalStudents: processedStudents.length, totalLessons: safeLessons.length, completedLessons: completedCount, upcomingLessons: upcomingCount, canceledLessons: canceledCount, activeStudents: processedStudents.length, computedRating: computedRating });
    } catch (err) { console.error("İstatistikler yüklenirken hata:", err); }
  }

  async function loadUpcomingLessons() {
    const { data } = await supabase.from('dersler').select('*').order('tarih_saat', { ascending: true });
    const myLessons = data?.filter(d => String(d.egitmen_id || d.user_id).trim() === String(userId).trim()) || [];
    setUpcomingLessonsList(myLessons.filter(d => d.durum === 'Yaklaşan').slice(0, 5)); setScheduleLessons(data || []);
  }

  async function handleCompleteLesson(dersId: string) { try { await supabase.from('dersler').update({ durum: 'Tamamlanan' }).eq('id', dersId); loadDashboardStats(); loadUpcomingLessons(); } catch (err: any) { alert("Hata: " + err.message); } }
  async function handleCancelLesson(dersId: string) { if (!confirm("Emin misiniz?")) return; try { await supabase.from('dersler').update({ durum: 'İptal Edilen' }).eq('id', dersId); loadDashboardStats(); loadUpcomingLessons(); } catch (err: any) { alert("Hata: " + err.message); } }
  
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  const menu = [
    { key: 'dashboard', label: 'Genel Bakış', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> },
    { key: 'profile', label: 'Profil Görünümü', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> },
    { key: 'messages', 
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          Mesajlar Merkezi
          {unreadMsgCount > 0 && (
            <span style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
              +{unreadMsgCount}
            </span>
          )}
        </div>
      ), 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg> 
    },
    { key: 'lessons', label: 'Ders Kayıtları', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
    { key: 'schedule', label: 'Çalışma Saatlerim', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { key: 'students', label: 'Öğrencilerim', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { key: 'earnings', label: 'Kazançlar', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { key: 'settings', label: 'Profil Ayarları', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> }
  ];

  return (
    <div style={layout}>
      <aside style={{ width: '280px', background: '#0f172a', color: '#94a3b8', padding: '32px 24px', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, borderRight: '1px solid #1e293b' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, paddingLeft: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', margin: 0 }}>Turkish Learning<br /><span style={{ color: '#818cf8', fontSize: 13, fontWeight: 600 }}>Academy</span></h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {menu.map(m => {
              const isActive = tab === m.key;
              return (
                <div key={m.key} onClick={() => setTab(m.key)} style={{ padding: '12px 16px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 600 : 500, color: isActive ? '#ffffff' : '#94a3b8', background: isActive ? '#1e293b' : 'transparent', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 12 }} onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.color = '#e2e8f0'; }} onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.color = '#94a3b8'; }}>
                  <div style={{ color: isActive ? '#818cf8' : '#64748b', display: 'flex', alignItems: 'center' }}>{m.icon}</div><div style={{ flex: 1 }}>{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: '24px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'relative', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>Eğitmen Yönetim Paneli</span>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>
              {tab === 'dashboard' && `Hoş geldin, ${teacherProfile?.tam_ad?.split(' ')[0] || "Eğitmen"} 👋`}
              {tab === 'profile' && 'Profil Görünümü'}
              {tab === 'settings' && 'Profil Ayarları'}
              {tab === 'lessons' && 'Ders Kayıtları'}
              {tab === 'schedule' && 'Çalışma Saatlerim'}
              {tab === 'students' && 'Öğrencilerim'}
              {tab === 'messages' && 'Mesajlaşma Merkezi'}
              {tab === 'earnings' && 'Kazanç Raporu'}
            </h1>
          </div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.1)', padding: '6px 16px 6px 6px', borderRadius: 30, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, overflow: 'hidden' }}>{teacherProfile?.avatar_url ? <img src={teacherProfile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profil" /> : (teacherProfile?.tam_ad?.charAt(0).toUpperCase() || 'E')}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>{teacherProfile?.tam_ad?.split(' ')[0] || 'Hesabım'}</div>
            </div>
            {isProfileMenuOpen && (
              <><div onClick={() => setIsProfileMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} /><div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, minWidth: 160, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 100 }}><div onClick={handleLogout} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 600, fontSize: 14, cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }}>Çıkış Yap</div></div></>
            )}
          </div>
        </header>

        {loadingProfile && tab !== 'messages' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: 16 }}><div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div><div style={{ fontSize: 15, fontWeight: 500 }}>Bilgileriniz güvenle yükleniyor...</div><style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style></div>
        ) : (
          <div style={{ flex: 1, padding: tab === 'messages' ? '0' : '40px 60px', overflowY: 'auto' }}>
            {tab === 'dashboard' && <Dashboard profile={teacherProfile} stats={stats} upcomingLessons={upcomingLessonsList} userId={userId} onComplete={handleCompleteLesson} onCancel={handleCancelLesson} />}
            {tab === 'profile' && <Profile profile={teacherProfile} stats={stats} />}
            {tab === 'settings' && <Settings profile={teacherProfile} stats={stats} userId={userId} onProfileUpdate={() => { loadTeacherProfile(); loadDashboardStats(); loadUpcomingLessons(); }} />}
            {tab === 'lessons' && <Lessons lessons={allLessonsList} stats={stats} onComplete={handleCompleteLesson} onCancel={handleCancelLesson} />} 
            {tab === 'schedule' && <Schedule profile={teacherProfile} userId={userId} onProfileUpdate={loadTeacherProfile} />}
            {tab === 'students' && <Students students={myStudentsList} stats={stats} />}
            {tab === 'messages' && <Messages userId={userId} onMessageRead={(realUnreadCount?: number) => { if (typeof realUnreadCount === 'number') { setUnreadMsgCount(realUnreadCount); } else { loadUnreadCount(); } }} />}
            {tab === 'earnings' && <Earnings profile={teacherProfile} stats={stats} />}
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------------- LAYOUT STYLES ---------------- */
const layout = { display: 'flex', minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif', background: '#f8fafc', color: '#0f172a' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' };
const cardStyle = { background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' };
const cardTitleStyle = { fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 };
const labelStyle = { fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'block' };

function Box({ title, value, icon, color, textColor }: any) {
  return (
    <div style={{ background: color || 'white', padding: '24px', borderRadius: '20px', border: color ? 'none' : '1px solid #e2e8f0', boxShadow: color ? 'none' : '0 4px 6px -1px rgb(0 0 0 / 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div><div style={{ fontSize: '14px', fontWeight: 600, color: textColor || '#64748b', marginBottom: '8px' }}>{title}</div><div style={{ fontSize: '28px', fontWeight: 900, color: textColor || '#0f172a', letterSpacing: '-0.5px' }}>{value}</div></div>{icon && <div style={{ opacity: 0.9 }}>{icon}</div>}
    </div>
  );
}

/* ---------------- 1. DASHBOARD COMPONENT ---------------- */
function Dashboard({ profile, stats, upcomingLessons, userId, onComplete, onCancel }: any) {
  const summaryRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' };
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={grid}>
        <Box title="Toplam Öğrenci" value={stats.totalStudents} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        <Box title="Toplam Ders" value={stats.totalLessons} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>} />
        <Box title="Saatlik Ücretiniz" value={`${profile?.saatlik_ucret || 0} TL`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <Box title="Ortalama Puan" value={stats.computedRating === 'Yeni' ? 'Yeni' : stats.computedRating} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} />
      </div>

      <div style={{ ...grid, marginTop: 24 }}>
        <Box title="Tamamlanan" value={stats.completedLessons} color="#f0fdf4" textColor="#16a34a" />
        <Box title="Yaklaşan" value={stats.upcomingLessons} color="#eef2ff" textColor="#4f46e5" />
        <Box title="İptal Edilen" value={stats.canceledLessons} color="#fef2f2" textColor="#dc2626" />
        <Box title="Aktif Takip" value={stats.activeStudents} color="#fefce8" textColor="#ca8a04" />
      </div>

      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 32 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <h3 style={cardTitleStyle}>Yaklaşan Ders Planı</h3>
          </div>
          {upcomingLessons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14, border: '1px dashed #cbd5e1', borderRadius: 12 }}>Planlanmış yakın bir dersiniz bulunmuyor.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingLessons.map((lesson: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: 16, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {lesson.ogrenci_adi?.charAt(0).toUpperCase() || 'Ö'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{lesson.ogrenci_adi || "Öğrenci"}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{lesson.ders_turu}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: 14 }}>
                      {new Date(lesson.tarih_saat).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => onCancel(lesson.id)} style={{ background: '#ffffff', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>İptal</button>
                      <button onClick={() => onComplete(lesson.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>Tamamlandı</button>
                      <AkilliCanliDersButonu dersId={lesson.id} tarihSaat={lesson.tarih_saat} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <h3 style={cardTitleStyle}>Hızlı Özet</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontSize: 14, color: '#475569' }}>
            <div style={summaryRow}><span>Toplam Süreç:</span> <strong style={{color: '#0f172a'}}>{stats.totalLessons} Ders</strong></div>
            <div style={summaryRow}><span>Bitirilen:</span> <strong style={{color: '#0f172a'}}>{stats.completedLessons} Saat</strong></div>
            <div style={summaryRow}><span>İptaller:</span> <strong style={{color: '#dc2626'}}>{stats.canceledLessons} Adet</strong></div>
            <div style={summaryRow}>
              <span>Profil Durumu:</span> 
              <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#16a34a', borderRadius: 12, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Aktif
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 2. PROFILE COMPONENT ---------------- */
function Profile({ profile, stats }: any) {
  
  const getSafeKonum = (konum: any) => {
    if (!konum) return "Türkiye"; 
    if (typeof konum === 'object') {
      const u = konum.ulke || '';
      const s = konum.sehir || '';
      return (u && s) ? `${u} - ${s}` : (u || s || "Türkiye");
    }
    if (typeof konum === 'string') {
      if (konum.includes(',')) {
         const parts = konum.split(',');
         return `${parts[1]?.trim() || ''} - ${parts[0]?.trim() || ''}`;
      }
      return konum.replace(/\s*-\s*/, ' - ');
    }
    return "Türkiye";
  };

  const getSafeEgitim = (egitim: any) => {
    if (!egitim) return "Eğitim Belirtilmemiş";
    if (typeof egitim === 'object') {
      const s = egitim.seviye || egitim.egitim_seviyesi || '';
      const o = egitim.okul || egitim.universite || egitim.okul_adi || '';
      return (s && o) ? `${s} - ${o}` : (s || o || "Eğitim Belirtilmemiş");
    }
    if (typeof egitim === 'string') return egitim.replace(/\s*-\s*/, ' - ');
    return "Eğitim Belirtilmemiş";
  };

  let dillerArray: string[] = [];
  if (profile?.diller) {
    try {
      let parsed = profile.diller;
      if (typeof parsed === 'string') {
        parsed = parsed.startsWith('[') || parsed.startsWith('{') ? JSON.parse(parsed) : parsed.split(',');
      }
      if (Array.isArray(parsed)) {
        dillerArray = parsed.map((d:any) => typeof d === 'string' ? d.trim() : String(d)).filter(Boolean);
      }
    } catch(e) {
      dillerArray = String(profile.diller).replace(/[\[\]"']/g, '').split(',').map(d => d.trim()).filter(Boolean);
    }
  }

  const safeKonum = getSafeKonum(profile?.konum);
  const safeEgitim = getSafeEgitim(profile?.egitim);

  const getMulti = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.replace(/[\[\]{}"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const amacArr = getMulti(profile?.amac);
  const odakArr = getMulti(profile?.odak);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)', height: '160px', borderRadius: '24px 24px 0 0', position: 'relative' }}></div>
      <div style={{ background: 'white', borderRadius: '0 0 24px 24px', padding: '0 40px 40px 40px', border: '1px solid #e2e8f0', borderTop: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', marginBottom: '40px', position: 'relative' }}>
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#eef2ff', backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', color: '#4f46e5', fontSize: profile?.avatar_url ? '0px' : '40px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '6px solid white', position: 'absolute', top: '-60px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          {!profile?.avatar_url && (profile?.tam_ad?.charAt(0).toUpperCase() || 'E')}
        </div>
        <div style={{ paddingTop: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.5px' }}>{profile?.tam_ad || "Belirtilmemiş"}</h1>
              {profile?.super_ogretmen && <span style={{ background: '#fefce8', color: '#ca8a04', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, border: '1px solid #fef08a' }}>SÜPER ÖĞRETMEN</span>}
              <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Doğrulanmış
              </span>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#4f46e5', fontSize: '16px', fontWeight: 600 }}>{profile?.ders_turu || "Uzmanlık Belirtilmemiş"}</p>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#64748b', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>{safeKonum}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>{safeEgitim}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/><path d="M7 3.34V5a3 3 0 0 0 3 3v0a2 2 0 0 1 2 2v0c0 1.1.9 2 2v0a2 2 0 0 0 2-2v0c0-1.1.9-2 2-2h3.17"/><path d="M11 21.95V18a2 2 0 0 0-2-2v0a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/><circle cx="12" cy="12" r="10"/></svg>
                {dillerArray.length > 0 ? dillerArray.join(', ') : "Dil Yok"}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', background: '#f8fafc', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', minWidth: '180px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Saatlik Ücret</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>{profile?.saatlik_ucret || 0} TL</div>
            <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{stats?.computedRating === 'Yeni' ? 'Yeni Eğitmen' : `${stats.computedRating} Ort.`}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg><h3 style={cardTitleStyle}>Hakkımda</h3></div>
            <p style={{ color: '#475569', lineHeight: 1.8, fontSize: '15px', margin: 0, whiteSpace: 'pre-line' }}>{profile?.biyografi || "Henüz bir tanıtım metni doldurulmamış."}</p>
          </div>
          
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg><h3 style={cardTitleStyle}>Öğretim Yaklaşımı & Metodoloji</h3></div>
            <p style={{ color: '#475569', lineHeight: 1.8, fontSize: '15px', margin: 0, whiteSpace: 'pre-line' }}>{profile?.metodoloji || "Öğretim metodolojisi belirtilmemiş."}</p>
          </div>
          
          {(amacArr.length > 0 || odakArr.length > 0) && (
            <div style={cardStyle}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><h3 style={cardTitleStyle}>Uzmanlık & Odak Alanları</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px', color: '#475569' }}>
                {amacArr.length > 0 && (<div><strong style={{ color: '#0f172a', display: 'block', marginBottom: 4 }}>Hedeflenen Amaçlar:</strong> {amacArr.join(', ')}</div>)}
                {odakArr.length > 0 && (<div><strong style={{ color: '#0f172a', display: 'block', marginBottom: 4 }}>Ders Odak Noktası:</strong> {odakArr.join(', ')}</div>)}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ width: '100%', height: '240px', backgroundColor: '#0f172a', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', position: 'relative' }}>
            {profile?.video_url ? (
              <iframe 
                src={(() => {
                  const url = profile.video_url;
                  if (!url) return '';
                  let videoId = '';
                  if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
                  else if (url.includes('youtube.com/watch')) videoId = new URLSearchParams(new URL(url).search).get('v') || '';
                  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
                })()} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                allowFullScreen 
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                <div style={{ width: '64px', height: '64px', background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#818cf8' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>
                </div>
                <span style={{ fontWeight: 600 }}>Tanıtım videosu bulunmuyor</span>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ ...cardTitleStyle, marginBottom: '24px' }}>Eğitim İstatistikleri</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}><span style={{ color: '#64748b' }}>Toplam Öğrenci:</span><strong style={{ color: '#0f172a' }}>{stats.totalStudents} Kişi</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}><span style={{ color: '#64748b' }}>Verilen Toplam Ders:</span><strong style={{ color: '#0f172a' }}>{stats.totalLessons} Saat</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}><span style={{ color: '#64748b' }}>Cevaplama Hızı:</span><strong style={{ color: '#16a34a' }}>%100 (Anında)</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}><span style={{ color: '#64748b' }}>Hesap Durumu:</span><span style={{ padding: '4px 10px', background: '#eef2ff', color: '#4f46e5', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>Aktif</span></div>
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      <div style={grid}>
        <Box title="Toplam Planlama" value={`${stats.totalLessons} Ders`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>} />
        <Box title="Kazanmaya Hazır (Yaklaşan)" value={`${stats.upcomingLessons} Saat`} color="#eef2ff" textColor="#4f46e5" />
        <Box title="Arşivlenen (Tamamlanan)" value={`${stats.completedLessons} Saat`} color="#f0fdf4" textColor="#16a34a" />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '40px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
        {(['all', 'upcoming', 'completed'] as const).map(tabKey => {
          const labels = { all: 'Tüm Dersler', upcoming: 'Yaklaşan Dersler', completed: 'Geçmiş Dersler' };
          const isSelected = activeSubTab === tabKey;
          return (
            <button key={tabKey} onClick={() => setActiveSubTab(tabKey)} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: isSelected ? '#0f172a' : '#f1f5f9', color: isSelected ? 'white' : '#64748b', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>{labels[tabKey]}</button>
          );
        })}
      </div>
      <div style={{ ...cardStyle, marginTop: '24px', padding: 0, overflow: 'hidden' }}>
        {filteredLessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '15px' }}>Seçilen filtreye uygun herhangi bir ders kaydı bulunamadı.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Öğrenci Adı</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Ders Türü</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Tarih & Saat</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Ücret</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Durum / İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((lesson: any, idx: number) => {
                const isCompleted = lesson.durum === 'Tamamlanan';
                const statusBg = isCompleted ? '#dcfce7' : (lesson.durum === 'İptal Edilen' ? '#fef2f2' : '#eef2ff');
                const statusColor = isCompleted ? '#16a34a' : (lesson.durum === 'İptal Edilen' ? '#dc2626' : '#4f46e5');
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '20px 24px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                      {lesson.ogrenci_adi}
                    </td>
                    <td style={{ padding: '20px 24px', color: '#475569' }}>{lesson.ders_turu}</td>
                    <td style={{ padding: '20px 24px', color: '#0f172a', fontWeight: 500 }}>{new Date(lesson.tarih_saat).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '20px 24px', fontWeight: 700, color: '#0f172a' }}>{lesson.ucret || 0} TL</td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ background: statusBg, color: statusColor, padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, display: 'inline-block' }}>{lesson.durum}</span>
                        {lesson.durum === 'Yaklaşan' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => onComplete(lesson.id)} title="Dersi Tamamla" style={{ background: '#10b981', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></button>
                            <button onClick={() => onCancel(lesson.id)} title="Dersi İptal Et" style={{ background: '#ef4444', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                            <AkilliCanliDersButonu dersId={lesson.id} tarihSaat={lesson.tarih_saat} />
                          </div>
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

/* ---------------- 4. SCHEDULE COMPONENT ---------------- */
function Schedule({ profile, userId, onProfileUpdate }: any) {
  const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile?.musait_olmayan_saatler) setBlockedSlots(profile.musait_olmayan_saatler); }, [profile]);

  const toggleSlot = (day: string, hour: string) => {
    const slotKey = `${day}-${hour}`;
    setBlockedSlots((prev) => prev.includes(slotKey) ? prev.filter(slot => slot !== slotKey) : [...prev, slotKey]);
  };

  const resetAll = () => { if(confirm("Tüm saatleri müsait olarak işaretlemek istiyor musunuz?")) setBlockedSlots([]); };

  const handleSave = async () => {
    if (!profile?.id) return alert("⚠️ Önce 'Ayarlar' sekmesinden profil bilgilerinizi bir kez kaydedin ki sistem sizi tanısın!");
    try {
      setSaving(true);
      const { error } = await supabase.from('egitmenler').update({ musait_olmayan_saatler: blockedSlots }).eq('user_id', userId);
      if (error) throw error;
      alert("Müsaitlik durumunuz başarıyla kaydedildi! 🚀 Öğrenciler artık bu saatleri kapalı görecek.");
      if (onProfileUpdate) onProfileUpdate(); 
    } catch (err: any) { alert("Kaydedilirken hata oluştu: " + err.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: '-1px', color: '#0f172a' }}>Çalışma Saatlerim</h1>
          <p style={{ color: '#64748b', fontSize: 15, marginTop: 8 }}>Ders vermek <strong>istediğiniz</strong> saatleri yeşil, <strong>müsait olmadığınız</strong> saatleri kırmızı yapmak için kutulara tıklayın.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={resetAll} style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '12px 20px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-5.67"/></svg>Hepsini Temizle</button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? '#94a3b8' : '#4f46e5', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: saving ? 'default' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</button>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '700px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <tr>
                <th style={{ padding: '20px 15px', background: '#f8fafc', borderBottom: '2px solid #cbd5e1', borderRight: '1px solid #e2e8f0', width: '80px', color: '#64748b', fontSize: 14, fontWeight: 600 }}>Saat</th>
                {DAYS.map(day => <th key={day} style={{ padding: '20px 15px', background: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{day}</th>)}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td style={{ padding: '12px', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: 13, position: 'sticky', left: 0, zIndex: 5 }}>{hour}</td>
                  {DAYS.map(day => {
                    const slotKey = `${day}-${hour}`;
                    const isBlocked = blockedSlots.includes(slotKey);
                    return (
                      <td key={slotKey} onClick={() => toggleSlot(day, hour)} style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', background: isBlocked ? '#fef2f2' : '#f0fdf4', cursor: 'pointer', transition: 'all 0.1s ease', height: '48px' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                        {isBlocked ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>}
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      <div style={grid}>
        <Box title="Toplam Öğrenci" value={stats.totalStudents} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        <Box title="Aktif Takip Edilen" value={stats.activeStudents} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} />
      </div>
      <div style={{ ...cardStyle, marginTop: 32 }}>
        <h3 style={{ ...cardTitleStyle, marginBottom: 24, fontSize: 18 }}>Öğrenci Profil Listesi</h3>
        {students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 15, border: '1px dashed #cbd5e1', borderRadius: 16 }}>Sistemde henüz adınıza kayıtlı bir öğrenci bulunmuyor.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {students.map((student: any, idx: number) => (
              <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px' }}>{student.adi?.charAt(0).toUpperCase() || 'Ö'}</div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{student.adi}</h4>
                      <span style={{ fontSize: '12px', color: '#4f46e5', background: '#eef2ff', padding: '4px 10px', borderRadius: '8px', fontWeight: 600, display: 'inline-block', marginTop: '6px' }}>{student.ders_turu || 'Genel Ders'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Toplam Alınan Ders:</span><strong style={{ color: '#0f172a' }}>{student.toplam_ders} Saat</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Son Ders Tarihi:</span><strong style={{ color: '#4f46e5' }}>{new Date(student.son_ders_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 6. MESSAGES COMPONENT ---------------- */
function Messages({ userId, onMessageRead }: any) {
  const [students, setStudents] = useState<any[]>([]); 
  const [selectedStudent, setSelectedStudent] = useState<any>(null); 
  const [messages, setMessages] = useState<any[]>([]); 
  const [text, setText] = useState('');
  
  const [showChatMenu, setShowChatMenu] = useState(false);

  useEffect(() => { if (!userId) return; loadStudents(); }, [userId]);
  
  useEffect(() => {
    if (!selectedStudent || !userId) return;

    const fetchAndMarkMessages = async () => {
      const { data: updateData, error: updateError } = await supabase
        .from('mesajlar')
        .update({ okundu: true })
        .eq('alici_id', userId)
        .eq('gonderen_id', selectedStudent.id)
        .eq('okundu', false)
        .select();
        
      if (updateError) {
        console.error("Supabase Okundu Yapma Hatası:", updateError.message);
      }
        
      loadStudents();

      const { data } = await supabase
        .from('mesajlar')
        .select('*')
        .or(`and(gonderen_id.eq.${userId},alici_id.eq.${selectedStudent.id}),and(gonderen_id.eq.${selectedStudent.id},alici_id.eq.${userId})`)
        .order('olusturulma_tarihi', { ascending: true });
      
      setMessages(data || []);
    };

    fetchAndMarkMessages();

    const channel = supabase.channel('chat-room').on('postgres_changes', { event: '*', schema: 'public', table: 'mesajlar' }, async (payload: any) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const msg = payload.new;
        const isRelevant = (msg.gonderen_id === userId && msg.alici_id === selectedStudent.id) || (msg.gonderen_id === selectedStudent.id && msg.alici_id === userId);
        
        if (isRelevant) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === msg.id || (m.icerik === msg.icerik && m.gonderen_id === msg.gonderen_id && !m.id));
            if (exists) return prev.map(m => (m.id === msg.id || (m.icerik === msg.icerik && m.gonderen_id === msg.gonderen_id && !m.id)) ? msg : m);
            return [...prev, msg];
          });

          if (msg.alici_id === userId && msg.gonderen_id === selectedStudent.id && !msg.okundu) {
            const { error: liveUpdateError } = await supabase.from('mesajlar').update({ okundu: true }).eq('id', msg.id);
            if (liveUpdateError) console.error("Canlı Mesaj Okundu Hatası:", liveUpdateError.message);
            loadStudents();
          }
        }
      }
      else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id;
        setMessages(prev => prev.filter(m => m.id !== deletedId));
      }
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedStudent, userId]);

  async function loadStudents() {
    const { data, error } = await supabase.from('mesajlar').select('gonderen_id, alici_id, okundu').or(`gonderen_id.eq.${userId},alici_id.eq.${userId}`);
    if (!data || error) return;
    
    const ids = new Set<string>();
    const unreadMap = new Map<string, number>();
    let totalRealUnread = 0; 

    data.forEach(m => { 
      const isMeSender = m.gonderen_id === userId;
      const otherId = isMeSender ? m.alici_id : m.gonderen_id;
      if (otherId) ids.add(otherId); 
      if (!isMeSender && !m.okundu && otherId) {
        unreadMap.set(otherId, (unreadMap.get(otherId) || 0) + 1);
        totalRealUnread++;
      }
    });

    if (onMessageRead) onMessageRead(totalRealUnread);

    const idList = Array.from(ids);
    if (idList.length === 0) return;
    
    const { data: ogrenciProfilleri } = await supabase.from('ogrenciler').select('user_id, tam_ad').in('user_id', idList);
    const mappedStudents = idList.map(id => {
      const profil = ogrenciProfilleri?.find(p => p.user_id === id);
      return { id: id, tam_ad: profil?.tam_ad || `Platform Öğrencisi`, unread: unreadMap.get(id) || 0 };
    });

    mappedStudents.sort((a, b) => b.unread - a.unread);
    setStudents(mappedStudents);
  }

  const forceMarkAllAsRead = async () => {
    await supabase.from('mesajlar').update({ okundu: true }).eq('alici_id', userId).eq('okundu', false);
    loadStudents(); 
  };

  async function send() {
    if (!text.trim() || !selectedStudent) return;
    const mesajIcerigi = text.trim();
    const tempId = `temp-${Date.now()}`;
    const anlikMesajTaslagi = { id: tempId, gonderen_id: userId, alici_id: selectedStudent.id, icerik: mesajIcerigi, olusturulma_tarihi: new Date().toISOString(), okundu: false };
    
    setMessages(prev => [...prev, anlikMesajTaslagi]);
    setText(''); 
    
    const { data, error } = await supabase.from('mesajlar').insert({ gonderen_id: userId, alici_id: selectedStudent.id, icerik: mesajIcerigi, okundu: false }).select().single();
      
    if (error) { 
      alert("Mesaj iletilemedi: " + error.message); 
      setMessages(prev => prev.filter(m => m.id !== tempId)); 
      setText(mesajIcerigi); 
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
  }

  const deleteMessage = async (msgId: string) => {
    if (!msgId || msgId.startsWith('temp-')) return;
    const onay = confirm("Bu mesajı silmek istediğinize emin misiniz?");
    if (!onay) return;
    try {
      const { error } = await supabase.from('mesajlar').delete().eq('id', msgId);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err: any) { alert("Silme hatası: " + err.message); }
  };

  const clearChat = async () => {
    const onay = confirm("Bu kişiyle olan TÜM sohbet geçmişinizi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.");
    if (!onay) return;
    try {
      const { error } = await supabase.from('mesajlar').delete().or(`and(gonderen_id.eq.${userId},alici_id.eq.${selectedStudent.id}),and(gonderen_id.eq.${selectedStudent.id},alici_id.eq.${userId})`);
      if (error) throw error;
      setMessages([]); setSelectedStudent(null); loadStudents(); 
    } catch (err: any) { alert("Sohbet silinemedi: " + err.message); }
  };

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#ffffff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ width: '340px', borderRight: '1px solid #e2e8f0', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Sohbetler
          </div>
          {students.some(s => s.unread > 0) && (
            <button onClick={forceMarkAllAsRead} title="Tümünü Okundu İşaretle" style={{ background: '#eef2ff', border: '1px solid #c7d2fe', padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', color: '#4f46e5', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L7 17l-5-5"/><path d="M22 10l-5.5 5.5"/></svg>
            </button>
          )}
        </div>
        {students.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>Öğrencilerinizden gelen mesajlar burada görünecektir.</div>
        ) : (
          <div style={{ padding: '16px' }}>
            {students.map((s, i) => (
              <div key={i} onClick={() => setSelectedStudent(s)} style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer', marginBottom: '10px', transition: 'all 0.2s', background: selectedStudent?.id === s.id ? '#ffffff' : 'transparent', border: selectedStudent?.id === s.id ? '1px solid #cbd5e1' : '1px solid transparent', boxShadow: selectedStudent?.id === s.id ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: selectedStudent?.id === s.id ? '#eef2ff' : '#e2e8f0', color: selectedStudent?.id === s.id ? '#4f46e5' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{s.tam_ad.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: '2px' }}>{s.tam_ad}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Platform Öğrencisi</div>
                  </div>
                  {s.unread > 0 && <div style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>{s.unread}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, pointerEvents: 'none', backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        {selectedStudent ? (
          <>
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', border: '2px solid #ffffff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>{selectedStudent.tam_ad.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{selectedStudent.tam_ad}</div>
                  <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}><div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div> Aktif ve yanıt bekliyor</div>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowChatMenu(!showChatMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#64748b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>
                {showChatMenu && (
                  <>
                    <div onClick={() => setShowChatMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', minWidth: '160px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 100 }}>
                      <button onClick={() => { clearChat(); setShowChatMenu(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Sohbeti Sil
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 5 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👋</div> Sohbeti başlatmak için bir mesaj gönderin.
                </div>
              )}
              {messages.map((m, i) => {
                const isMe = m.gonderen_id === userId;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%', padding: '14px 20px', borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', fontSize: '0.95rem', lineHeight: 1.6, backgroundColor: isMe ? '#4f46e5' : '#ffffff', color: isMe ? '#ffffff' : '#0f172a', border: isMe ? 'none' : '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}>{m.icerik}</div>
                      <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '8px', color: isMe ? '#c7d2fe' : '#94a3b8', fontWeight: 500, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                        {new Date(m.olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        {isMe && m.id && !m.id.toString().startsWith('temp-') && (
                          <button onClick={() => deleteMessage(m.id)} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} title="Mesajı Sil" onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#a5b4fc'}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ padding: '24px 32px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderTop: '1px solid #f1f5f9', position: 'relative', zIndex: 10 }}>
              <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Mesajınızı yazın... (Göndermek için Enter)" style={{ flex: 1, padding: '16px 20px', borderRadius: '16px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', resize: 'none', height: '60px', fontFamily: 'inherit' }} onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'} onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'} />
                <button type="submit" disabled={!text.trim()} style={{ height: '60px', padding: '0 32px', backgroundColor: text.trim() ? '#4f46e5' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s', boxShadow: text.trim() ? '0 10px 15px -3px rgba(79,70,229,0.3)' : 'none' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Gönder
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', position: 'relative', zIndex: 5 }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>Sohbete Başlayın</h3>
            <p style={{ marginTop: '8px', fontWeight: 500, fontSize: '1rem', color: '#64748b' }}>Öğrencilerinizle iletişime geçmek için soldan bir sohbet seçin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 7. EARNINGS COMPONENT ---------------- */
function Earnings({ profile, stats }: any) {
  const tahminiKazanc = (stats.completedLessons || 0) * (profile?.saatlik_ucret || 0);
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={grid}>
        <Box title="Toplam Kazanılan Tutar" value={`${tahminiKazanc} TL`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} color="#f0fdf4" textColor="#16a34a" />
        <Box title="Tamamlanan Toplam Ders" value={`${stats.completedLessons} Saat`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>} />
        <Box title="Mevcut Saatlik Ücret" value={`${profile?.saatlik_ucret || 0} TL`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
      </div>
    </div>
  );
}

/* ---------------- 8. SETTINGS COMPONENT ---------------- */
function Settings({ profile, stats, userId, onProfileUpdate }: any) {
  const localInputStyle = { width: "100%", padding: '14px 16px', border: "1px solid #cbd5e1", borderRadius: '12px', outline: "none", fontSize: '15px', color: '#0f172a', background: '#ffffff', boxSizing: 'border-box' as const, transition: 'all 0.2s', marginTop: '6px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' };
  const localSelectStyle = { ...localInputStyle, appearance: 'none' as const, backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto', paddingRight: '40px', cursor: 'pointer' };

  const LOCATIONS = ['Türkiye', 'Almanya', 'Amerika Birleşik Devletleri', 'İngiltere', 'Fransa', 'Hollanda', 'Azerbaycan', 'Kuzey Kıbrıs', 'Diğer'];
  const CITIES = ['Adana', 'Ankara', 'Antalya', 'Bursa', 'Diyarbakır', 'Erzurum', 'Eskişehir', 'Gaziantep', 'İstanbul', 'İzmir', 'Kayseri', 'Kocaeli', 'Konya', 'Mersin', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Trabzon', 'Van', 'Diğer'];
  const EDUCATIONS = ['Lise', 'Ön Lisans', 'Lisans', 'Yüksek Lisans', 'Doktora'];
  const LANGUAGES = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 'Arapça', 'Rusça', 'Çince'];

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState(250);
  const [subject, setSubject] = useState("Türkçe Eğitmeni");
  const [metodoloji, setMetodoloji] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [konumUlke, setKonumUlke] = useState("");
  const [konumSehir, setKonumSehir] = useState("");
  const [egitimSeviye, setEgitimSeviye] = useState("");
  const [egitimOkul, setEgitimOkul] = useState("");
  const [anaDil, setAnaDil] = useState("");
  
  const [digerDiller, setDigerDiller] = useState<string[]>([]);
  
  // YENİ: Dinamik Uzmanlık Alanları
  const [uzmanlikGirdisi, setUzmanlikGirdisi] = useState("");
  const [uzmanliklar, setUzmanliklar] = useState<string[]>([]);
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const safeLocations = Array.from(new Set([...LOCATIONS, konumUlke])).filter(Boolean);
  const safeCities = Array.from(new Set([...CITIES, konumSehir])).filter(Boolean);
  const safeEducations = Array.from(new Set([...EDUCATIONS, egitimSeviye])).filter(Boolean);
  const safeLanguages = Array.from(new Set([...LANGUAGES, anaDil, ...digerDiller])).filter(Boolean);

  useEffect(() => {
    if (profile) {
      setName(profile.tam_ad || ""); 
      setBio(profile.biyografi || ""); 
      setPrice(profile.saatlik_ucret || 250); 
      setSubject(profile.ders_turu || "Türkçe Eğitmeni"); 
      setMetodoloji(profile.metodoloji || ""); 
      setAvatarUrl(profile.avatar_url || ""); 
      setVideoUrl(profile.video_url || ""); 
      
      const pKonum = parseKonum(profile.konum);
      setKonumUlke(pKonum.ulke);
      setKonumSehir(pKonum.sehir);

      const pEgitim = parseEgitim(profile.egitim);
      setEgitimSeviye(pEgitim.seviye);
      setEgitimOkul(pEgitim.okul);

      const pDiller = parseDiller(profile.diller);
      setAnaDil(pDiller.ana || "Türkçe");
      setDigerDiller(pDiller.diger);

      // Sadece 'amac' sütununu tek bir uzmanlık listesi olarak kullanıyoruz
      setUzmanliklar(parseMulti(profile.amac));
    }
  }, [profile]);

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  // Uzmanlık Ekleme Fonksiyonu
  const uzmanlikEkle = (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) e.preventDefault();
      const metin = uzmanlikGirdisi.trim();
      if (metin !== '' && !uzmanliklar.includes(metin)) {
          setUzmanliklar([...uzmanliklar, metin]);
          setUzmanlikGirdisi('');
      }
  };

  const uzmanlikSil = (silinecekAlan: string) => {
      setUzmanliklar(uzmanliklar.filter(alan => alan !== silinecekAlan));
  };

  const OptionCheckbox = ({ label, selectedList, setter }: { label: string, selectedList: string[], setter: any }) => {
    const isSelected = selectedList.includes(label);
    return (
      <button type="button" onClick={() => toggleArrayItem(setter, label)} style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease-in-out', backgroundColor: isSelected ? '#eef2ff' : '#ffffff', color: isSelected ? '#4f46e5' : '#475569', border: isSelected ? '1.5px solid #4f46e5' : '1px solid #cbd5e1', boxShadow: isSelected ? '0 2px 6px rgba(79, 70, 229, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '8px', boxSizing: 'border-box' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: isSelected ? 'none' : '1.5px solid #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? '#4f46e5' : 'transparent', flexShrink: 0 }}>
          {isSelected && <span style={{ color: 'white', fontSize: '10px', fontWeight: 800 }}>✓</span>}
        </div>
        <span>{label}</span>
      </button>
    );
  };
  
  async function handleAvatarUpload(event: any) {
    try { setUploading(true); if (!event.target.files || event.target.files.length === 0) throw new Error('Lütfen bir resim seçin.'); const file = event.target.files[0]; const fileExt = file.name.split('.').pop(); const fileName = `${userId}-${Math.random()}.${fileExt}`; const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true }); if (uploadError) throw uploadError; const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName); setAvatarUrl(publicUrl); alert("Fotoğraf yüklendi! Lütfen değişiklikleri kaydedin."); } catch (error: any) { alert('Hata: ' + error.message); } finally { setUploading(false); }
  }
  
  async function handleSave() {
    if (!userId) return alert("Kullanıcı oturumu bulunamadı.");
    try {
      setSaving(true);
      const tamKonum = (konumUlke || konumSehir) ? `${konumUlke.trim()} - ${konumSehir.trim()}` : null;
      const tamEgitim = (egitimSeviye || egitimOkul) ? `${egitimSeviye.trim()} - ${egitimOkul.trim()}` : null;
      const tumDiller = [anaDil ? `${anaDil} (Ana Dil)` : null, ...digerDiller].filter(Boolean);
      
      const updateData = { 
        tam_ad: name, 
        biyografi: bio, 
        saatlik_ucret: Number(price), 
        ders_turu: subject, 
        konum: tamKonum, 
        egitim: tamEgitim, 
        diller: tumDiller, 
        metodoloji: metodoloji, 
        avatar_url: avatarUrl, 
        video_url: videoUrl, 
        amac: uzmanliklar.join(', ') // Tüm etiketleri veritabanındaki 'amac' sütununa kaydediyoruz
      };
      
      const { error } = await supabase.from('egitmenler').update(updateData).eq('user_id', userId);
      if (error) throw error;
      alert("Değişiklikler başarıyla kaydedildi! 🎉 Profilinize anında yansıdı.");
      onProfileUpdate();
    } catch (err: any) { console.error(err); alert("Hata: " + err.message); } finally { setSaving(false); }
  }

  const isTurkiye = konumUlke?.trim().toLowerCase() === 'türkiye';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
          <div style={{ width: '40px', height: '40px', background: '#e0e7ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Profil Bilgileri</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#e2e8f0', backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>{!avatarUrl && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}</div>
            <div>
              <label style={{ ...labelStyle, marginBottom: '6px' }}>Profil Fotoğrafı</label>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}>JPEG veya PNG formatında profesyonel bir fotoğraf yükleyin.</p>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ fontSize: '14px', color: '#475569', cursor: 'pointer' }} />
              {uploading && <span style={{ fontSize: '13px', color: '#4f46e5', marginLeft: '12px', fontWeight: 700 }}>Yükleniyor...</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div><label style={labelStyle}>Ad Soyad</label><input value={name} onChange={(e) => setName(e.target.value)} style={localInputStyle} /></div>
            <div><label style={labelStyle}>Vitrin Metni <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>(Örn: Türkçe Öğretmeni)</span></label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Örn: TÖMER Uzmanı, Türkçe Öğretmeni..." style={localInputStyle} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Konum (Ülke)</label>
                <select value={konumUlke} onChange={(e) => { setKonumUlke(e.target.value); setKonumSehir(""); }} style={localSelectStyle}><option value="" disabled>Ülke Seçiniz...</option>{safeLocations.map((loc:any) => <option key={loc} value={loc}>{loc}</option>)}</select>
              </div>
              <div>
                <label style={labelStyle}>Şehir</label>
                {isTurkiye ? <select value={konumSehir} onChange={(e) => setKonumSehir(e.target.value)} style={localSelectStyle}><option value="" disabled>Şehir Seçiniz...</option>{safeCities.map((city:any) => <option key={city} value={city}>{city}</option>)}</select> : <input value={konumSehir} onChange={(e) => setKonumSehir(e.target.value)} placeholder={konumUlke ? "Şehrinizi yazın..." : "Önce ülke seçiniz..."} style={localInputStyle} disabled={!konumUlke} />}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Eğitim Seviyesi</label>
                <select value={egitimSeviye} onChange={(e) => setEgitimSeviye(e.target.value)} style={localSelectStyle}><option value="" disabled>Seviye Seçiniz...</option>{safeEducations.map((ed:any) => <option key={ed} value={ed}>{ed}</option>)}</select>
              </div>
              <div><label style={labelStyle}>Üniversite / Okul Adı</label><input value={egitimOkul} onChange={(e) => setEgitimOkul(e.target.value)} placeholder="Örn: Gazi Üniversitesi" style={localInputStyle} /></div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Ana Diliniz</label>
              <select value={anaDil} onChange={(e) => { setAnaDil(e.target.value); if (digerDiller.includes(e.target.value)) setDigerDiller(prev => prev.filter(d => d !== e.target.value)); }} style={localSelectStyle}><option value="">-- Ana Dil Seçimini Temizle --</option>{safeLanguages.map((loc:any) => <option key={loc} value={loc}>{loc}</option>)}</select>
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Bildiğiniz Diğer Diller <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>(Birden fazla seçebilirsiniz)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {safeLanguages.filter((l:any) => l !== anaDil).map((dil:any) => (
                  <OptionCheckbox key={dil} label={dil} selectedList={digerDiller} setter={setDigerDiller} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div><label style={labelStyle}>Saatlik Ücret (TL)</label><input value={price} type="number" onChange={(e) => setPrice(Number(e.target.value))} style={localInputStyle} /></div>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ ...labelStyle, marginBottom: '4px', color: '#64748b' }}>Tamamlanan Toplam Ders</label>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>{stats?.completedLessons || 0} Ders</div>
            </div>
          </div>

          {/* DİNAMİK UZMANLIK ALANI BÖLÜMÜ */}
          <div style={{ backgroundColor: '#fffbeb', padding: '24px', borderRadius: '16px', border: '1px solid #fde68a', marginTop: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e', margin: '0 0 16px 0' }}>Uzmanlık Alanları & Etiketler</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#b45309' }}>Öğrencilerin sizi daha kolay bulması için uzmanlık alanlarınızı ekleyin. (Örn: Çocuklar için Türkçe, Diksiyon, İş Türkçesi)</p>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <input 
                      type="text" 
                      value={uzmanlikGirdisi} 
                      onChange={(e) => setUzmanlikGirdisi(e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          uzmanlikEkle();
                        }
                      }}
                      placeholder="Buraya yazın..." 
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.95rem', backgroundColor: '#ffffff' }} 
                  />
                  <button 
                      type="button"
                      onClick={uzmanlikEkle} 
                      style={{ padding: '0 28px', backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b45309'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                  >
                      Ekle
                  </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', minHeight: '32px' }}>
                  {uzmanliklar.map((alan, index) => (
                      <span 
                          key={index} 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                          {alan}
                          <button 
                              type="button"
                              onClick={() => uzmanlikSil(alan)} 
                              style={{ background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}
                          >
                              ×
                          </button>
                      </span>
                  ))}
                  {uzmanliklar.length === 0 && (
                      <span style={{ color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                          Henüz bir uzmanlık alanı eklemediniz.
                      </span>
                  )}
              </div>
          </div>

          <div><label style={labelStyle}>Tanıtım Videosu (YouTube Linki)</label><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Örn: https://www.youtube.com/watch?v=dQw4w9WgXcQ" style={localInputStyle} /></div>
          <div><label style={labelStyle}>Hakkımda (Biyografi)</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} style={{ ...localInputStyle, height: 140, resize: 'vertical' }} /></div>
          <div><label style={labelStyle}>Öğretim Yaklaşımı & Metodoloji</label><textarea value={metodoloji} onChange={(e) => setMetodoloji(e.target.value)} placeholder="Derslerinizi hangi yaklaşımlarla işliyorsunuz?" style={{ ...localInputStyle, height: 140, resize: 'vertical' }} /></div>
        </div>
        
        <button onClick={handleSave} disabled={saving} style={{ marginTop: 40, width: "100%", padding: 18, borderRadius: '16px', border: "none", background: saving ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)", color: "white", fontWeight: 800, fontSize: '1.1rem', cursor: saving ? "default" : "pointer", transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: saving ? 'none' : '0 10px 20px -5px rgba(79, 70, 229, 0.4)' }}>
          {saving ? "Kaydediliyor..." : <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Değişiklikleri Kaydet ve Yayınla</>}
        </button>
      </div>
    </div>
  );
}