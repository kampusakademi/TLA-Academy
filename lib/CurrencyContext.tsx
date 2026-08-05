'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Güncel piyasa kurlarına göre güncellenmiş oranlar (Ağustos 2026)
// 1 USD = ~47.58 TL -> 1 TL = ~0.021 USD
// 1 EUR = ~54.98 TL -> 1 TL = ~0.018 EUR
export const currencies = {
  TRY: { symbol: '₺', name: 'TL', rate: 1 },
  USD: { symbol: '$', name: 'USD', rate: 0.021 }, 
  EUR: { symbol: '€', name: 'EUR', rate: 0.018 }, 
};

export type CurrencyCode = keyof typeof currencies;

interface CurrencyContextType {
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (code: CurrencyCode) => void;
  formatPrice: (priceInTL: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('TRY');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('userCurrency') as CurrencyCode;
    if (savedCurrency && currencies[savedCurrency]) {
      setSelectedCurrency(savedCurrency);
    }
  }, []);

  const handleSetCurrency = (code: CurrencyCode) => {
    setSelectedCurrency(code);
    localStorage.setItem('userCurrency', code);
  };

  const formatPrice = (priceInTL: number) => {
    const currency = currencies[selectedCurrency];
    const convertedPrice = priceInTL * currency.rate;
    
    const fractionDigits = selectedCurrency === 'TRY' ? 0 : 1;
    const formattedInput = convertedPrice.toFixed(fractionDigits);

    return `${formattedInput}${currency.symbol}`;
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency: handleSetCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};