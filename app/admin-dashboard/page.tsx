'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  // 🚀 VIP LİSTESİ: Sadece bu e-posta adresleri admin paneline girebilir!
  // Buraya Supabase'de oluşturduğun kendi admin mailini yazabilirsin.
  const ADMIN_EMAILS = ['egemenntuzmenn@gmail.com', 'egemenntuzmenn@gmail.com'];

  // Admin Özel Giriş Ekranı İçin State'ler
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Aktif Sekme
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'users' | 'lessons'>('overview');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Veri State'leri
  const [stats, setStats] = useState({ ogrenciSayisi: 0, egitmenSayisi: 0, tamamlananDers: 0, bekleyenOnay: 0 });
  const [pendingTeachers, setPendingTeachers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const [allLessons, setAllLessons] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      setLoading(true);
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setNotLoggedIn(true);
        setLoading(false);
        return;
      }
      
      // 🛡️ VIP KONTROLÜ: Zaten oturum açmış ama patron değilse dışarı at
      if (!ADMIN_EMAILS.includes(user.email || '')) {
        await supabase.auth.signOut();
        setNotLoggedIn(true);
        setLoading(false);
        alert("Erişim Reddedildi: Bu panele sadece yetkili yöneticiler girebilir!");
        return;
      }

      setAdminUser(user);

      // --- İSTATİSTİKLER VE LİSTELERİ ÇEKME ---
      const { data: ogrenciler } = await supabase.from('ogrenciler').select('*');
      const { data: egitmenler } = await supabase.from('egitmenler').select('*');
      const { data: dersler } = await supabase.from('dersler').select('*').order('tarih_saat', { ascending: false });
      const { data: basvurular } = await supabase.from('basvurular').select('*').order('created_at', { ascending: false });

      if (ogrenciler && egitmenler && dersler && basvurular) {
        const bekleyenler = basvurular.filter(b => {
          const d = b.durum ? b.durum.toLowerCase() : '';
          return d === '' || d === 'bekliyor' || d === 'beklemede';
        });
        
        setPendingTeachers(bekleyenler);

        setStats({
          ogrenciSayisi: ogrenciler.length,
          egitmenSayisi: egitmenler.filter(e => e.durum?.toLowerCase() === 'aktif').length,
          tamamlananDers: dersler.filter(d => d.durum === 'Tamamlanan').length,
          bekleyenOnay: bekleyenler.length
        });

        const combinedUsers = [
          ...ogrenciler.map(o => ({ ...o, tip: 'Öğrenci' })),
          ...egitmenler.map(e => ({ ...e, tip: 'Eğitmen' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setAllUsers(combinedUsers);
        setAllLessons(dersler);
      }
    } catch (err) {
      console.error("Admin verileri çekilirken hata:", err);
    } finally {
      setLoading(false);
    }
  }

  // Özel Kapıdan Giriş Yapma Fonksiyonu
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    // 🛡️ ÖNCEDEN KONTROL: Mail VIP listesinde yoksa boşuna şifre sorgulatma
    if (!ADMIN_EMAILS.includes(loginEmail)) {
      alert("Yetkisiz Giriş: Bu e-posta adresi yönetici yetkilerine sahip değil.");
      setLoginLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      alert("Giriş reddedildi: E-posta veya şifre hatalı.");
      setLoginLoading(false);
    } else {
      setNotLoggedIn(false);
      fetchAdminData();
    }
  };

  const handleApproveTeacher = async (teacher: any) => {
    if (!confirm("Bu eğitmeni onaylamak istediğinize emin misiniz? (Öğretmene şifre belirleme maili gidecek)")) return;
    
    setProcessingId(teacher.id); 
    try {
      const res = await fetch('/api/egitmen-onayla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basvuruId: teacher.id,
          email: teacher.email,
          tamAd: teacher.tam_ad
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bilinmeyen bir API hatası.');

      alert("🎉 " + data.message); 
      fetchAdminData(); 

    } catch (err: any) {
      alert("Hata oluştu: " + err.message);
    } finally {
      setProcessingId(null); 
    }
  };

  const handleRejectTeacher = async (teacherId: string) => {
    if (!confirm("Bu başvuruyu reddetmek istediğinize emin misiniz?")) return;
    try {
      const { error } = await supabase.from('basvurular').update({ durum: 'Reddedildi' }).eq('id', teacherId);
      if (error) throw error;
      alert("Başvuru reddedildi.");
      fetchAdminData();
    } catch (err: any) {
      alert("Hata oluştu: " + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#64748b', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Yönetici Paneli Hazırlanıyor...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#020617', color: '#f8fafc', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '40px', borderRadius: '16px', border: '1px solid #1e293b', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px 0', color: '#ffffff' }}>TLA Kontrol Merkezi</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Sadece yetkili yöneticiler içindir.</p>
          </div>

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Yönetici E-Posta</label>
              <input 
                type="email" 
                required 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
                placeholder="admin@tla.com"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none', fontSize: '1rem', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Şifre</label>
              <input 
                type="password" 
                required 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                placeholder="••••••••"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none', fontSize: '1rem', boxSizing: 'border-box' }} 
              />
            </div>
            <button 
              type="submit" 
              disabled={loginLoading} 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: loginLoading ? '#b45309' : '#f59e0b', color: '#0f172a', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: loginLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              {loginLoading ? 'Yetki Doğrulanıyor...' : 'Giriş YAP'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  const menu = [
    { key: 'overview', label: 'Genel Bakış', icon: '📊' },
    { key: 'approvals', label: `Onay Bekleyenler (${stats.bekleyenOnay})`, icon: '⏳' },
    { key: 'users', label: 'Kullanıcı Yönetimi', icon: '👥' },
    { key: 'lessons', label: 'Tüm Ders Trafiği', icon: '📅' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a' }}>
      
      {/* SOL MENÜ */}
      <aside style={{ width: '280px', backgroundColor: '#020617', color: '#94a3b8', display: 'flex', flexDirection: 'column', padding: '32px 24px', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, paddingLeft: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}></div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1.2 }}>TLA<br /><span style={{ color: '#f59e0b', fontSize: 12 }}>Super Admin</span></h2>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {menu.map(m => {
            const isActive = activeTab === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setActiveTab(m.key as any)}
                style={{ padding: '14px 16px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? '#ffffff' : '#94a3b8', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', textAlign: 'left', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>{m.label}
              </button>
            );
          })}
        </nav>
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', backgroundColor: '#7f1d1d', color: '#fca5a5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            🚪 Güvenli Çıkış
          </button>
        </div>
      </aside>

      {/* SAĞ İÇERİK ALANI */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        <header style={{ padding: '24px 60px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Kontrol Merkezi</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>{adminUser?.email}</span>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#0f172a', color: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>AD</div>
          </div>
        </header>

        <div style={{ padding: '40px 60px' }}>
          
          {/* SEKME 1: GENEL BAKIŞ */}
          {activeTab === 'overview' && (
            <>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: '#334155' }}>Platform İstatistikleri</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>Toplam Öğrenci</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>{stats.ogrenciSayisi}</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>Aktif Eğitmen</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#4f46e5' }}>{stats.egitmenSayisi}</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>Tamamlanan Ders</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#16a34a' }}>{stats.tamamlananDers}</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>Bekleyen Onay</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b' }}>{stats.bekleyenOnay}</div>
                </div>
              </div>
            </>
          )}

          {/* SEKME 2: ONAY BEKLEYEN EĞİTMENLER */}
          {activeTab === 'approvals' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Platforma Başvuran Eğitmenler</h3>
              </div>
              {pendingTeachers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>Şu an onay bekleyen eğitmen başvurusu bulunmuyor.</div>
              ) : (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingTeachers.map(teacher => (
                    <div key={teacher.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img src={`https://ui-avatars.com/api/?name=${teacher.tam_ad}&background=eef2ff&color=4f46e5`} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800 }}>{teacher.tam_ad}</h4>
                          <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.9rem' }}>
                            {teacher.email} • {teacher.saatlik_ucret ? `${teacher.saatlik_ucret}₺/saat` : 'Ücret Belirtilmemiş'}
                          </p>
                          {teacher.diploma_url && <a href={teacher.diploma_url} target="_blank" rel="noopener noreferrer" style={{fontSize: '0.8rem', color: '#4f46e5', marginRight: '10px'}}>📄 Diplomayı Gör</a>}
                          {teacher.sertifika_url && <a href={teacher.sertifika_url} target="_blank" rel="noopener noreferrer" style={{fontSize: '0.8rem', color: '#4f46e5'}}>📜 Sertifikayı Gör</a>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => handleRejectTeacher(teacher.id)} style={{ padding: '10px 16px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Reddet</button>
                        <button 
                          disabled={processingId === teacher.id}
                          onClick={() => handleApproveTeacher(teacher)} 
                          style={{ padding: '10px 24px', backgroundColor: processingId === teacher.id ? '#94a3b8' : '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: processingId === teacher.id ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease-in-out' }}
                        >
                          {processingId === teacher.id ? 'Onaylanıyor...' : 'Profili Onayla & Davet Et'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEKME 3: KULLANICI YÖNETİMİ */}
          {activeTab === 'users' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}><h3 style={{ margin: 0 }}>Sistemdeki Tüm Kullanıcılar</h3></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
                      <th style={{ padding: '16px 24px' }}>Ad Soyad</th><th style={{ padding: '16px 24px' }}>E-Posta</th><th style={{ padding: '16px 24px' }}>Tip</th><th style={{ padding: '16px 24px' }}>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 600 }}>{user.tam_ad}</td>
                        <td style={{ padding: '16px 24px', color: '#475569' }}>{user.email}</td>
                        <td style={{ padding: '16px 24px' }}><span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, backgroundColor: user.tip === 'Eğitmen' ? '#eef2ff' : '#f0fdf4', color: user.tip === 'Eğitmen' ? '#4f46e5' : '#16a34a' }}>{user.tip}</span></td>
                        <td style={{ padding: '16px 24px', fontWeight: 600, color: user.durum === 'Aktif' ? '#16a34a' : (user.durum === 'Reddedildi' ? '#ef4444' : '#f59e0b') }}>{user.durum || 'Aktif'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SEKME 4: DERS TRAFİĞİ */}
          {activeTab === 'lessons' && (
             <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
             <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}><h3 style={{ margin: 0 }}>Rezervasyonlar</h3></div>
             <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                 <thead>
                   <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
                     <th style={{ padding: '16px 24px' }}>Tarih</th><th style={{ padding: '16px 24px' }}>Öğrenci</th><th style={{ padding: '16px 24px' }}>Eğitmen</th><th style={{ padding: '16px 24px' }}>Durum</th>
                   </tr>
                 </thead>
                 <tbody>
                   {allLessons.map((lesson, idx) => (
                     <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                       <td style={{ padding: '16px 24px', fontWeight: 600 }}>{new Date(lesson.tarih_saat).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                       <td style={{ padding: '16px 24px' }}>{lesson.ogrenci_adi}</td><td style={{ padding: '16px 24px' }}>{lesson.egitmen_adi}</td>
                       <td style={{ padding: '16px 24px' }}><span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, backgroundColor: lesson.durum === 'Tamamlanan' ? '#dcfce3' : '#fee2e2', color: lesson.durum === 'Tamamlanan' ? '#16a34a' : '#ef4444' }}>{lesson.durum}</span></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
          )}

        </div>
      </main>
    </div>
  );
}