'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ForgotPasswordPage() {
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Kullanıcı maildeki linke tıklayınca bu adrese yönlendirilecek
        redirectTo: `${window.location.origin}/sifre-yenile`,
      });

      if (error) throw error;

      setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.');
    } catch (error: any) {
      setIsError(true);
      setMessage('Bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>Şifremi Unuttum</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            Hesabınıza kayıtlı e-posta adresinizi girin. Size şifrenizi sıfırlamanız için bir bağlantı göndereceğiz.
          </p>
        </div>

        {message && (
          <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '20px', backgroundColor: isError ? '#fee2e2' : '#dcfce3', color: isError ? '#ef4444' : '#166534', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}` }}>
            {message}
          </div>
        )}

        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>E-posta Adresi</label>
            <input 
              type="email" 
              required
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="ornek@mail.com" 
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', boxSizing: 'border-box', backgroundColor: '#f8fafc' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !email} 
            style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: (loading || !email) ? '#94a3b8' : '#4f46e5', color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', cursor: (loading || !email) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: (loading || !email) ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.4)' }}
          >
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/login" style={{ color: '#64748b', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
            ← Giriş Ekranına Dön
          </Link>
        </div>

      </div>
    </div>
  );
}