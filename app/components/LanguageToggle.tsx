'use client';

import { useState, useEffect, useRef } from 'react';
import { Language } from '@/lib/dictionary';

export default function LanguageToggle() {
  const [lang, setLang] = useState<Language>('en');
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('app_lang') as Language;

    if (saved) {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);

    window.dispatchEvent(new Event('languagechange_event'));

    setOpen(false);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>

      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          background: '#fff',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.85rem',
        }}
      >

        {lang === 'en' ? (
          <>
            <img
              src="https://flagcdn.com/w20/gb.png"
              alt="English"
              width={20}
              height={15}
            />
            EN
          </>
        ) : (
          <>
            <img
              src="https://flagcdn.com/w20/tr.png"
              alt="Türkçe"
              width={20}
              height={15}
            />
            TR
          </>
        )}

        {/* Sabit merkezde dönen ince ok */}
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRight: '1.1px solid #0a0000',
            borderBottom: '1.1px solid #080101',
            transform: open
              ? 'rotate(225deg)'
              : 'rotate(45deg)',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
            marginLeft: '4px',
            marginTop: '0px',
          }}
        />

      </button>


      {open && (
        <div
          style={{
            position: 'absolute',
            top: '45px',
            right: 0,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '5px',
            minWidth: '130px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
            zIndex: 999,
          }}
        >

          {lang !== 'en' && (
            <button
              onClick={() => changeLanguage('en')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
            >
              <img
                src="https://flagcdn.com/w20/gb.png"
                alt="English"
                width={20}
                height={15}
              />
              English
            </button>
          )}


          {lang !== 'tr' && (
            <button
              onClick={() => changeLanguage('tr')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
            >
              <img
                src="https://flagcdn.com/w20/tr.png"
                alt="Türkçe"
                width={20}
                height={15}
              />
              Türkçe
            </button>
          )}

        </div>
      )}

    </div>
  );
}