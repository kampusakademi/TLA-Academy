'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('applications'); 
  const [adminId, setAdminId] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // GİRİŞ EKRANI (GÜVENLİK DUVARI) STATE'LERİ
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

  // 🚀 MENÜYE "BLOG YÖNETİMİ" EKLENDİ
  const menu = [
    { key: 'dashboard', label: 'Genel Bakış', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> },
    { key: 'applications', label: 'Başvuru Yönetimi', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { key: 'users', label: 'Kullanıcı Yönetimi', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
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
          {tab === 'dashboard' && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <h2>Burası Genel Bakış Alanı</h2>
              <p>Öğrenci, eğitmen ve ders sayılarını burada gösterebilirsiniz.</p>
            </div>
          )}
          {tab === 'users' && <UserManagement />}
          {tab === 'applications' && <ApplicationsManagement />}
          
          {/* 🚀 BLOG YÖNETİMİ BİLEŞENİ BURADA ÇAĞRILIYOR */}
          {tab === 'blog' && <BlogManagement />}
          
          {tab === 'settings' && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <h2>Sistem Ayarları</h2>
              <p>Platform genel ayarları burada yer alacak.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   🚀 KULLANICI YÖNETİMİ BİLEŞENİ (AYNEN KORUNDU)
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
    } else if (!data || data.length === 0) {
      alert("Sistem Engelledi! Güvenlik kuralları engelliyor.");
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
   🚀 BAŞVURU YÖNETİMİ BİLEŞENİ (AYNEN KORUNDU)
========================================================= */
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
        if (!checkExist) {
          const egitmenData = { user_id: realUserId, tam_ad: basvuruObj.tam_ad || "İsimsiz", email: basvuruObj.email, ders_turu: basvuruObj.ders_turu || "Belirtilmedi", biyografi: basvuruObj.mesaj || "", saatlik_ucret: 250, durum: 'Aktif' };
          await supabase.from('egitmenler').insert([egitmenData]);
        }
        await supabase.from('basvurular').delete().eq('id', basvuruObj.id);
        alert("Başvuru onaylandı.");
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
          </tbody>
        </table>
      </div>

      {seciliBasvuru && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '700px', borderRadius: '24px', overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Başvuru Detayları</h3>
              <button onClick={() => setSeciliBasvuru(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ padding: '32px', maxHeight: '65vh', overflowY: 'auto' }}>
               <p><strong>Ad:</strong> {seciliBasvuru.tam_ad}</p>
               <p><strong>E-posta:</strong> {seciliBasvuru.email}</p>
               <p><strong>Mesaj:</strong> {seciliBasvuru.mesaj || seciliBasvuru.kendini_tanitma}</p>
            </div>
            <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => deleteApplication(seciliBasvuru.id)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Sil</button>
              {seciliBasvuru.durum !== 'Onaylandı' && (
                <button onClick={() => updateStatus(seciliBasvuru, 'Onaylandı')} style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Başvuruyu Onayla</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🚀 YENİ: BLOG & İÇERİK YÖNETİMİ BİLEŞENİ
========================================================= */
function BlogManagement() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');

  // Form State
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

  // Türkçe karakterleri çevirip URL'ye uygun slug (link) yapar
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
      okuma_suresi: Math.max(1, Math.ceil(icerik.length / 1000)) // Otomatik okuma süresi tahmini
    };

    if (isEditing) {
      const { error } = await supabase.from('blog_yazilari').update(postData).eq('id', currentId);
      if (error) alert("Güncelleme hatası: " + error.message);
      else { alert("Başarıyla güncellendi!"); closeModal(); loadPosts(); }
    } else {
      const { error } = await supabase.from('blog_yazilari').insert([postData]);
      if (error) alert("Ekleme hatası (Muhtemelen aynı başlıklı yazı var): " + error.message);
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

      {/* MAKALE EKLEME / DÜZENLEME MODALI */}
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