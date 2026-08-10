'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SifreBelirle() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [userEmail, setUserEmail] = useState(''); 

  useEffect(() => {
    let isMounted = true;

    const setupSession = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const hash = window.location.hash.substring(1); 
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      // Admin ile çakışmayı önleyen o meşhur koruma kalkanımız
      if (code || (accessToken && refreshToken)) {
        await supabase.auth.signOut(); 
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (isMounted) {
            setUserEmail(session.user.email || '');
            setVerifying(false);
          }
          return;
        }
      }

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && isMounted) {
          setErrorMsg("Davet linki kullanılmış veya geçersiz. (" + error.message + ")");
          setVerifying(false);
        } else if (data?.session && isMounted) {
          setUserEmail(data.session.user.email || ''); 
          window.history.replaceState(null, '', window.location.pathname);
          setVerifying(false);
        }
      } 
      else if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error && isMounted) {
          setErrorMsg("Oturum açılamadı: " + error.message);
          setVerifying(false);
        } else if (data?.session && isMounted) {
          setUserEmail(data.session.user.email || ''); 
          window.history.replaceState(null, '', window.location.pathname);
          setVerifying(false);
        }
      } 
      else {
        if (isMounted) {
          setErrorMsg("Eksik bağlantı: Bu sayfaya yalnızca e-postanıza gelen tek kullanımlık davet linkinden ulaşabilirsiniz.");
          setVerifying(false);
        }
      }
    };

    setupSession();
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      alert("Parolanız en az 6 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      alert("🎉 Parolanız başarıyla oluşturuldu! Sisteme yönlendiriliyorsunuz...");
      
      // ANA SAYFA YERİNE DOĞRUDAN EĞİTMEN PANELİNE YÖNLENDİR
      // (Eğer panelinin adres adı farklıysa '/egitmen-paneli' kısmını kendi klasör adınla değiştir)
      router.push('/teacher-dashboard'); 
      
    } catch (error: any) {
      alert("Hata oluştu: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  if (verifying) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', gap: '16px' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Güvenli bağlantınız kontrol ediliyor...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', textAlign: 'center', padding: '20px' }}>
        <div style={{ width: 80, height: 80, marginBottom: 16, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Bağlantı Hatası</h1>
        <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: '24px', maxWidth: '450px' }}>{errorMsg}</p>
        <button onClick={() => router.push('/')} style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: '"Inter", sans-serif', padding: '20px' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)', width: '100%', maxWidth: '420px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          
          {/* 🚀 YENİ MODERN SVG GÖRSELİ */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', position: 'relative' }}>
            <div style={{ position: 'absolute', width: '70px', height: '70px', background: '#4f46e5', borderRadius: '50%', filter: 'blur(24px)', opacity: 0.2, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>
            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1)', border: '1px solid #c7d2fe', transform: 'rotate(-3deg)' }}>
              <div style={{ transform: 'rotate(3deg)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 10V7C16 4.79086 14.2091 3 12 3V3C9.79086 3 8 4.79086 8 7V10" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round"/>
                  <rect x="5" y="10" width="14" height="11" rx="3" fill="#4f46e5"/>
                  <circle cx="12" cy="15.5" r="1.5" fill="#ffffff"/>
                </svg>
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Yeni Parolanızı Belirleyin</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            TLA platformuna güvenli bir şekilde giriş yapmak için lütfen güçlü bir parola oluşturun.
          </p>
          
          {/* HESAP BİLGİSİ */}
          {userEmail && (
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', marginTop: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 600 }}>
                {userEmail}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Parola</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', boxSizing: 'border-box', background: '#f8fafc', transition: 'all 0.2s' }}
                onFocus={(e) => { e.target.style.background = '#ffffff'; e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)'; }}
                onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: loading ? '#94a3b8' : '#4f46e5', color: '#ffffff', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '8px', boxShadow: loading ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.25)' }}
            onMouseEnter={(e) => { if(!loading) e.currentTarget.style.backgroundColor = '#4338ca'; }}
            onMouseLeave={(e) => { if(!loading) e.currentTarget.style.backgroundColor = '#4f46e5'; }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Kaydediliyor...
              </span>
            ) : (
              'Parolayı Kaydet ve Devam Et'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}