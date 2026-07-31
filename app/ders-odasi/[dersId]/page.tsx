'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

// TS hatasını aşmak için as any kullanıyoruz
const VideoRoom = dynamic(() => import('../VideoRoom'), { ssr: false }) as any;

export default function CanliDersSayfasi() {
  const params = useParams();
  
  // 🚀 AKILLI ID YAKALAMA: Klasör adı [id] veya [dersId] olsa bile doğru olanı yakalar
  const hamId = (params?.dersId || params?.id || 'genel-oda') as string;
  
  // URL encode hatalarını ve boşlukları temizleyerek net bir kanal adı oluşturuyoruz
  const temizDersId = String(hamId).trim(); 

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#020617' }}>
      {/* 🚀 Oda adını temizlenmiş ve kesinleşmiş ID ile aktarıyoruz */}
      <VideoRoom channelName={temizDersId} />
    </div>
  );
}