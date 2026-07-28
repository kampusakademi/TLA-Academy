'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

// TS hatasını aşmak için as any kullanıyoruz
const VideoRoom = dynamic(() => import('../VideoRoom'), { ssr: false }) as any;

export default function CanliDersSayfasi() {
  const params = useParams();
  const dersId = params.dersId as string; 

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#020617' }}>
      {/* 🚀 ARTIK SABİT İSİM YOK, DOĞRUDAN DERSİN ID'Sİ KANAL ADI OLUYOR */}
      <VideoRoom channelName={dersId} />
    </div>
  );
}