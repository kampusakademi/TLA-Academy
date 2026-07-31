// app/components/LanguageToggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { Language } from '@/lib/dictionary';

export default function LanguageToggle() {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const savedLang = (localStorage.getItem('app_lang') as Language) || 'en';
    setLang(savedLang);
  }, []);

  const changeLanguage = (newLang: Language) => {
    if (newLang === lang) return;
    
    // 1. Hafızaya kaydet
    localStorage.setItem('app_lang', newLang);
    setLang(newLang);
    
    // 2. Tüm siteye anlık sinyal gönder (Sayfa yenilenmeden diğer bileşenler güncellensin)
    window.dispatchEvent(new Event('languagechange_event'));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '20px', padding: '3px', border: '1px solid #e2e8f0' }}>
      <button
        onClick={() => changeLanguage('en')}
        style={{
          padding: '6px 12px', borderRadius: '16px', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
          backgroundColor: lang === 'en' ? '#ffffff' : 'transparent',
          color: lang === 'en' ? '#0f172a' : '#64748b',
          boxShadow: lang === 'en' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.2s'
        }}
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => changeLanguage('tr')}
        style={{
          padding: '6px 12px', borderRadius: '16px', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
          backgroundColor: lang === 'tr' ? '#ffffff' : 'transparent',
          color: lang === 'tr' ? '#0f172a' : '#64748b',
          boxShadow: lang === 'tr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.2s'
        }}
      >
        🇹🇷 TR
      </button>
    </div>
  );
}