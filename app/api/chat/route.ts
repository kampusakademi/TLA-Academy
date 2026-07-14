import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { updatedMessages, userText } = await request.json();
    
    // API anahtarını güvenli server ortamında okuyoruz
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "API anahtarı bulunamadı!" }, { status: 500 });
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "Sen 'turkish learning akademy' platformunda çalışan, yabancılara Türkçe öğreten sevecen ve cana yakın bir AI Pratik Arkadaşısın. Karşındaki öğrencinin adı John, seviyesi B1. Onunla sıcak bir sohbet yürüt, kısa ve net cümleler kur. Eğer John dil bilgisi veya kelime hatası yaparsa, cevbının en altına '💡 Dil Bilgisi Notu:' başlığıyla hatasını nazikçe düzelt ve doğrusunu göster. Hata yapmazsa sadece sohbeti devam ettirecek sorular sor."
    });

    const history = updatedMessages.map((msg: any) => ({
      role: msg.sender === 'student' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userText);
    const aiResponse = result.response.text();

    return NextResponse.json({ text: aiResponse });
  } catch (error: any) {
    console.error("Gemini Server Hatası:", error);
    return NextResponse.json({ error: error.message || "Bağlantı hatası." }, { status: 500 });
  }
}
