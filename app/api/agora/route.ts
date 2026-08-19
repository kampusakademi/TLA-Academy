import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log("=== AGORA TOKEN API TETİKLENDİ ===");
    
    const body = await request.json();
    const channelName = body.channelName || "test_odasi";
    console.log("İstenen Kanal Adı:", channelName);

    let agora;
    try {
      agora = require('agora-access-token');
    } catch (pkgErr) {
      console.error("🚨 KRİTİK HATA: 'agora-access-token' paketi yüklü değil!");
      return NextResponse.json({ error: "Lütfen terminalde 'npm install agora-access-token' komutunu çalıştırın." });
    }

    const RtcTokenBuilder = agora.RtcTokenBuilder;
    const RtcRole = agora.RtcRole;

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error("🚨 KRİTİK HATA: .env.local dosyasında Agora şifreleri eksik!");
      return NextResponse.json({ error: "Agora App ID veya Certificate bulunamadı." });
    }

    // 🚀 ÇÖZÜM BURADA: uid değerini 0 (Joker/Wildcard) yapıyoruz!
    const uid = 0; 
    
    const role = RtcRole.PUBLISHER;
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600; 

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId, 
      appCertificate, 
      channelName, 
      uid, 
      role, 
      privilegeExpiredTs
    );

    console.log("✅ Token Başarıyla Üretildi! Odaya giriliyor...");
    return NextResponse.json({ token: token, uid: uid });

  } catch (error: any) {
    console.error("🚨 SUNUCU HATASI:", error);
    return NextResponse.json({ error: error.message });
  }
}