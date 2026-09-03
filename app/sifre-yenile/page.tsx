'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setIsError(true);
      setMessage('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // Supabase, linke tıklandığı an arka planda oturumu geçici olarak açar.
      // Bu yüzden doğrudan kullanıcı şifresini güncelleyebiliriz.
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setIsError(false);
      setMessage('Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...');
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);

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
          <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce3', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>Yeni Şifre Belirle</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            Lütfen hesabınız için yeni, güvenli bir şifre girin.
          </p>
        </div>

        {message && (
          <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '20px', backgroundColor: isError ? '#fee2e2' : '#dcfce3', color: isError ? '#ef4444' : '#166534', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}` }}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Yeni Şifre</label>
            <input 
              type="password" 
              required
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="En az 6 karakter" 
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', boxSizing: 'border-box', backgroundColor: '#f8fafc' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || password.length < 6} 
            style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: (loading || password.length < 6) ? '#94a3b8' : '#16a34a', color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', cursor: (loading || password.length < 6) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: (loading || password.length < 6) ? 'none' : '0 4px 14px rgba(22, 163, 74, 0.4)' }}
          >
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>

      </div>
    </div>
  );
}