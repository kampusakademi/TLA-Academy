"use client";

import { useEffect, useState } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { DailyProvider } from "@daily-co/daily-react";

interface LiveRoomProps {
  roomUrl: string;
}

export default function LiveRoom({ roomUrl }: LiveRoomProps) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);

  useEffect(() => {
    if (!roomUrl) return;

    // Önce hafızada daha önceden kalma eski bir çağrı nesnesi var mı diye kontrol et
    let co = DailyIframe.getCallInstance();

    // Eğer yoksa sıfırdan oluştur
    if (!co) {
      co = DailyIframe.createCallObject({
        url: roomUrl,
      });
    }

    setCallObject(co);

    // Sayfadan çıkınca kamerayı temizle ve bağlantıyı kapat
    return () => {
      const currentCall = DailyIframe.getCallInstance();
      if (currentCall) {
        currentCall.destroy();
      }
    };
  }, [roomUrl]);

  if (!callObject) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-slate-900 rounded-xl text-white" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "500px", backgroundColor: "#0f172a", borderRadius: "0.75rem", color: "#fff" }}>
        <p>Canlı ders odası hazırlanıyor...</p>
      </div>
    );
  }

  if (!callObject) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-slate-900 rounded-xl text-white" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "500px", backgroundColor: "#0f172a", borderRadius: "0.75rem", color: "#fff" }}>
        <p>Canlı ders odası hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <DailyProvider callObject={callObject}>
      <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl" style={{ width: "100%", height: "600px", borderRadius: "0.75rem", overflow: "hidden", backgroundColor: "#0f172a" }}>
        <iframe
          title="Canlı Ders"
          src={roomUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
        />
      </div>
    </DailyProvider>
  );
}