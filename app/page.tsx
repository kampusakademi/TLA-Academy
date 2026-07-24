'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // Arama State'i
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal ve Auth State'leri
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'ogrenci' | 'ogretmen'>('ogrenci');
  
  // Form Verileri
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTeachers() {
      const { data } = await supabase.from('egitmenler').select('*');
      setTeachers(data || []);
    }
    fetchTeachers();
  }, []);

  // Normal E-Posta ile Supabase Kayıt & Giriş İşlemi
  const handleAuth = async () => {
    if (loading) return; // Eğer zaten yükleniyorsa ikinci kez çalışmasını engelle (Enter'a çift basma durumu)
    setLoading(true);
    try {
      if (authType === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role, 
            }
          }
        });
        
        if (error) throw error;

        if (role === 'ogrenci') {
          router.push('/student-dashboard'); 
        } else {
          router.push('/teacher-dashboard'); 
        }

      } else {
        // --- GİRİŞ (LOGIN) İŞLEMİ ---
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) throw new Error("Kullanıcı bilgisi alınamadı.");

        // 1. KONTROL: Öğrenci Girişi Seçildiyse
        if (role === 'ogrenci') {
          const { data: studentData, error: studentError } = await supabase
            .from('ogrenciler')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!studentData) {
            await supabase.auth.signOut();
            throw new Error("Yetkisiz Giriş: Bu e-posta adresi ile kayıtlı bir Öğrenci hesabı bulunmamaktadır.");
          }
          
          router.push('/student-dashboard'); 

        // 2. KONTROL: Öğretmen Girişi Seçildiyse
        } else if (role === 'ogretmen') {
          const { data: teacherData, error: teacherError } = await supabase
            .from('egitmenler')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!teacherData) {
            await supabase.auth.signOut();
            throw new Error("Yetkisiz Giriş: Bu e-posta adresi ile kayıtlı bir Eğitmen hesabı bulunmamaktadır. Lütfen 'Öğrenci' sekmesinden giriş yapmayı deneyin.");
          }
          
          router.push('/teacher-dashboard'); 
        }
      }
      
      setShowAuthModal(false); 
    } catch (error: any) {
      alert(error.message || 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  // Google ile Giriş / Kayıt İşlemi
  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/student-dashboard`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert('Google ile bağlantı kurulamadı: ' + error.message);
    }
  };

  // ARAMA VE FİLTRELEME İŞLEMİ
 const handleSearch = () => {
    router.push('/egitmenler');
  };

  const filteredTeachers = teachers.filter((t) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return (
      (t.tam_ad && t.tam_ad.toLowerCase().includes(lowerTerm)) ||
      (t.ders_turu && t.ders_turu.toLowerCase().includes(lowerTerm)) ||
      (t.biyografi && t.biyografi.toLowerCase().includes(lowerTerm))
    );
  });

  // 🚀 YENİ: Enter tuşu dinleyicisi
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleAuth();
    }
  };

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#0f172a', backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. GLASSMORPHISM NAVİGASYON */}
      <nav style={{ padding: '20px 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', position: 'sticky', top: 0, zIndex: 50 }}>
        
        {/* LOGO VE BAŞLIK CONTAINER'I */}
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e1b4b', letterSpacing: '-0.5px', margin: 0 }}>
            Turkish Learning Academy<span style={{ color: '#4f46e5' }}>.</span>
          </h1>
        </div>

        {/* MENÜ VE GİRİŞ */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <span onClick={handleSearch} style={{ cursor: 'pointer', fontWeight: 600, color: '#475569', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>Eğitmenleri Keşfet</span>
          <span 
            onClick={() => router.push('/become-teacher')} 
            style={{ cursor: 'pointer', fontWeight: 600, color: '#475569', transition: 'color 0.2s' }} 
            onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'} 
            onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
          >
            Öğretmen Ol
          </span>
          <button 
            onClick={() => { setAuthType('login'); setShowAuthModal(true); }} 
            style={{ padding: '12px 28px', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 4px 14px 0 rgba(30, 27, 75, 0.15)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(30, 27, 75, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(30, 27, 75, 0.15)'; }}
          >
            Giriş Yap / Kayıt Ol
          </button>
        </div>
      </nav>

      {/* 2. ZENGİN GÖRSELLİ HERO SECTION */}
      <header style={{ 
        padding: '140px 8%', 
        background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.95)), url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        textAlign: 'center', 
        position: 'relative' 
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '24px', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#4ade80', borderRadius: '50%', display: 'inline-block' }}></span>
            Platformumuz yayında!
          </span>
          
          <h2 style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1.1, color: '#ffffff', marginBottom: '24px', letterSpacing: '-2px' }}>
            Türkçeyi Ana Dili Türkçe Olan Öğretmenlerden <br/><span style={{ color: '#0efa49' }}>Güvenle</span> Öğrenin
          </h2>
          
          <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '48px', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 48px' }}>
            Onaylı eğitmenlerle birebir canlı dersler yapın. Hedeflerinize uygun, size özel hazırlanan programlarla akıcı konuşmaya hemen başlayın.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => router.push('/egitmen-bul')}
              style={{ 
                padding: '20px 48px', 
                backgroundColor: '#4f46e5', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '16px', 
                fontWeight: 800, 
                fontSize: '1.2rem', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.5)'
              }} 
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4338ca'; e.currentTarget.style.transform = 'translateY(-3px)'; }} 
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Eğitmenini Bul ✨
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '48px', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✔️ Sertifikalı Eğitmenler</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✔️ Birebir Canlı Dersler</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✔️ Esnek Takvim</span>
          </div>
        </div>
      </header>

      {/* 3. NASIL ÇALIŞIR BÖLÜMÜ */}
      <section style={{ padding: '80px 8%', backgroundColor: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>Nasıl Çalışır?</h3>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '12px' }}>Sadece 3 adımda ilk dersinize başlayın.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#ffffff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>🔍</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>1. Eğitmeninizi Bulun</h4>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Uzmanlık alanlarına, fiyatlara ve öğrenci yorumlarına göre size en uygun eğitmeni seçin.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#ffffff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>📅</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>2. Dersinizi Ayırtın</h4>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Eğitmenin takviminden size en uygun saati seçerek birebir dersinizi anında rezerve edin.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#ffffff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>💻</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>3. Öğrenmeye Başlayın</h4>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Ders saati geldiğinde platformumuz üzerinden görüntülü görüşmeye katılın ve pratik yapın.</p>
          </div>
        </div>
      </section>

      {/* 4. EĞİTMENLER GRID */}
      <section id="teachers-section" style={{ padding: '100px 8%', backgroundColor: '#f8fafc', flex: 1, borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
            <div>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', margin: 0 }}>Öne Çıkan Eğitmenler</h3>
              <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '12px', margin: '12px 0 0 0' }}>
                En yüksek puan alan öğretmenlerimizle tanışın.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((t) => (
                <div key={t.id} onClick={() => router.push(`/teachers/${t.user_id || t.id}`)} 
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '32px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={t.avatar_url || `https://ui-avatars.com/api/?name=${t.tam_ad || 'Eğitmen'}&background=eef2ff&color=4f46e5&size=80&bold=true`} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f8fafc', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', backgroundColor: '#22c55e', border: '3px solid #ffffff', borderRadius: '50%' }}></div>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{t.tam_ad}</h4>
                      <p style={{ margin: '4px 0 0 0', color: '#4f46e5', fontSize: '0.95rem', fontWeight: 600 }}>{t.ders_turu}</p>
                    </div>
                  </div>
                  <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '0.95rem', height: '4.8em', overflow: 'hidden', margin: 0 }}>
                    {t.biyografi || 'Alanında uzman, ana dili Türkçe olan deneyimli eğitmen ile pratik yapmaya hemen başlayın.'}
                  </p>
                  
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{t.saatlik_ucret}₺</span>
                      <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}> / ders</span>
                    </div>
                    <button style={{ padding: '10px 24px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}>Profili Gör</button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>😕</span>
                <h3>Aradığınız kritere uygun eğitmen bulunamadı.</h3>
                <p>Lütfen farklı bir anahtar kelime ile tekrar deneyin.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. KURUMSAL FOOTER */}
      <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '80px 8% 40px 8%' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '40px', marginBottom: '40px' }}>
          <div style={{ maxWidth: '300px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.5px' }}>Turkish Learning Academy.</h2>
            <p style={{ lineHeight: 1.6 }}>Dünyanın dört bir yanından Türkçe öğrenmek isteyenleri uzman eğitmenlerle buluşturan lider platform.</p>
          </div>
          <div style={{ display: 'flex', gap: '80px' }}>
            <div>
              <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '20px' }}>Platform</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li onClick={handleSearch} style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>Eğitmenleri Keşfet</li>
                <li style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>Nasıl Çalışır?</li>
                <li style={{ cursor: 'pointer' }} onClick={() => router.push('/become-teacher')} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>Öğretmen Ol</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '20px' }}>Destek</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>SSS</li>
                <li style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>İletişim</li>
                <li style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>Gizlilik Politikası</li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} Turkish Learning Academy. Tüm hakları saklıdır.
        </div>
      </footer>

      {/* 6. AUTH MODAL (Giriş/Kayıt Penceresi) */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            
            <div style={{ padding: '32px 32px 24px 32px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{authType === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</h2>
              <p style={{ margin: '12px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                {authType === 'login' ? 'Henüz hesabınız yok mu? ' : 'Zaten bir hesabınız var mı? '}
                <span onClick={() => setAuthType(authType === 'login' ? 'register' : 'login')} style={{ color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>
                  {authType === 'login' ? 'Kayıt Olun' : 'Giriş Yapın'}
                </span>
              </p>
            </div>

            <div style={{ padding: '0 32px 32px 32px' }}>
              
              <div style={{ backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '16px', display: 'flex', marginBottom: '24px' }}>
                <button 
                  onClick={() => setRole('ogrenci')} 
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: role === 'ogrenci' ? '#ffffff' : 'transparent', color: role === 'ogrenci' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: role === 'ogrenci' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  Öğrenci
                </button>
                <button 
                  onClick={() => setRole('ogretmen')} 
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: role === 'ogretmen' ? '#ffffff' : 'transparent', color: role === 'ogretmen' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: role === 'ogretmen' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  Öğretmen
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {authType === 'register' && role === 'ogretmen' ? (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>Eğitmen Olmak İster Misiniz?</h4>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                      Platformumuzda eğitmen olarak yer almak için öncelikle başvuru yapmanız gerekmektedir. Ekibimiz başvurunuzu inceledikten sonra süreci başlatacaktır.
                    </p>
                    <button 
                      onClick={() => { setShowAuthModal(false); router.push('/become-teacher'); }}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    >
                      Başvuru Sayfasına Git
                    </button>
                  </div>
                ) : (
                  <>
                    {/* KLASİK E-POSTA İLE GİRİŞ/KAYIT FORMU (🚀 YENİ: onKeyDown eklendi) */}
                    {authType === 'register' && (
                      <input 
                        placeholder="Ad Soyad" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} 
                      />
                    )}
                    <input 
                      type="email"
                      placeholder="E-posta adresi" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} 
                    />
                    <input 
                      type="password" 
                      placeholder="Şifre" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} 
                    />
                    
                    <button 
                      onClick={handleAuth}
                      disabled={loading}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: loading ? '#94a3b8' : '#4f46e5', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'background-color 0.2s', boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)' }} 
                      onMouseEnter={(e) => { if(!loading) e.currentTarget.style.backgroundColor = '#4338ca' }} 
                      onMouseLeave={(e) => { if(!loading) e.currentTarget.style.backgroundColor = '#4f46e5' }}
                    >
                      {loading ? 'İşlem yapılıyor...' : (authType === 'login' ? 'Giriş Yap' : 'Öğrenci Olarak Kayıt Ol')}
                    </button>

                    {/* AYIRICI ÇİZGİ */}
                    <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                      <span style={{ padding: '0 12px', fontWeight: 600 }}>veya</span>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                    </div>

                    {/* 🚀 GOOGLE İLE GİRİŞ BUTONU */}
                    <button 
                      onClick={handleGoogleAuth}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                        width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', 
                        backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', 
                        cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google ile Devam Et
                    </button>
                  </>
                )}

              </div>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <button onClick={() => setShowAuthModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Vazgeç ve Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}