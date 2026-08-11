'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from '@/lib/useTranslation';

export default function BlogListPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal ve Auth State'leri
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'ogrenci' | 'ogretmen'>('ogrenci');
  
  // Form Verileri
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dil kontrolü
  const isEn = t.nav.explore === "Find Teachers";

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('blog_yazilari')
        .select('*')
        .eq('durum', 'Yayında')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const handleAuth = async () => {
    if (authLoading) return;
    setAuthLoading(true);
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
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) throw new Error("Kullanıcı bilgisi alınamadı.");

        if (role === 'ogrenci') {
          const { data: studentData } = await supabase
            .from('ogrenciler')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!studentData) {
            await supabase.auth.signOut();
            throw new Error("Yetkisiz Giriş: Bu e-posta adresi ile kayıtlı bir Öğrenci hesabı bulunmamaktadır.");
          }
          
          router.push('/student-dashboard');

        } else if (role === 'ogretmen') {
          const { data: teacherData } = await supabase
            .from('egitmenler')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!teacherData) {
            await supabase.auth.signOut();
            throw new Error("Yetkisiz Giriş: Bu e-posta adresi ile kayıtlı bir Eğitmen hesabı bulunmamaktadır.");
          }
          
          router.push('/teacher-dashboard');
        }
      }
      
      setShowAuthModal(false);
    } catch (error: any) {
      alert(error.message || 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const redirectPath = role === 'ogretmen' ? '/teacher-dashboard' : '/student-dashboard';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert('Google ile bağlantı kurulamadı: ' + error.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !authLoading) {
      handleAuth();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: '"Inter", sans-serif' }}>
      
      {/* 🚀 ÜST NAVBAR */}
      <nav style={{ padding: '10px 2%', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e1b4b', margin: 0, letterSpacing: '-0.5px' }}>
            Turkish Learning Academy<span style={{ color: '#4f46e5' }}>.</span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={() => { setAuthType('login'); setShowAuthModal(true); }}
            style={{ padding: '12px 28px', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 4px 14px 0 rgba(30, 27, 75, 0.15)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#312e81'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e1b4b'}
          >
            {t.nav.login}
          </button>
        </div>
      </nav>

      {/* 🚀 ORTA ALAN: SOL MENÜ VE İÇERİK */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* SOL MENÜ (SIDEBAR) */}
        <aside style={{ 
          width: '280px', 
          backgroundColor: '#ffffff', 
          borderRight: '1px solid #e2e8f0', 
          padding: '40px 24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          position: 'sticky', 
          top: '81px', 
          height: 'calc(100vh - 81px)',
          overflowY: 'auto'
        }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', paddingLeft: '12px' }}>Menü</h3>
          
          <button 
            onClick={() => router.push('/')} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'transparent', border: 'none', color: '#475569', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#4f46e5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            {isEn ? "Home" : "Ana Sayfa"}
          </button>

          <button 
            onClick={() => router.push('/egitmen-bul')} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'transparent', border: 'none', color: '#475569', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#4f46e5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            {t.nav.explore}
          </button>

          <button 
            onClick={() => router.push('/become-teacher')} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'transparent', border: 'none', color: '#475569', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#4f46e5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            {t.nav.becomeTeacher}
          </button>

          <button 
            onClick={() => router.push('/egitmenler')} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'transparent', border: 'none', color: '#475569', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#4f46e5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            {isEn ? "Tutors" : "Eğitmenler"}
          </button>

        </aside>

        {/* SAĞ İÇERİK ALANI (HERO + BLOG LİSTESİ) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* 🚀 HERO ALANI */}
          <header style={{ backgroundColor: '#0f172a', padding: '40px 4%', textAlign: 'center' }}>
            <h1 style={{ color: '#ffffff', fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-1px', margin: '0 0 16px 0' }}>
              Turkish Learning Academy <span style={{ color: '#818cf8' }}>Blog</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              {isEn ? "Turkish learning tips, cultural guides, and the latest news from our platform." : "Türkçe öğrenme ipuçları, kültür rehberleri ve platformumuzdan en güncel haberler."}
            </p>
          </header>

          {/* 🚀 BLOG LİSTESİ (GRID TASARIM) */}
          <main style={{ padding: '60px 4%', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b', fontSize: '1.2rem', fontWeight: 600 }}>Makaleler yükleniyor...</div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8', fontSize: '1.2rem' }}>Henüz yayında olan bir makale bulunmuyor.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
                {posts.map((post) => (
                  <article 
                    key={post.id} 
                    onClick={() => router.push(`/blog/${post.slug}`)}
                    style={{ backgroundColor: '#ffffff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    {/* Kapak Görseli */}
                    <div style={{ height: '220px', width: '100%', backgroundColor: '#e2e8f0', position: 'relative', overflow: 'hidden' }}>
                      <img 
                        src={post.gorsel_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop'} 
                        alt={post.baslik} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '12px', color: '#4f46e5', fontWeight: 800, fontSize: '0.8rem' }}>
                        {post.kategori}
                      </div>
                    </div>

                    {/* İçerik Kısmı */}
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
                        <span>{new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span style={{ width: '4px', height: '4px', backgroundColor: '#cbd5e1', borderRadius: '50%' }}></span>
                        <span>{post.okuma_suresi} dk okuma</span>
                      </div>
                      
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0', lineHeight: 1.4, letterSpacing: '-0.5px' }}>
                        {post.baslik}
                      </h2>
                      
                      <p style={{ color: '#475569', lineHeight: 1.6, margin: 0, fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.ozet}
                      </p>

                      <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', alignItems: 'center', color: '#4f46e5', fontWeight: 700, fontSize: '0.95rem' }}>
                        Makaleyi Oku <span style={{ marginLeft: '6px' }}>→</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>

        </div>
      </div>

      {/* 🚀 KURUMSAL FOOTER (ANA SAYFA İLE BİREBİR AYNI) */}
      <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '80px 8% 40px 8%', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '40px', marginBottom: '40px' }}>
          <div style={{ maxWidth: '300px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.5px' }}>Turkish Learning Academy.</h2>
            <p style={{ lineHeight: 1.6 }}>Dünyanın dört bir yanından Türkçe öğrenmek isteyenleri uzman eğitmenlerle buluşturan yenilikçi platform.</p>
          </div>
          <div style={{ display: 'flex', gap: '80px' }}>
            <div>
              <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '20px' }}>Platform</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li onClick={() => router.push('/egitmenler')} style={{ cursor: 'pointer' }}>Eğitmenleri Keşfet</li>
                <li style={{ cursor: 'pointer' }}>Nasıl Çalışır</li>
                <li style={{ cursor: 'pointer' }} onClick={() => router.push('/become-teacher')}>Öğretmen Ol</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '20px' }}>Destek / Support</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ cursor: 'pointer' }}>SSS / FAQ</li>
                <li style={{ cursor: 'pointer' }}>İletişim / Contact</li>
                <li style={{ cursor: 'pointer' }}>Gizlilik Politikası / Privacy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SOSYAL MEDYA İKONLARI VE TELİF HAKKI */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Instagram */}
            <a href="#" aria-label="Instagram" style={{ color: '#94a3b8', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            {/* Facebook */}
            <a href="#" aria-label="Facebook" style={{ color: '#94a3b8', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>

            {/* YouTube */}
            <a href="#" aria-label="YouTube" style={{ color: '#94a3b8', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
            </a>

            {/* X (Twitter) */}
            <a href="#" aria-label="X (Twitter)" style={{ color: '#94a3b8', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l11.73 16h5L9 4H4z"></path>
                <path d="M4 20l6.76-6.76M20 4l-6.76 6.76"></path>
              </svg>
            </a>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            &copy; {new Date().getFullYear()} Turkish Learning Academy. Tüm hakları saklıdır.
          </div>
          
        </div>
      </footer>

      {/* 🚀 GİRİŞ YAP / KAYIT OL MODALI */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '32px 32px 24px 32px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                {authType === 'login' ? t.authModal.loginTitle : t.authModal.registerTitle}
              </h2>
              <p style={{ margin: '12px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                {authType === 'login' ? t.authModal.noAccount : t.authModal.hasAccount}
                <span onClick={() => setAuthType(authType === 'login' ? 'register' : 'login')} style={{ color: '#4f46e5', fontWeight: 700, cursor: 'pointer' }}>
                  {authType === 'login' ? t.authModal.signUpBtnText : t.authModal.logInBtnText}
                </span>
              </p>
            </div>

            <div style={{ padding: '0 32px 32px 32px' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '16px', display: 'flex', marginBottom: '24px' }}>
                <button 
                  onClick={() => setRole('ogrenci')} 
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: role === 'ogrenci' ? '#ffffff' : 'transparent', color: role === 'ogrenci' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: role === 'ogrenci' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  {t.authModal.studentTab}
                </button>
                <button 
                  onClick={() => setRole('ogretmen')} 
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: role === 'ogretmen' ? '#ffffff' : 'transparent', color: role === 'ogretmen' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: role === 'ogretmen' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  {t.authModal.teacherTab}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {authType === 'register' && role === 'ogretmen' ? (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>{t.authModal.teacherApplyTitle}</h4>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                      {t.authModal.teacherApplyDesc}
                    </p>
                    <button 
                      onClick={() => { setShowAuthModal(false); router.push('/become-teacher'); }}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                    >
                      {t.authModal.teacherApplyBtn}
                    </button>
                  </div>
                ) : (
                  <>
                    {authType === 'register' && (
                      <input 
                        placeholder={t.authModal.namePlaceholder}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} 
                      />
                    )}
                    <input 
                      type="email"
                      placeholder={t.authModal.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} 
                    />
                    <input 
                      type="password" 
                      placeholder={t.authModal.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500 }} 
                    />
                    
                    <button 
                      onClick={handleAuth}
                      disabled={authLoading}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: authLoading ? '#94a3b8' : '#4f46e5', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: authLoading ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'background-color 0.2s', boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)' }}
                    >
                      {authLoading ? t.authModal.processing : (authType === 'login' ? t.authModal.submitLogin : t.authModal.submitRegister)}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                      <span style={{ padding: '0 12px', fontWeight: 600 }}>{t.authModal.or}</span>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                    </div>

                    <button 
                      onClick={handleGoogleAuth}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                        width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', 
                        backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', 
                        cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {t.authModal.googleBtn}
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <button onClick={() => setShowAuthModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>{t.authModal.closeBtn}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}