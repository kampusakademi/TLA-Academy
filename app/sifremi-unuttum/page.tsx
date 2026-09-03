'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // Supabase'den şifre sıfırlama linki gönder
      // redirectTo kısmına kullanıcının linke tıklayınca gideceği sayfayı (Şifre Yenile) yazıyoruz
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/sifre-yenile`,
      });

      if (error) throw error;

      setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu (ve Spam klasörünü) kontrol edin.');
    } catch (error: any) {
      setIsError(true);
      setMessage("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif', padding: '20px' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%', maxWidth: '440px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔐</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Şifremi Unuttum</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Hesabınıza ait e-posta adresini girin, size yeni bir şifre belirleme bağlantısı gönderelim.</p>
        </div>

        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input 
            required 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="E-posta adresiniz" 
            style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontWeight: 500, boxSizing: 'border-box' }} 
          />

          {message && (
            <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: isError ? '#fee2e2' : '#dcfce7', color: isError ? '#ef4444' : '#166534', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: loading ? '#94a3b8' : '#4f46e5', color: '#ffffff', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)', transition: 'background-color 0.2s' }}
          >
            {loading ? 'Bağlantı Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
            ← Giriş Ekranına Dön
          </button>
        </div>
      </div>
    </div>
  );
}