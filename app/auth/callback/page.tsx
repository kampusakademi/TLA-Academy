'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const [message, setMessage] = useState('Google ile bağlantı kuruluyor...');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isProcessed = false;

    const processAuth = async (session: any) => {
      if (isProcessed) return;
      isProcessed = true;

      setMessage('Veritabanı kontrol ediliyor...');
      const params = new URLSearchParams(window.location.search);
      const role = params.get('role') || 'ogrenci';
      const mode = params.get('mode') || 'login';
      const user = session.user;

      try {
        // ============================================
        // SENARYO 1: GİRİŞ YAPMA (LOGIN) KONTROLÜ
        // ============================================
        if (mode === 'login') {
          if (role === 'ogrenci') {
            const { data: student } = await supabase.from('ogrenciler').select('id').eq('user_id', user.id).maybeSingle();
            
            // Eğer veritabanında öğrenci yoksa, oturumu kapat ve kırmızı hata ekranı göster!
            if (!student) {
              await supabase.auth.signOut();
              setErrorMsg("Bu Google hesabına bağlı bir öğrenci kaydı bulunamadı! Lütfen önce 'Kayıt Ol' sekmesinden hesap oluşturun.");
              setTimeout(() => { window.location.replace('/'); }, 4000);
              return;
            }
            window.location.replace('/student-dashboard');
          } 
          else if (role === 'ogretmen') {
            const { data: teacher } = await supabase.from('egitmenler').select('id').eq('user_id', user.id).maybeSingle();
            
            // Eğer veritabanında eğitmen yoksa, oturumu kapat ve kırmızı hata ekranı göster!
            if (!teacher) {
              await supabase.auth.signOut();
              setErrorMsg("Bu Google hesabına bağlı onaylı bir eğitmen kaydı bulunamadı! Eğitmen olmak için 'Öğretmen Ol' sayfasından başvuru yapmalısınız.");
              setTimeout(() => { window.location.replace('/become-teacher'); }, 4500);
              return;
            }
            window.location.replace('/teacher-dashboard');
          }
        }
        
        // ============================================
        // SENARYO 2: KAYIT OLMA (REGISTER) KONTROLÜ
        // ============================================
        else if (mode === 'register') {
          if (role === 'ogrenci') {
            const { data: student } = await supabase.from('ogrenciler').select('id').eq('user_id', user.id).maybeSingle();
            
            // Öğrenci sekmesinde ilk defa giriyorsa hemen hesabını oluştur
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
            window.location.replace('/student-dashboard');
          } 
          else if (role === 'ogretmen') {
            // Gizli butonu zorlayanlara karşı güvenlik kilidi
            await supabase.auth.signOut();
            window.location.replace('/become-teacher');
          }
        }
      } catch (err) {
        console.error("Doğrulama hatası:", err);
        setErrorMsg("Sistemsel bir hata oluştu, lütfen tekrar deneyin.");
        setTimeout(() => { window.location.replace('/'); }, 3000);
      }
    };

    // Google'ın oturum açma olayını (Event) doğrudan yakalar (Önbellek sorunlarını önler)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        processAuth(session);
      }
    });

    // Sayfa yüklendiğinde halihazırda oturum varsa işle
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        processAuth(session);
      } else {
        // Eğer 3 saniye içinde oturum bilgisi gelmezse, işlem iptal edilmiş demektir
        setTimeout(() => {
          if(!isProcessed) {
            setErrorMsg("Giriş işlemi iptal edildi veya zaman aşımına uğradı.");
            setTimeout(() => window.location.replace('/'), 3000);
          }
        }, 3000);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // EĞER HATA VARSA ŞIK BİR UYARI EKRANI GÖSTER
  if (errorMsg) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', padding: 20 }}>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '32px', borderRadius: '16px', maxWidth: '450px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: '#991b1b', margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: 900 }}>Erişim Reddedildi</h3>
          <p style={{ color: '#b91c1c', margin: 0, fontSize: '1rem', fontWeight: 600, lineHeight: 1.6 }}>{errorMsg}</p>
          <div style={{ marginTop: '24px', width: '100%', height: '4px', backgroundColor: '#fecaca', borderRadius: '2px', overflow: 'hidden' }}>
             <div style={{ width: '100%', height: '100%', backgroundColor: '#ef4444', animation: 'shrink 4s linear forwards' }}></div>
          </div>
          <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
        </div>
      </div>
    );
  }

  // HER ŞEY YOLUNDAYSA YÜKLENİYOR EKRANI GÖSTER
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#4f46e5', gap: 20 }}>
      <div style={{ width: 50, height: 50, border: '4px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{message}</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}