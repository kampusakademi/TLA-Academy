'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Home, Search, GraduationCap, Users, LockKeyhole, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error('Lütfen e-posta adresinizi girin.');
      return;
    }

    setLoading(true);

    try {
      // 1. Öğrenci veya Eğitmen tablosunda bu e-posta kayıtlı mı kontrol et
      const [studentRes, teacherRes] = await Promise.all([
        supabase.from('ogrenciler').select('id').eq('email', cleanEmail).maybeSingle(),
        supabase.from('egitmenler').select('id').eq('email', cleanEmail).maybeSingle()
      ]);

      const userExists = Boolean(studentRes.data || teacherRes.data);

      if (!userExists) {
        toast.error('Bu e-posta adresine ait kayıtlı bir hesap bulunamadı.');
        setLoading(false);
        return;
      }

      // 2. Kullanıcı mevcutsa sıfırlama bağlantısını gönder
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/sifre-yenile`,
      });

      if (error) {
        toast.error('Bir hata oluştu: ' + error.message);
      } else {
        toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi! Lütfen gelen kutunuzu kontrol edin.');
        setEmail('');
      }
    } catch (err: any) {
      toast.error('Sistem hatası: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      {/* SOL KENAR ÇUBUĞU (SIDEBAR) */}
      <aside style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 50 }}>
        
        {/* Logo Alanı */}
        <div 
          onClick={() => router.push('/')} 
          style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Turkish Learning<br/>Academy.
          </h1>
        </div>

        {/* Menü Linkleri */}
        <div style={{ padding: '24px 16px', flex: 1 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '12px', display: 'block', marginBottom: '16px' }}>
            MENÜ
          </span>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Ana Sayfa', icon: <Home size={18} />, path: '/' },
              { label: 'Eğitmenleri Keşfet', icon: <Search size={18} />, path: '/egitmenler' },
              { label: 'Öğretmen Ol', icon: <GraduationCap size={18} />, path: '/become-teacher' },
              { label: 'Eğitmenler', icon: <Users size={18} />, path: '/egitmenler' },
            ].map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => router.push(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer', color: '#64748b', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* SAĞ İÇERİK ALANI */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* Üst Header Bar */}
        <header style={{ backgroundColor: '#ffffff', padding: '16px 40px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40 }}>
          <button 
            onClick={() => router.push('/login')}
            style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '10px 24px', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
          >
            Giriş Yap / Kayıt Ol
          </button>
        </header>

        {/* Banner Alanı */}
        <div style={{ backgroundColor: '#0f172a', padding: '80px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(15, 23, 42, 0) 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
          
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '50%', display: 'inline-flex', marginBottom: '24px', backdropFilter: 'blur(10px)' }}>
              <LockKeyhole size={36} color="#a5b4fc" />
            </div>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#ffffff', margin: '0 0 16px 0', letterSpacing: '-1px' }}>
              Şifrenizi Mi Unuttunuz?
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Güvenliğiniz bizim için önemli. Hesabınıza ait kayıtlı e-posta adresinizi girin, 
              size hemen yeni bir şifre belirleme bağlantısı gönderelim.
            </p>
          </div>
        </div>

        {/* Form Kartı Alanı */}
        <div style={{ padding: '40px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#ffffff', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginTop: '-80px', position: 'relative', zIndex: 20 }}>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  E-posta Adresiniz
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '16px', color: '#94a3b8', pointerEvents: 'none' }}>
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    style={{
                      width: '100%',
                      padding: '16px 16px 16px 48px',
                      borderRadius: '14px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '1rem',
                      color: '#0f172a',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '18px',
                  backgroundColor: loading ? '#94a3b8' : '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  cursor: loading ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(79, 70, 229, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {loading ? 'Kontrol Ediliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </form>

            <div style={{ marginTop: '32px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <button 
                onClick={() => router.push('/login')}
                style={{
                  background: 'none', border: 'none', color: '#64748b', fontSize: '0.95rem', fontWeight: 600, 
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                <ArrowLeft size={16} />
                Giriş Ekranına Dön
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}