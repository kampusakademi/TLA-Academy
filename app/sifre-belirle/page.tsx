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

  useEffect(() => {
    let isMounted = true;

    const setupSession = async () => {
      // 1. Zaten oturum varsa direkt geç
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (isMounted) setVerifying(false);
        return;
      }

      // 2. Linkin içindeki parametreleri cımbızla çek (URL veya Hash içinden)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      // Hash (#) sonrasını al
      const hash = window.location.hash.substring(1); 
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      // 3. EĞER YENİ NESİL (PKCE) KOD VARSA
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && isMounted) {
          setErrorMsg("Davet linki kullanılmış veya geçersiz. (" + error.message + ")");
          setVerifying(false);
        }
      } 
      // 🚀 4. EĞER ESKİ NESİL (HASH) VARSA -> ZORLA İÇERİ AL!
      else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error && isMounted) {
          setErrorMsg("Oturum açılamadı: " + error.message);
          setVerifying(false);
        } else if (isMounted) {
          // Başarıyla içeri alındı! Adres çubuğundaki o uzun karmaşık linki temizle (yenileyince hata vermesin diye)
          window.history.replaceState(null, '', window.location.pathname);
          setVerifying(false);
        }
      } 
      // Hiçbir şey yoksa
      else {
        if (isMounted) {
          setErrorMsg("Eksik bağlantı: Bu sayfaya yalnızca e-postanıza gelen tek kullanımlık davet linkinden ulaşabilirsiniz.");
          setVerifying(false);
        }
      }
    };

    setupSession();

    // Arka plan dinleyicisi
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && isMounted) {
        setVerifying(false);
        setErrorMsg(''); 
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      alert("Şifreniz en az 6 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      alert("🎉 Şifreniz başarıyla oluşturuldu! Hesabınız artık aktif.");
      router.push('/'); 
      
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
        <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Şifreli bağlantınız çözülüyor...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Bağlantı Hatası</h1>
        <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: '24px', maxWidth: '450px' }}>{errorMsg}</p>
        <button onClick={() => router.push('/')} style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Hesabınızı Aktifleştirin</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
            TLA Eğitmen ağına hoş geldiniz. Devam etmek için lütfen kalıcı şifrenizi belirleyin.
          </p>
        </div>

        <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Yeni Şifreniz</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: loading ? '#94a3b8' : '#4f46e5', color: '#ffffff', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {loading ? 'Şifre Kaydediliyor...' : 'Şifremi Belirle ve Sisteme Gir'}
          </button>
        </form>

      </div>
    </div>
  );
}