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

  const menu = [
    { key: 'dashboard', label: 'Genel Bakış', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> },
    { key: 'applications', label: 'Başvuru Yönetimi', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { key: 'users', label: 'Kullanıcı Yönetimi', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
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
      
      {/* SOL MENÜ */}
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

      {/* SAĞ İÇERİK */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* HEADER */}
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
              {tab === 'settings' && 'Sistem Ayarları'}
            </h1>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.1)', 
                padding: '6px 16px 6px 6px', borderRadius: 30, border: '1px solid rgba(255,255,255,0.2)', 
                cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                A
              </div>
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
   🚀 KULLANICI YÖNETİMİ BİLEŞENİ (GÜNCELLENDİ)
========================================================= */
function UserManagement() {
  const [activeTab, setActiveTab] = useState<'ogrenciler' | 'egitmenler'>('ogrenciler');
  const [ogrenciler, setOgrenciler] = useState<any[]>([]);
  const [egitmenler, setEgitmenler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data: ogrData, error: ogrErr } = await supabase.from('ogrenciler').select('*').order('created_at', { ascending: false });
    const { data: egtData, error: egtErr } = await supabase.from('egitmenler').select('*').order('created_at', { ascending: false });

    if (!ogrErr && ogrData) setOgrenciler(ogrData);
    if (!egtErr && egtData) setEgitmenler(egtData);
    setLoading(false);
  }

  async function toggleStatus(type: 'ogrenci' | 'egitmen', userId: string, currentStatus: string) {
    const table = type === 'ogrenci' ? 'ogrenciler' : 'egitmenler';
    const newStatus = currentStatus === 'Aktif' ? 'Pasif' : 'Aktif';
    
    const { error } = await supabase.from(table).update({ durum: newStatus }).eq('user_id', userId);

    if (error) alert("Durum güncellenemedi: " + error.message);
    else loadUsers();
  }

  // 🔥 1. YENİ GÜÇLENDİRİLMİŞ SİLME FONKSİYONU
  async function deleteUser(type: 'ogrenci' | 'egitmen', userId: string) {
    const onay = confirm(`Bu kullanıcıyı sistemden KALICI OLARAK silmek istediğinize emin misiniz? (Tüm giriş yetkileri ve verileri silinecektir!)`);
    if (!onay) return;

    const table = type === 'ogrenci' ? 'ogrenciler' : 'egitmenler';

    try {
      // 1. Önce yazdığımız API'ye istek atarak auth.users tablosundan tamamen siliyoruz
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Silme işlemi API tarafından reddedildi.');

      // 2. Ardından kendi tablomuzdan da (ogrenciler/egitmenler) manuel siliyoruz
      const { error: tableError } = await supabase.from(table).delete().eq('user_id', userId);

      if (tableError) throw tableError;

      alert("Kullanıcı sistemden ve tablolardan tamamen silindi!");
      loadUsers();
    } catch (error: any) {
      alert("Silme işlemi başarısız oldu: " + error.message);
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
          <button 
            onClick={() => setActiveTab('ogrenciler')} 
            style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: activeTab === 'ogrenciler' ? '#ffffff' : 'transparent', color: activeTab === 'ogrenciler' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'ogrenciler' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Öğrenciler ({ogrenciler.length})
          </button>
          <button 
            onClick={() => setActiveTab('egitmenler')} 
            style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: activeTab === 'egitmenler' ? '#ffffff' : 'transparent', color: activeTab === 'egitmenler' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'egitmenler' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Eğitmenler ({egitmenler.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text" 
            placeholder="İsim veya E-posta ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Yükleniyor...</div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            Arama kriterlerinize uygun {activeTab === 'ogrenciler' ? 'öğrenci' : 'eğitmen'} bulunamadı.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Ad Soyad</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>E-posta</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Kayıt Tarihi</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Durum</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((user) => {
                const isActive = user.durum === 'Aktif';
                const userType = activeTab === 'ogrenciler' ? 'ogrenci' : 'egitmen';
                
                return (
                  <tr key={user.id || user.user_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '20px 24px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: activeTab === 'ogrenciler' ? '#eef2ff' : '#fdf2f8', color: activeTab === 'ogrenciler' ? '#4f46e5' : '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                        {user.tam_ad?.charAt(0).toUpperCase() || '?'}
                      </div>
                      {user.tam_ad || "İsimsiz"}
                    </td>
                    <td style={{ padding: '20px 24px', color: '#475569' }}>{user.email || "-"}</td>
                    <td style={{ padding: '20px 24px', color: '#64748b' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : "-"}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        background: isActive ? '#dcfce7' : '#f1f5f9', 
                        color: isActive ? '#16a34a' : '#64748b', 
                        padding: '6px 12px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#22c55e' : '#94a3b8' }}></div>
                        {user.durum || 'Belirsiz'}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => toggleStatus(userType, user.user_id, user.durum)}
                          title={isActive ? "Hesabı Pasife Al" : "Hesabı Aktif Et"}
                          style={{ background: isActive ? '#fff7ed' : '#f0fdf4', color: isActive ? '#d97706' : '#16a34a', border: isActive ? '1px solid #fde68a' : '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          {isActive ? "Pasif Yap" : "Aktif Et"}
                        </button>
                        <button 
                          onClick={() => deleteUser(userType, user.user_id)}
                          title="Kullanıcıyı Sil"
                          style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          Sil
                        </button>
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

/* =========================================================
   🚀 BAŞVURU YÖNETİMİ BİLEŞENİ
========================================================= */
function ApplicationsManagement() {
  const [basvurular, setBasvurular] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seciliBasvuru, setSeciliBasvuru] = useState<any>(null);

  useEffect(() => {
    loadBasvurular();
  }, []);

  async function loadBasvurular() {
    setLoading(true);
    const { data, error } = await supabase
      .from('basvurular')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBasvurular(data);
    }
    setLoading(false);
  }

  async function updateStatus(basvuruObj: any, newStatus: string) {
    const onay = confirm(`Bu başvuruyu ${newStatus} olarak işaretlemek istiyor musunuz?`);
    if (!onay) return;

    if (newStatus === 'Onaylandı') {
      try {
        // 1. Mail Gönder ve User (Auth) Oluştur
        const response = await fetch('/api/davet', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: basvuruObj.email })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Mail gönderme API'si hata verdi.");
        }

        const realUserId = result.user.id; 

        // 2. Eğitmenlere Ekle (Çift Kayıt Koruması ile)
        const { data: checkExist } = await supabase
          .from('egitmenler')
          .select('id')
          .eq('user_id', realUserId)
          .maybeSingle();

        if (!checkExist) {
          const egitmenData: any = {
            user_id: realUserId, 
            tam_ad: basvuruObj.tam_ad || basvuruObj.ad_soyad || basvuruObj.isim || "İsimsiz Eğitmen",
            email: basvuruObj.email,
            ders_turu: basvuruObj.ders_turu || basvuruObj.brans || basvuruObj.uzmanlik || "Belirtilmedi",
            biyografi: basvuruObj.mesaj || basvuruObj.kendini_tanitma || "",
            saatlik_ucret: 250,
            durum: 'Aktif'
          };
          if (basvuruObj.telefon) egitmenData.telefon = basvuruObj.telefon;

          const { error: insertErr } = await supabase.from('egitmenler').insert([egitmenData]);
          if (insertErr) {
             console.error("Eğitmen ekleme hatası:", insertErr);
          }
        }

        // 3. İŞLEM BİTİNCE BAŞVURULARDAN SİL
        const { data: delData, error: delErr } = await supabase
          .from('basvurular')
          .delete()
          .eq('id', basvuruObj.id)
          .select();

        if (delErr) {
          alert("Başvuru onaylandı ama listeden silinemedi! (Hata: " + delErr.message + ")");
        } else if (!delData || delData.length === 0) {
          alert("Başvuru onaylandı, ancak listeden silinmesi Supabase Güvenlik Kuralları (RLS) tarafından engellendi. Lütfen SQL Editor'den 'basvurular' için DELETE izni verin.");
        } else {
          alert("Başvuru onaylandı.");
        }

      } catch (err: any) {
        alert("Sistemsel Hata: " + err.message);
      }
    } else {
      // 🚀 SADECE REDDEDİLİRSE DURUMUNU GÜNCELLE VE LİSTEDE BIRAK (Fakat biz butonu kaldırdık, yine de kod burada kalabilir)
      await supabase.from('basvurular').update({ durum: newStatus }).eq('id', basvuruObj.id);
      alert(`Başvuru reddedildi.`);
    }

    setSeciliBasvuru(null); 
    loadBasvurular(); 
  }

  // MANUEL OLARAK SİLME İŞLEMİ
  async function deleteApplication(id: string) {
    const onay = confirm("Bu başvuruyu veritabanından TAMAMEN silmek istediğinize emin misiniz? Bu işlem geri alınamaz!");
    if (!onay) return;

    const { data, error } = await supabase
      .from('basvurular')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      alert("Silme hatası: " + error.message);
    } else if (!data || data.length === 0) {
      alert("Sistem engelledi! Lütfen Supabase SQL Editor'den 'DELETE' yetkisi kodunu çalıştırdığınızdan emin olun.");
    } else {
      setSeciliBasvuru(null);
      loadBasvurular();
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Gelen Eğitmen Başvuruları</h2>
          <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '6px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 700 }}>
            Toplam: {basvurular.length} Başvuru
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Başvurular yükleniyor...</div>
        ) : basvurular.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
            Şu an bekleyen veya geçmiş herhangi bir başvuru bulunmuyor.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Aday Adı</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>E-posta</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Kayıt Tarihi</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600 }}>Durum</th>
                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {basvurular.map((basvuru) => {
                const isBekliyor = basvuru.durum === 'Bekliyor';
                const isOnaylandi = basvuru.durum === 'Onaylandı';
                const adSoyad = basvuru.tam_ad || basvuru.ad_soyad || basvuru.isim || "İsimsiz Aday";
                
                return (
                  <tr key={basvuru.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '20px 24px', fontWeight: 700, color: '#0f172a' }}>{adSoyad}</td>
                    <td style={{ padding: '20px 24px', color: '#475569' }}>{basvuru.email || "-"}</td>
                    <td style={{ padding: '20px 24px', color: '#64748b' }}>
                      {basvuru.created_at ? new Date(basvuru.created_at).toLocaleDateString('tr-TR') : "-"}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        background: isOnaylandi ? '#dcfce7' : (isBekliyor ? '#fef9c3' : '#fef2f2'), 
                        color: isOnaylandi ? '#16a34a' : (isBekliyor ? '#d97706' : '#dc2626'), 
                        padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700
                      }}>
                        {basvuru.durum || 'Belirsiz'}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSeciliBasvuru(basvuru)}
                        style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                      >
                        Tüm Detayları İncele
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {seciliBasvuru && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '700px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Başvuru Detayları</h3>
              <button onClick={() => setSeciliBasvuru(null)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {Object.keys(seciliBasvuru).map(key => {
                  if (['id', 'created_at', 'durum', 'user_id', 'mesaj', 'kendini_tanitma'].includes(key.toLowerCase())) return null;
                  const val = seciliBasvuru[key];
                  if (!val) return null;

                  if (typeof val === 'string' && val.startsWith('http')) {
                    return (
                      <div key={`doc-${key}`}>
                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '6px', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                        <a href={val} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                          📄 Görüntüle / İndir
                        </a>
                      </div>
                    );
                  }

                  return (
                    <div key={`info-${key}`}>
                      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{String(val)}</div>
                    </div>
                  );
                })}
              </div>

              {(seciliBasvuru.mesaj || seciliBasvuru.kendini_tanitma) && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>Kendini Tanıtma Metni / Ön Yazı</div>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#475569', lineHeight: 1.6, fontSize: '14px', whiteSpace: 'pre-line' }}>
                    {seciliBasvuru.mesaj || seciliBasvuru.kendini_tanitma}
                  </div>
                </div>
              )}
            </div>

            {/* 🔥 2. DÜZELTME: SADECE SİL VE ONAYLA BUTONLARI KALDI */}
            <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => deleteApplication(seciliBasvuru.id)}
                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Sil
              </button>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                {seciliBasvuru.durum !== 'Onaylandı' && (
                  <button 
                    onClick={() => updateStatus(seciliBasvuru, 'Onaylandı')}
                    style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(79,70,229,0.2)' }}
                  >
                    Başvuruyu Onayla
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}