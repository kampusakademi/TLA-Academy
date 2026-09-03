'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPassword() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // Supabase'de kullanıcının şifresini güncelle
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage('Şifreniz başarıyla güncellendi! Ana sayfaya yönlendiriliyorsunuz...');
      
      // Başarılı olursa 3 saniye sonra ana sayfaya (girişe) yolla
      setTimeout(() => {
        router.push('/');
      }, 3000);

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
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✨</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Yeni Şifre Belirle</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Lütfen hesabınız için yeni ve güvenli bir şifre girin.</p>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input 
            required 
            type="password" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            placeholder="Yeni Şifreniz (En az 6 karakter)" 
            minLength={6}
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
            style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: loading ? '#94a3b8' : '#10b981', color: '#ffffff', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)', transition: 'background-color 0.2s' }}
          >
            {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}