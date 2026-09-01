'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('applications'); 
  const [adminId, setAdminId] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const [authChecking, setAuthChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    setAuthChecking(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setAdminId(session.user.id);
    }
    setAuthChecking(false);
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      alert("Giriş başarısız: Lütfen e-posta veya şifrenizi kontrol edin.");
    } else if (data.session) {
      setAdminId(data.session.user.id);
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminId(''); 
  };

  const menu = [
    { key: 'dashboard', label: 'Genel Bakış', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> },
    { key: 'applications', label: 'Başvuru Yönetimi', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { key: 'users', label: 'Kullanıcı Yönetimi', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { key: 'lessons', label: 'Ders Kayıtları', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
    { key: 'blog', label: 'Blog & İçerik Yönetimi', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { key: 'settings', label: 'Sistem Ayarları', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
  ];

  if (authChecking) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', color: '#64748b' }}>Güvenlik kontrolü yapılıyor...</div>;
  }

  if (!adminId) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Yönetici Girişi</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Lütfen yetkili bilgilerinizi giriniz.</p>
          </div>

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>E-posta Adresi</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Şifre</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={loginLoading} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: loginLoading ? '#94a3b8' : '#0f172a', color: '#ffffff', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: loginLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', marginTop: '8px' }}>
              {loginLoading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
      
      <aside style={{ width: '280px', background: '#0f172a', color: '#94a3b8', padding: '32px 24px', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, borderRight: '1px solid #1e293b' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, paddingLeft: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', lineHeight: 1.2, margin: 0 }}>
              Turkish Learning<br /><span style={{ color: '#818cf8', fontSize: 13, fontWeight: 600 }}>Yönetim</span>
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {menu.map(m => {
              const isActive = tab === m.key;
              return (
                <div
                  key={m.key}
                  onClick={() => setTab(m.key)}
                  style={{ padding: '12px 16px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 600 : 500, color: isActive ? '#ffffff' : '#94a3b8', background: isActive ? '#1e293b' : 'transparent', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 12 }}
                  onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.color = '#e2e8f0'; }}
                  onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <div style={{ color: isActive ? '#818cf8' : '#64748b', display: 'flex', alignItems: 'center' }}>{m.icon}</div>
                  <div style={{ flex: 1, display: 'flex' }}>{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        <header style={{ 
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
            padding: '24px 60px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexShrink: 0, 
            position: 'relative', 
            zIndex: 100,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', right: '15%', top: '-50%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)' }}></div>
          </div>
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>
              Sistem Yöneticisi Paneli
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>
              {tab === 'dashboard' && 'Genel İstatistikler'}
              {tab === 'users' && 'Kullanıcı Yönetimi'}
              {tab === 'applications' && 'Başvuru Yönetimi'}
              {tab === 'lessons' && 'Ders Kayıtları & Loglar'}
              {tab === 'blog' && 'Blog & İçerik Yönetimi'}
              {tab === 'settings' && 'Sistem Ayarları'}
            </h1>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.1)', padding: '6px 16px 6px 6px', borderRadius: 30, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>A</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Admin</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="2" style={{ transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            {isProfileMenuOpen && (
              <>
                <div onClick={() => setIsProfileMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, minWidth: 160, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 100 }}>
                  <div 
                    onClick={handleLogout}
                    style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 600, fontSize: 14, cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg> 
                    Çıkış Yap
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px 60px', overflowY: 'auto' }}>
          {tab === 'dashboard' && <DashboardOverview />}
          {tab === 'users' && <UserManagement />}
          {tab === 'applications' && <ApplicationsManagement />}
          {tab === 'lessons' && <LessonsManagement />}
          {tab === 'blog' && <BlogManagement />}
          {tab === 'settings' && <SystemSettings />}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   🚀 DERS YÖNETİMİ VE KAYITLAR BİLEŞENİ
========================================================= */
function LessonsManagement() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Video Oynatıcı Modalı İçin
  const [selectedVideos, setSelectedVideos] = useState<{ url: string, name: string }[] | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // 🚀 Log Görüntüleyici Modalı İçin
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [currentLogs, setCurrentLogs] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [selectedLessonName, setSelectedLessonName] = useState("");

  useEffect(() => {
    loadLessons();
  }, []);

  async function loadLessons() {
    setLoading(true);
    const { data } = await supabase
      .from('dersler')
      .select('*')
      .order('tarih_saat', { ascending: false });

    if (data) setLessons(data);
    setLoading(false);
  }

  async function handleWatch(kayitUrl: string) {
    const paths = kayitUrl.split(',').map(p => p.trim()).filter(Boolean);
    
    // Private bucket'tan 1 saat geçerli link
    const { data, error } = await supabase.storage.from('ders-kayitlari').createSignedUrls(paths, 3600);
    
    if (error || !data) {
      alert("Kayıtlar getirilirken bir hata oluştu.");
      return;
    }
    
    const validUrls = data
      .filter((d: any) => d.signedUrl) 
      .map((d: any, i: number) => ({ url: d.signedUrl as string, name: `Kesit ${i + 1}` })); 
      
    setSelectedVideos(validUrls);
    setActiveVideoIndex(0);
  }

  // 🚀 Ders Loglarını Getir
  async function handleViewLogs(dersId: string, ogretmenAdi: string, ogrenciAdi: string) {
    setIsLogModalOpen(true);
    setLogLoading(true);
    setSelectedLessonName(`${ogretmenAdi} & ${ogrenciAdi} Dersi`);
    
    const { data, error } = await supabase
      .from('ders_loglari')
      .select('*')
      .eq('ders_id', dersId)
      .order('created_at', { ascending: true });
    
    if (data) setCurrentLogs(data);
    setLogLoading(false);
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Ders Geçmişi ve Kayıtlar</h2>
          <p style={{ color: '#64748b', margin: '8px 0 0 0' }}>Derslerde kimin saat kaçta girdiği logları (Sistem Günlüğü) ve video kayıtlarını inceleyin.</p>
        </div>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '60px', textAlign: 'center' }}>Dersler yükleniyor...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Öğretmen</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Öğrenci</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Tarih / Saat</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Durum</th>
                <th style={{ padding: '20px 24px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 24px', fontWeight: 700, color: '#0f172a' }}>{lesson.egitmen_adi || "Eğitmen"}</td>
                  <td style={{ padding: '20px 24px', fontWeight: 600, color: '#475569' }}>{lesson.ogrenci_adi || "Öğrenci"}</td>
                  <td style={{ padding: '20px 24px', color: '#64748b' }}>{new Date(lesson.tarih_saat).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ 
                      background: lesson.durum === 'Tamamlanan' ? '#dcfce7' : (lesson.durum === 'Yaklaşan' ? '#eef2ff' : '#fef2f2'), 
                      color: lesson.durum === 'Tamamlanan' ? '#16a34a' : (lesson.durum === 'Yaklaşan' ? '#4f46e5' : '#ef4444'), 
                      padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 
                    }}>
                      {lesson.durum}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      
                      {/* 🚀 LOG BUTONU */}
                      <button 
                        onClick={() => handleViewLogs(lesson.id, lesson.egitmen_adi, lesson.ogrenci_adi)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        Loglar
                      </button>

                      {/* VİDEO İZLE BUTONU */}
                      {lesson.kayit_url ? (
                        <button 
                          onClick={() => handleWatch(lesson.kayit_url)} 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', boxShadow: '0 2px 4px rgba(16,185,129,0.2)', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          Kaydı İzle
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, padding: '8px 0' }}>Kayıt Yok</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {lessons.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Sistemde kayıtlı ders bulunmuyor.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 🚀 SİSTEM GÜNLÜĞÜ (LOG) MODALI */}
      {isLogModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            
            <div style={{ padding: '20px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Sistem Günlüğü (Logs)</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{selectedLessonName}</p>
              </div>
              <button onClick={() => setIsLogModalOpen(false)} style={{ border: 'none', background: '#e2e8f0', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                X
              </button>
            </div>
            
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              {logLoading ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Loglar çekiliyor...</div>
              ) : currentLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', background: '#f1f5f9', borderRadius: '16px' }}>Bu ders için henüz bir sistem günlüğü (log) oluşturulmamış. İlgili kişiler odaya hiç girmemiş olabilir.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {currentLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ width: '50px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, paddingTop: '12px', textAlign: 'right' }}>
                        {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ flex: 1, background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.kullanici_rolu === 'Öğretmen' ? '#4f46e5' : '#10b981' }}></div>
                        <span style={{ fontWeight: 800, color: log.kullanici_rolu === 'Öğretmen' ? '#4f46e5' : '#10b981' }}>{log.kullanici_rolu}</span>
                        <span style={{ color: '#475569', fontWeight: 500 }}>{log.aksiyon.toLowerCase() === 'odaya girdi' ? 'derse giriş yaptı.' : 'dersten ayrıldı.'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* VİDEO OYNATICI MODAL */}
      {selectedVideos && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#000000', width: '100%', maxWidth: '900px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            <div style={{ padding: '20px 24px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"/><rect x="3" y="6" width="12" height="12" rx="2" ry="2"/></svg>
                Ders Kaydı Görüntüleyicisi
              </h3>
              <button onClick={() => setSelectedVideos(null)} style={{ border: 'none', background: 'rgba(255,255,255,0.1)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                &times;
              </button>
            </div>
            
            <div style={{ width: '100%', background: '#000' }}>
              <video 
                key={selectedVideos[activeVideoIndex].url}
                src={selectedVideos[activeVideoIndex].url} 
                controls 
                autoPlay 
                style={{ width: '100%', maxHeight: '65vh', display: 'block', outline: 'none' }} 
              />
            </div>

            {selectedVideos.length > 1 && (
              <div style={{ padding: '16px 24px', background: '#1e293b', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>Parçalar (Kesintiler):</span>
                {selectedVideos.map((vid, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveVideoIndex(idx)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', border: 'none', transition: 'all 0.2s',
                      background: activeVideoIndex === idx ? '#4f46e5' : 'rgba(255,255,255,0.1)',
                      color: activeVideoIndex === idx ? 'white' : '#cbd5e1'
                    }}
                  >
                    {vid.name}
                  </button>
                ))}
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🚀 GENEL BAKIŞ (DASHBOARD OVERVIEW) BİLEŞENİ
========================================================= */
function DashboardOverview() {
  const [stats, setStats] = useState({ ogrenciler: 0, egitmenler: 0, bekleyenBasvurular: 0, tamamlananDersler: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { count: oCount } = await supabase.from('ogrenciler').select('*', { count: 'exact', head: true });
        const { count: eCount } = await supabase.from('egitmenler').select('*', { count: 'exact', head: true });
        const { count: bCount } = await supabase.from('basvurular').select('*', { count: 'exact', head: true }).eq('durum', 'bekliyor');
        const { count: dCount } = await supabase.from('dersler').select('*', { count: 'exact', head: true }).eq('durum', 'Tamamlanan');

        setStats({
          ogrenciler: oCount || 0,
          egitmenler: eCount || 0,
          bekleyenBasvurular: bCount || 0,
          tamamlananDersler: dCount || 0
        });
      } catch (err) {
        console.error("İstatistikler yüklenemedi", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>İstatistikler yükleniyor...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', marginTop: 0 }}>Platform Özeti</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Toplam Öğrenci</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>{stats.ogrenciler}</div>
          </div>
          <div style={{ background: '#eef2ff', padding: '12px', borderRadius: '12px', color: '#4f46e5' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Aktif Eğitmenler</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>{stats.egitmenler}</div>
          </div>
          <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '12px', color: '#16a34a' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Bekleyen Başvurular</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>{stats.bekleyenBasvurular}</div>
          </div>
          <div style={{ background: '#fff7ed', padding: '12px', borderRadius: '12px', color: '#d97706' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Tamamlanan Ders</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>{stats.tamamlananDersler}</div>
          </div>
          <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '12px', color: '#dc2626' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   🚀 SİSTEM AYARLARI BİLEŞENİ
========================================================= */
function SystemSettings() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [komisyon, setKomisyon] = useState('20');

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Şifreler birbiriyle eşleşmiyor!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert("Şifre güncellenirken hata oluştu: " + error.message);
    } else {
      alert("Yönetici şifreniz başarıyla güncellendi!");
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Platform ayarları kaydedildi. (Mevcut Komisyon: %${komisyon})`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Yönetici Hesap Ayarları */}
      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Güvenlik & Hesap Ayarları</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Yönetici paneli giriş şifrenizi buradan değiştirebilirsiniz.</p>
        </div>
        <form onSubmit={handlePasswordUpdate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#334155' }}>Yeni Şifre</label>
            <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Yeni şifrenizi girin" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#334155' }}>Yeni Şifre (Tekrar)</label>
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Yeni şifrenizi tekrar girin" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: '8px', padding: '12px 24px', background: loading ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', alignSelf: 'flex-start' }}>
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>

      {/* Platform Genel Ayarları */}
      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Platform Ayarları</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Sistem genelindeki kuralları ve oranları düzenleyin.</p>
        </div>
        <form onSubmit={handleSettingsSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#334155' }}>Platform Kesinti / Komisyon Oranı (%)</label>
            <div style={{ position: 'relative', width: '100%', maxWidth: '200px' }}>
              <input type="number" required value={komisyon} onChange={e => setKomisyon(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600 }}>%</span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>Eğitmenlerin ders ücretlerinden kesilecek platform hizmet bedeli.</p>
          </div>
          <button type="submit" style={{ marginTop: '8px', padding: '12px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}>
            Ayarları Kaydet
          </button>
        </form>
      </div>

    </div>
  );
}

/* =========================================================
   🚀 KULLANICI YÖNETİMİ BİLEŞENİ
========================================================= */
function UserManagement() {
  const [activeTab, setActiveTab] = useState<'ogrenciler' | 'egitmenler'>('ogrenciler');
  const [ogrenciler, setOgrenciler] = useState<any[]>([]);
  const [egitmenler, setEgitmenler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const { data: ogrData } = await supabase.from('ogrenciler').select('*').order('created_at', { ascending: false });
    const { data: egtData } = await supabase.from('egitmenler').select('*').order('created_at', { ascending: false });
    if (ogrData) setOgrenciler(ogrData);
    if (egtData) setEgitmenler(egtData);
    setLoading(false);
  }

  async function toggleStatus(type: 'ogrenci' | 'egitmen', userId: string, currentStatus: string) {
    const table = type === 'ogrenci' ? 'ogrenciler' : 'egitmenler';
    const isCurrentlyActive = currentStatus === 'Aktif' || currentStatus === 'aktif';
    const newStatus = isCurrentlyActive ? 'Pasif' : 'Aktif';
    
    const { data, error } = await supabase.from(table).update({ durum: newStatus }).eq('user_id', userId).select();
    if (error) {
      alert("Durum güncellenemedi: " + error.message);
    } else {
      loadUsers();
    }
  }

  async function deleteUser(type: 'ogrenci' | 'egitmen', userId: string) {
    const onay = confirm(`Kullanıcıyı KALICI OLARAK silmek istediğinize emin misiniz?`);
    if (!onay) return;
    const table = type === 'ogrenci' ? 'ogrenciler' : 'egitmenler';
    try {
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Silme API tarafından reddedildi.');
      
      const { error: tableError } = await supabase.from(table).delete().eq('user_id', userId);
      if (tableError) throw tableError;
      alert("Kullanıcı tamamen silindi!");
      loadUsers();
    } catch (error: any) {
      alert("Silme başarısız: " + error.message);
    }
  }

  const currentList = activeTab === 'ogrenciler' ? ogrenciler : egitmenler;
  const filteredList = currentList.filter(user => 
    user.tam_ad?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', background: '#f1f5f9', padding: '6px', borderRadius: '16px' }}>
          <button onClick={() => setActiveTab('ogrenciler')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: activeTab === 'ogrenciler' ? '#ffffff' : 'transparent', color: activeTab === 'ogrenciler' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: activeTab === 'ogrenciler' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none' }}>Öğrenciler ({ogrenciler.length})</button>
          <button onClick={() => setActiveTab('egitmenler')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: activeTab === 'egitmenler' ? '#ffffff' : 'transparent', color: activeTab === 'egitmenler' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: activeTab === 'egitmenler' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none' }}>Eğitmenler ({egitmenler.length})</button>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <input type="text" placeholder="İsim veya E-posta ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} />
        </div>
      </div>
      
      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '60px', textAlign: 'center' }}>Yükleniyor...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Ad Soyad</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>E-posta</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Durum</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((user) => {
                const isActive = user.durum === 'Aktif';
                const userType = activeTab === 'ogrenciler' ? 'ogrenci' : 'egitmen';
                return (
                  <tr key={user.id || user.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '20px 24px', fontWeight: 700, color: '#0f172a' }}>{user.tam_ad || "İsimsiz"}</td>
                    <td style={{ padding: '20px 24px', color: '#475569' }}>{user.email || "-"}</td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ background: isActive ? '#dcfce7' : '#f1f5f9', color: isActive ? '#16a34a' : '#64748b', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>{user.durum || 'Belirsiz'}</span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <button onClick={() => toggleStatus(userType, user.user_id, user.durum)} style={{ background: isActive ? '#fff7ed' : '#f0fdf4', color: isActive ? '#d97706' : '#16a34a', border: isActive ? '1px solid #fde68a' : '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginRight: '8px' }}>{isActive ? "Pasif Yap" : "Aktif Et"}</button>
                      <button onClick={() => deleteUser(userType, user.user_id)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Sil</button>
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

/* =========================================================
   🚀 BAŞVURU YÖNETİMİ BİLEŞENİ
========================================================= */

function parseKonum(konum: any) {
  if (!konum) return { ulke: '-', sehir: '-' };
  if (typeof konum === 'object') return { ulke: konum.ulke || '-', sehir: konum.sehir || '-' };
  const str = String(konum);
  if (str.includes('-')) {
      const parts = str.split('-');
      return { ulke: parts[0]?.trim() || '-', sehir: parts[1]?.trim() || '-' };
  }
  return { ulke: str, sehir: '-' };
}

function parseEgitim(egitim: any) {
  if (!egitim) return { seviye: '-', okul: '-' };
  if (typeof egitim === 'object') return { seviye: egitim.seviye || egitim.egitim_seviyesi || '-', okul: egitim.okul || egitim.universite || '-' };
  const str = String(egitim);
  if (str.includes('-')) {
      const parts = str.split('-');
      return { seviye: parts[0]?.trim() || '-', okul: parts[1]?.trim() || '-' };
  }
  return { seviye: str, okul: '-' };
}

function parseDiller(diller: any) {
  if (!diller) return { ana: '-', diger: '-' };
  let arr: string[] = [];
  if (Array.isArray(diller)) {
      arr = diller;
  } else if (typeof diller === 'string') {
      try {
          arr = JSON.parse(diller);
      } catch(e) {
          arr = diller.replace(/[\[\]{}"']/g, '').split(',').map((s:string) => s.trim());
      }
  }
  
  const ana = arr.find(d => d.includes('(Ana Dil)'))?.replace('(Ana Dil)', '')?.trim() || '-';
  const digerList = arr.filter(d => !d.includes('(Ana Dil)')).filter(Boolean);
  const diger = digerList.length > 0 ? digerList.join(', ') : '-';
  
  return { ana, diger };
}


function ApplicationsManagement() {
  const [basvurular, setBasvurular] = useState<any[]>([]);
  const [seciliBasvuru, setSeciliBasvuru] = useState<any>(null);

  useEffect(() => { loadBasvurular(); }, []);

  async function loadBasvurular() {
    const { data } = await supabase.from('basvurular').select('*').order('created_at', { ascending: false });
    if (data) setBasvurular(data);
  }

  async function updateStatus(basvuruObj: any, newStatus: string) {
    const onay = confirm(`Bu başvuruyu ${newStatus} olarak işaretlemek istiyor musunuz?`);
    if (!onay) return;
    if (newStatus === 'Onaylandı') {
      try {
        const response = await fetch('/api/davet', { 
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: basvuruObj.email })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        
        const realUserId = result.user.id; 
        
        const { data: checkExist } = await supabase.from('egitmenler').select('id').eq('user_id', realUserId).maybeSingle();
        
        const egitmenData = { 
          user_id: realUserId, 
          tam_ad: basvuruObj.tam_ad || "İsimsiz", 
          email: basvuruObj.email, 
          ders_turu: "Türkçe Eğitmeni", 
          biyografi: basvuruObj.biyografi || "", 
          saatlik_ucret: Number(basvuruObj.saatlik_ucret) || 250, 
          durum: 'Aktif',
          onay_durumu: 'Onaylandı',
          konum: basvuruObj.konum || null,       
          egitim: basvuruObj.egitim || null,     
          diller: basvuruObj.diller || null,     
          amac: basvuruObj.amac || null,
          sure: basvuruObj.sure || null,
          odak: basvuruObj.odak || null,
          seviye: basvuruObj.seviye || null
        };

        if (checkExist) {
          const { error: updErr } = await supabase.from('egitmenler').update(egitmenData).eq('user_id', realUserId);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase.from('egitmenler').insert([egitmenData]);
          if (insErr) throw insErr;
        }
        
        await supabase.from('basvurular').delete().eq('id', basvuruObj.id);
        alert("Başvuru onaylandı. Eğitmen profili eksiksiz bir şekilde güncellendi!");
      } catch (err: any) { alert("Sistemsel Hata: " + err.message); }
    }
    setSeciliBasvuru(null); 
    loadBasvurular(); 
  }

  async function deleteApplication(id: string) {
    const onay = confirm("Bu başvuruyu TAMAMEN silmek istediğinize emin misiniz?");
    if (!onay) return;
    await supabase.from('basvurular').delete().eq('id', id);
    setSeciliBasvuru(null);
    loadBasvurular();
  }

  const parsedKonum = parseKonum(seciliBasvuru?.konum);
  const parsedEgitim = parseEgitim(seciliBasvuru?.egitim);
  const parsedDiller = parseDiller(seciliBasvuru?.diller);

  const pAmac = seciliBasvuru?.amac || 'Belirtilmemiş';
  const pSure = seciliBasvuru?.sure || 'Belirtilmemiş';
  const pOdak = seciliBasvuru?.odak || 'Belirtilmemiş';
  const pSeviye = seciliBasvuru?.seviye || 'Belirtilmemiş';
  const pBio = seciliBasvuru?.biyografi || 'Biyografi metni girilmemiş.';
  const pUcret = seciliBasvuru?.saatlik_ucret || '-';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '20px 24px', color: '#64748b' }}>Aday Adı</th>
              <th style={{ padding: '20px 24px', color: '#64748b' }}>E-posta</th>
              <th style={{ padding: '20px 24px', color: '#64748b' }}>Durum</th>
              <th style={{ padding: '20px 24px', textAlign: 'right' }}>Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {basvurular.map((basvuru) => (
              <tr key={basvuru.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '20px 24px', fontWeight: 700 }}>{basvuru.tam_ad || "İsimsiz"}</td>
                <td style={{ padding: '20px 24px', color: '#475569' }}>{basvuru.email}</td>
                <td style={{ padding: '20px 24px' }}>{basvuru.durum}</td>
                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                  <button onClick={() => setSeciliBasvuru(basvuru)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Detaylar</button>
                </td>
              </tr>
            ))}
            {basvurular.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Bekleyen başvuru bulunmuyor.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {seciliBasvuru && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '900px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Eğitmen Başvuru Formu Detayları</h3>
              <button onClick={() => setSeciliBasvuru(null)} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '15px' }}>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                 <div><strong style={{ display: 'block', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Ad Soyad</strong> <span style={{ fontWeight: 600, color: '#0f172a' }}>{seciliBasvuru.tam_ad}</span></div>
                 <div><strong style={{ display: 'block', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>E-posta</strong> <span style={{ fontWeight: 600, color: '#0f172a' }}>{seciliBasvuru.email}</span></div>
                 <div><strong style={{ display: 'block', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Konum (Ülke)</strong> <span style={{ color: '#0f172a' }}>{parsedKonum.ulke}</span></div>
                 <div><strong style={{ display: 'block', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Şehir</strong> <span style={{ color: '#0f172a' }}>{parsedKonum.sehir}</span></div>
                 <div><strong style={{ display: 'block', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Eğitim Seviyesi</strong> <span style={{ color: '#0f172a' }}>{parsedEgitim.seviye}</span></div>
                 <div><strong style={{ display: 'block', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Üniversite / Okul Adı</strong> <span style={{ color: '#0f172a' }}>{parsedEgitim.okul}</span></div>
                 <div><strong style={{ display: 'block', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Ana Dil</strong> <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '8px', fontWeight: 700, fontSize: '13px' }}>{parsedDiller.ana}</span></div>
                 <div><strong style={{ display: 'block', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Diğer Diller</strong> <span style={{ color: '#0f172a' }}>{parsedDiller.diger}</span></div>
                 <div><strong style={{ display: 'block', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Saatlik Ders Ücreti</strong> <span style={{ fontWeight: 700, color: '#10b981' }}>{pUcret !== '-' ? `${pUcret} ₺` : '-'}</span></div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#fffbeb', padding: '20px', borderRadius: '16px', border: '1px solid #fef3c7' }}>
                 <div style={{ gridColumn: '1 / -1' }}><strong style={{ display: 'block', color: '#d97706', fontSize: '14px', textTransform: 'uppercase', marginBottom: '12px' }}>Uzmanlık ve Tercihler</strong></div>
                 <div><strong style={{ display: 'block', color: '#92400e', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Hedef Kitle (Amaç)</strong> <span style={{ color: '#b45309', fontWeight: 600 }}>{pAmac}</span></div>
                 <div><strong style={{ display: 'block', color: '#92400e', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Program Süresi</strong> <span style={{ color: '#b45309', fontWeight: 600 }}>{pSure}</span></div>
                 <div><strong style={{ display: 'block', color: '#92400e', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Öğrenci Seviyesi</strong> <span style={{ color: '#b45309', fontWeight: 600 }}>{pSeviye}</span></div>
                 <div><strong style={{ display: 'block', color: '#92400e', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>Odak Alanları</strong> <span style={{ color: '#b45309', fontWeight: 600 }}>{pOdak}</span></div>
               </div>

               <div>
                 <strong style={{ display: 'block', color: '#0f172a', marginBottom: '8px', fontSize: '16px' }}>Kısa Biyografi</strong>
                 <p style={{ margin: 0, color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>{pBio}</p>
               </div>

               {(seciliBasvuru.diploma_url || seciliBasvuru.sertifika_url) && (
                 <div>
                   <strong style={{ display: 'block', color: '#0f172a', marginBottom: '12px', fontSize: '16px' }}>Yüklenen Belgeler</strong>
                   <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                     {seciliBasvuru.diploma_url && (
                       <a href={seciliBasvuru.diploma_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#f0fdf4', color: '#16a34a', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, border: '1px solid #bbf7d0', transition: 'all 0.2s' }}>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                         Mezuniyet Diploması İncele
                       </a>
                     )}
                     {seciliBasvuru.sertifika_url && (
                       <a href={seciliBasvuru.sertifika_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#fff7ed', color: '#d97706', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, border: '1px solid #fde68a', transition: 'all 0.2s' }}>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                         TÖMER / Sertifika İncele
                       </a>
                     )}
                   </div>
                 </div>
               )}

            </div>

            <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => deleteApplication(seciliBasvuru.id)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Başvuruyu Sil</button>
              {seciliBasvuru.durum !== 'Onaylandı' && (
                <button onClick={() => updateStatus(seciliBasvuru, 'Onaylandı')} style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '12px 32px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}>Onayla ve Eğitmen Yap</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🚀 BLOG & İÇERİK YÖNETİMİ BİLEŞENİ
========================================================= */
function BlogManagement() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');

  const [baslik, setBaslik] = useState('');
  const [kategori, setKategori] = useState('Rehber');
  const [gorsel, setGorsel] = useState('');
  const [ozet, setOzet] = useState('');
  const [icerik, setIcerik] = useState('');

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    const { data, error } = await supabase.from('blog_yazilari').select('*').order('created_at', { ascending: false });
    if (!error && data) setPosts(data);
    setLoading(false);
  }

  const makeSlug = (text: string) => {
    let str = text.toLowerCase();
    const trMap: any = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
    for (let key in trMap) { str = str.replace(new RegExp(key, 'g'), trMap[key]); }
    return str.replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!baslik || !icerik) return alert("Başlık ve İçerik zorunludur!");

    const postData = {
      baslik,
      slug: makeSlug(baslik),
      ozet,
      icerik,
      gorsel_url: gorsel,
      kategori,
      durum: 'Yayında',
      okuma_suresi: Math.max(1, Math.ceil(icerik.length / 1000))
    };

    if (isEditing) {
      const { error } = await supabase.from('blog_yazilari').update(postData).eq('id', currentId);
      if (error) alert("Güncelleme hatası: " + error.message);
      else { alert("Başarıyla güncellendi!"); closeModal(); loadPosts(); }
    } else {
      const { error } = await supabase.from('blog_yazilari').insert([postData]);
      if (error) alert("Ekleme hatası: " + error.message);
      else { alert("Başarıyla eklendi!"); closeModal(); loadPosts(); }
    }
  };

  const editPost = (post: any) => {
    setIsEditing(true);
    setCurrentId(post.id);
    setBaslik(post.baslik);
    setKategori(post.kategori);
    setGorsel(post.gorsel_url || '');
    setOzet(post.ozet || '');
    setIcerik(post.icerik);
    setIsModalOpen(true);
  };

  const deletePost = async (id: string) => {
    if (!confirm("Bu yazıyı kalıcı olarak silmek istiyor musunuz?")) return;
    const { error } = await supabase.from('blog_yazilari').delete().eq('id', id);
    if (error) alert("Silme hatası: " + error.message);
    else loadPosts();
  };

  const closeModal = () => {
    setIsModalOpen(false); setIsEditing(false); setCurrentId('');
    setBaslik(''); setKategori('Rehber'); setGorsel(''); setOzet(''); setIcerik('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>SEO & Blog Yazıları</h2>
          <p style={{ color: '#64748b', margin: '8px 0 0 0' }}>Sitenize organik trafik çekmek için makaleler yayınlayın.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '12px 24px', backgroundColor: '#4f46e5', color: 'white', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Yeni Makale Yaz
        </button>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '60px', textAlign: 'center' }}>Yükleniyor...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '20px 24px', color: '#64748b' }}>Makale Başlığı</th>
                <th style={{ padding: '20px 24px', color: '#64748b' }}>Kategori</th>
                <th style={{ padding: '20px 24px', color: '#64748b' }}>Tarih</th>
                <th style={{ padding: '20px 24px', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 24px', fontWeight: 700 }}>{post.baslik}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>{post.kategori}</span>
                  </td>
                  <td style={{ padding: '20px 24px', color: '#64748b' }}>{new Date(post.created_at).toLocaleDateString('tr-TR')}</td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <button onClick={() => editPost(post)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, marginRight: '8px' }}>Düzenle</button>
                    <button onClick={() => deletePost(post.id)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Sil</button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Henüz hiç makale eklenmemiş.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '800px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{isEditing ? 'Makaleyi Düzenle' : 'Yeni Makale Yaz'}</h3>
              <button onClick={closeModal} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px' }}>Başlık <span style={{color:'red'}}>*</span></label>
                <input required type="text" value={baslik} onChange={(e)=>setBaslik(e.target.value)} placeholder="Örn: Yabancılar İçin Türkçe Öğrenme Rehberi" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px' }} />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px' }}>Kategori</label>
                  <select value={kategori} onChange={(e)=>setKategori(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', backgroundColor: 'white' }}>
                    <option value="Rehber">Rehber</option>
                    <option value="Haberler">Haberler</option>
                    <option value="Gramer">Gramer & Dilbilgisi</option>
                    <option value="Kültür">Kültür</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px' }}>Kapak Görseli Linki (URL)</label>
                  <input type="text" value={gorsel} onChange={(e)=>setGorsel(e.target.value)} placeholder="https://resim-linki.jpg" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px' }}>Kısa Özet (Google'da görünecek yazı)</label>
                <textarea rows={2} value={ozet} onChange={(e)=>setOzet(e.target.value)} placeholder="Bu makalede Türkçe öğrenmenin inceliklerini anlattık..." style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px' }}>Makale İçeriği (Ana Metin) <span style={{color:'red'}}>*</span></label>
                <textarea required rows={10} value={icerik} onChange={(e)=>setIcerik(e.target.value)} placeholder="Makalenizi buraya yazabilirsiniz. (HTML veya düz metin kullanabilirsiniz)" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', resize: 'vertical', lineHeight: 1.6 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '14px 24px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ padding: '14px 32px', background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}>{isEditing ? 'Değişiklikleri Kaydet' : 'Yayınla'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}