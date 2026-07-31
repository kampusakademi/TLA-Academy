// lib/useTranslation.ts
'use client';

import { useState, useEffect } from 'react';
import { dictionary, Language } from './dictionary';

export function useTranslation() {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    // 1. İlk açılışta hafızadan oku
    const saved = (localStorage.getItem('app_lang') as Language) || 'en';
    setLang(saved);

    // 2. Başka bir bileşenden/sayfadan dil değiştiğinde anında yakala (Sayfa yenilemeden!)
    const handleStorageChange = () => {
      const currentLang = (localStorage.getItem('app_lang') as Language) || 'en';
      setLang(currentLang);
    };

    window.addEventListener('languagechange_event', handleStorageChange);
    window.addEventListener('storage', handleStorageChange); // Diğer sekmeler için

    return () => {
      window.removeEventListener('languagechange_event', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    t: dictionary[lang],
    lang
  };
}