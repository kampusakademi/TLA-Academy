'use client';

import { useState, useEffect } from 'react';

export default function LanguageToggle() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState('TR'); 

    // Sayfa açıldığında hafızadaki dili oku ve butona yansıt
    useEffect(() => {
        const savedLang = localStorage.getItem('app_lang') || 'en';
        setSelectedLang(savedLang.toUpperCase());
    }, []);

    const languages = [
        { code: 'TR', label: 'Türkçe', flagUrl: 'https://flagcdn.com/w20/tr.png' },
        { code: 'EN', label: 'English', flagUrl: 'https://flagcdn.com/w20/gb.png' }
    ];

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: isOpen ? '#f1f5f9' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#334155',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => !isOpen && (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => !isOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
                <img 
                    src={languages.find(l => l.code === selectedLang)?.flagUrl} 
                    alt={selectedLang} 
                    style={{ width: '20px', borderRadius: '2px', objectFit: 'cover' }} 
                />
                {selectedLang}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {isOpen && (
                <>
                    <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 998 }} />
                    
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                        zIndex: 999,
                        minWidth: '140px',
                        padding: '6px',
                        animation: 'fadeIn 0.15s ease-out'
                    }}>
                        {languages.map((lang) => {
                            const isSelected = selectedLang === lang.code;
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setSelectedLang(lang.code);
                                        const newLocale = lang.code.toLowerCase();
                                        
                                        // 1. Yeni dili hafızaya kaydet
                                        localStorage.setItem('app_lang', newLocale);
                                        
                                        // 2. useTranslation dosyandaki event'i tetikle
                                        window.dispatchEvent(new Event('languagechange_event'));
                                        
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        border: 'none',
                                        backgroundColor: isSelected ? '#f8fafc' : 'transparent',
                                        color: isSelected ? '#0f172a' : '#475569',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: isSelected ? 700 : 500,
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img src={lang.flagUrl} alt={lang.code} style={{ width: '20px', borderRadius: '2px', objectFit: 'cover' }} />
                                        {lang.label}
                                    </div>
                                    {isSelected && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}