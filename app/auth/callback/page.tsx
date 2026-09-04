'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const [message, setMessage] = useState('Google ile güvenli bağlantı kuruluyor...');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // React'in useEffect'i 2 kere çalıştırmasını engellemek için kontrol
    let isProcessed = false;

    const handleAuth = async () => {
      if (isProcessed) return;
      isProcessed = true;

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const role = params.get('role') || 'ogrenci';
        const mode = params.get('mode') || 'login';

        // 1. YENİ SUPABASE GÜVENLİK AKIŞI (PKCE): URL'deki 'code' şifresini oturuma çevir
        if (code) {
          setMessage('Güvenlik kodu doğrulanıyor...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        // 2. OTURUM BİLGİSİNİ AL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Eğer oturum oluşturulamadıysa sessizce atmak yerine HATA göster!
        if (sessionError || !session) {
          setErrorMsg('Google oturumu alınamadı. Lütfen tekrar deneyin.');
          setTimeout(() => window.location.replace('/'), 3000);
          return;
        }

        const user = session.user;
        setMessage('Veritabanı kayıtları kontrol ediliyor...');

        // ============================================
        // SENARYO 1: GİRİŞ YAPMA (LOGIN) KONTROLÜ
        // ============================================
        if (mode === 'login') {
          if (role === 'ogrenci') {
            const { data: student } = await supabase.from('ogrenciler').select('id').eq('user_id', user.id).maybeSingle();
            
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
            
            // Eğer veritabanında öğrenci kaydı yoksa otomatik ekle
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
            // Gizli butonu bulup basanlara karşı güvenlik kilidi
            await supabase.auth.signOut();
            window.location.replace('/become-teacher');
          }
        }

      } catch (err: any) {
        console.error("Doğrulama hatası:", err);
        setErrorMsg("Giriş sırasında bir hata oluştu: " + (err.message || "Bilinmeyen hata"));
        setTimeout(() => { window.location.replace('/'); }, 4000);
      }
    };

    handleAuth();

  }, []);

  // EĞER HATA VARSA ŞIK BİR KIRMZI UYARI EKRANI GÖSTER
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