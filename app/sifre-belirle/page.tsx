'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SifreBelirle() {
  const [sifre, setSifre] = useState('');
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const router = useRouter();

  const sifreyiKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMesaj('');

    try {
      // Supabase'de kullanıcının şifresini güncelliyoruz
      const { error } = await supabase.auth.updateUser({
        password: sifre
      });

      if (error) throw error;

      setMesaj('Şifreniz başarıyla oluşturuldu! Eğitmen paneline yönlendiriliyorsunuz...');
      
      // Başarılı olursa 2 saniye sonra panele yönlendir
      setTimeout(() => {
        router.push('/'); // Şimdilik ana sayfaya yönlendiriyoruz, sonra eğitmen paneline çeviririz
      }, 2000);

    } catch (error: any) {
      setMesaj('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Hoş Geldiniz, Hocam!</h2>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#555' }}>Hesabınızı aktifleştirmek için lütfen kalıcı şifrenizi belirleyin.</p>
      
      <form onSubmit={sifreyiKaydet} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="password"
          placeholder="Yeni Şifreniz (En az 6 karakter)"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          required
          minLength={6}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Kaydediliyor...' : 'Şifremi Kaydet ve Giriş Yap'}
        </button>
      </form>

      {mesaj && (
        <p style={{ marginTop: '20px', textAlign: 'center', color: mesaj.includes('Hata') ? 'red' : 'green' }}>
          {mesaj}
        </p>
      )}
    </div>
  );
}