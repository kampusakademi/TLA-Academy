import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function POST(request: Request) {
  try {
    const { channelName } = await request.json();

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json({ error: 'Agora şifreleri eksik' }, { status: 500 });
    }

    // Şifrenin geçerlilik süresi (2 saat = 7200 saniye)
    const expirationTimeInSeconds = 7200; 
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Şifreyi üretiyoruz
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      0, // Otomatik kullanıcı ID'si
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return NextResponse.json({ token });
    
  } catch (error) {
    console.error("Token üretme hatası:", error);
    return NextResponse.json({ error: 'Şifre üretilemedi' }, { status: 500 });
  }
}