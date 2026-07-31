import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function POST(request: Request) {
  try {
    const { channelName } = await request.json();

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error("Agora App ID veya Certificate eksik!");
      return NextResponse.json({ error: 'Agora App ID veya Certificate eksik!' }, { status: 500 });
    }

    const uid = 0; // 0 verilmesi, Agora'nın kullanıcıya otomatik benzersiz bir ID atamasını sağlar
    const role = RtcRole.PUBLISHER; // Hem yayın yapma hem de karşı tarafı izleme yetkisi
    const expirationTimeInSeconds = 3600 * 4; // Token 4 saat boyunca geçerli
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Yeni ve güncel pakete (agora-token) uygun resmi token üretimi
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      expirationTimeInSeconds,
      privilegeExpiredTs
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Token oluşturma hatası:', error);
    return NextResponse.json({ error: 'Token oluşturulamadı' }, { status: 500 });
  }
}