import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { roomName } = await req.json();

    // Daily.co API'sine "Bize yeni bir canlı yayın odası aç" diyoruz
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName || `ders-${Date.now()}`,
        privacy: "public", 
        properties: {
          enable_chat: true,
          enable_screenshare: true, // Ekran paylaşımı açık
          start_video_off: false,    // Kamera açık başlasın
          start_audio_off: false,    // Mikrofon açık başlasın
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message }, { status: response.status });
    }

    // Başarılıysa bize odanın linkini dönecek
    return NextResponse.json({ roomUrl: data.url, roomName: data.name });
  } catch (error) {
    return NextResponse.json({ error: "Oda oluşturulamadı." }, { status: 500 });
  }
}