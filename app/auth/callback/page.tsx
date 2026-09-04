'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState('Hesabınız doğrulanıyor, lütfen bekleyin...');

  useEffect(() => {
    const processAuth = async () => {
      // Vercel hata vermesin diye useSearchParams yerine tarayıcının kendi URL okuyucusunu kullanıyoruz
      const params = new URLSearchParams(window.location.search);
      const role = params.get('role') || 'ogrenci';
      const mode = params.get('mode') || 'login';

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push('/');
        return;
      }

      const user = session.user;

      try {
        // ============================================
        // SENARYO 1: GİRİŞ YAPMA (LOGIN) KONTROLÜ
        // ============================================
        if (mode === 'login') {
          if (role === 'ogrenci') {
            const { data: student } = await supabase.from('ogrenciler').select('id').eq('user_id', user.id).maybeSingle();
            if (!student) {
              await supabase.auth.signOut();
              alert("Bu Google hesabına bağlı bir öğrenci kaydı bulunamadı. Lütfen önce 'Kayıt Ol' sekmesinden hesap oluşturun.");
              router.push('/');
              return;
            }
            router.push('/student-dashboard');
          } 
          else if (role === 'ogretmen') {
            const { data: teacher } = await supabase.from('egitmenler').select('id').eq('user_id', user.id).maybeSingle();
            if (!teacher) {
              await supabase.auth.signOut();
              alert("Bu Google hesabına bağlı onaylı bir eğitmen kaydı bulunamadı! Eğitmen olmak için 'Öğretmen Ol' sayfasından başvuru yapmalısınız.");
              router.push('/');
              return;
            }
            router.push('/teacher-dashboard');
          }
        }
        
        // ============================================
        // SENARYO 2: KAYIT OLMA (REGISTER) KONTROLÜ
        // ============================================
        else if (mode === 'register') {
          if (role === 'ogrenci') {
            const { data: student } = await supabase.from('ogrenciler').select('id').eq('user_id', user.id).maybeSingle();
            
            // Eğer veritabanında öğrenci kaydı yoksa (İlk defa Google ile giriyorsa)
            // Öğrenci tablosuna adını ve mailini otomatik ekle
            if (!student) {
              setMessage('Öğrenci profiliniz başarıyla oluşturuluyor...');
              const newStudentData = {
                user_id: user.id,
                email: user.email,
                tam_ad: user.user_metadata?.full_name || 'Öğrenci',
                seviye: 'Belirlenmedi',
                durum: 'Aktif'
              };
              await supabase.from('ogrenciler').insert([newStudentData]);
            }
            router.push('/student-dashboard');
          } 
          else if (role === 'ogretmen') {
            await supabase.auth.signOut();
            router.push('/become-teacher');
          }
        }
      } catch (err) {
        console.error("Doğrulama hatası:", err);
        router.push('/');
      }
    };

    // Supabase'in Google'dan gelen token'ı işleyebilmesi için 1 saniye mühlet veriyoruz
    setTimeout(processAuth, 1000);

  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#64748b', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{message}</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}