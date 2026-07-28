"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// 🚀 ÖNEMLİ: VideoRoom bileşenini sunucuda (SSR) çalıştırmamak için dinamik yüklüyoruz!
const VideoRoom = dynamic(() => import("../ders-odasi/VideoRoom"), {
  ssr: false,
});

export default function CanliDersEntegrasyonPage() {
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"secim" | "ogretmen" | "ogrenci">("secim");
  
  // YENİ: Öğrencinin linki unutan tarayıcısına karşı manuel giriş alanı
  const [manuelLink, setManuelLink] = useState("");

  // Sayfa açıldığında aktif bir ders var mı diye kontrol et (Öğrenci için)
  useEffect(() => {
    const aktifDers = localStorage.getItem("aktif_ders_linki");
    if (aktifDers && role === "ogrenci") {
      setRoomUrl(aktifDers);
    }
  }, [role]);

  // ÖĞRETMEN: Canlı ders başlatma fonksiyonu
  const baslatCanliDers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/live/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `matematik-dersi-${Date.now()}` }),
      });

      const data = await response.json();

      // Agora için temiz bir kanal adı üretiyoruz
      const kanalAdi = data.roomUrl ? encodeURIComponent(data.roomUrl) : `tla-academy-oda-${Date.now()}`;
      
      setRoomUrl(kanalAdi);
      localStorage.setItem("aktif_ders_linki", kanalAdi);

    } catch (error) {
      console.error(error);
      // Hata alsa bile test için temiz bir kanal adı atıyoruz
      const guvenliOda = "tla-academy-test-odasi";
      setRoomUrl(guvenliOda);
      localStorage.setItem("aktif_ders_linki", guvenliOda);
    } finally {
      setLoading(false);
    }
  };

  // Ders Kapatma (Öğretmen ve Öğrenci ayrımı)
  const dersiKapat = () => {
    // Sadece öğretmen "Dersi Bitir" derse linki hafızadan tamamen sil.
    if (role === "ogretmen") {
      localStorage.removeItem("aktif_ders_linki");
    }
    // Öğrenci sadece odadan çıkar, link silinmez.
    setRoomUrl(null);
    setRole("secim");
  };

  return (
    <div className="max-w-5xl mx-auto p-8" style={{ fontFamily: "sans-serif" }}>
      <div className="mb-8 border-b border-slate-200 pb-4" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#1e293b" }}>Canlı Sınıf Entegrasyonu</h1>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Sistemin öğretmen ve öğrenci tarafındaki entegrasyon simülasyonu.</p>
      </div>

      {role === "secim" && (
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", padding: "3rem", backgroundColor: "#f8fafc", borderRadius: "1rem" }}>
          <button 
            onClick={() => setRole("ogretmen")}
            style={{ padding: "1.5rem 2rem", fontSize: "1.2rem", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600" }}
          >
            Öğretmen Paneli 👨‍🏫
          </button>
          <button 
            onClick={() => setRole("ogrenci")}
            style={{ padding: "1.5rem 2rem", fontSize: "1.2rem", backgroundColor: "#0ea5e9", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600" }}
          >
            Öğrenci Paneli 🎒
          </button>
        </div>
      )}

      {/* ÖĞRETMEN EKRANI */}
      {role === "ogretmen" && !roomUrl && (
        <div style={{ textAlign: "center", padding: "2rem", border: "1px solid #e2e8f0", borderRadius: "0.75rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Öğretmen olarak derse hazırsınız.</h3>
          <button
            onClick={baslatCanliDers}
            disabled={loading}
            style={{ backgroundColor: "#4f46e5", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
          >
            {loading ? "Ders Açılıyor..." : "Canlı Dersi Başlat ve Öğrencileri Çağır"}
          </button>
        </div>
      )}

      {/* ÖĞRENCİ EKRANI (MANUEL GİRİŞ EKLENDİ) */}
      {role === "ogrenci" && !roomUrl && (
        <div style={{ textAlign: "center", padding: "2rem", border: "1px solid #e2e8f0", borderRadius: "0.75rem", backgroundColor: "#f0f9ff" }}>
          <h3 style={{ color: "#0369a1", marginBottom: "1rem" }}>Dersi Bekliyorsunuz veya Tekrar Katılın</h3>
          <p style={{ color: "#0c4a6e", marginBottom: "1rem" }}>Eğer sistem açık dersi otomatik bulamadıysa, Öğretmenin sol üst köşesinde yazan <strong>Ders ID</strong>'sini buraya girin:</p>
          
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <input 
              type="text" 
              placeholder="Örn: tla-academy-oda-1721..." 
              value={manuelLink}
              onChange={(e) => setManuelLink(e.target.value)}
              style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #94a3b8", width: "100%", maxWidth: "300px" }}
            />
            <button 
              onClick={() => {
                if(manuelLink) {
                  setRoomUrl(manuelLink);
                  localStorage.setItem("aktif_ders_linki", manuelLink); // Hafızaya tekrar kazı!
                }
              }}
              style={{ backgroundColor: "#0ea5e9", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600" }}
            >
              Derse Katıl
            </button>
          </div>

          <button onClick={() => setRole("secim")} style={{ background: "none", border: "none", textDecoration: "underline", cursor: "pointer", color: "#64748b" }}>Geri Dön</button>
        </div>
      )}

      {/* CANLI YAYIN ODASI */}
      {roomUrl && (
        <div>
          <div style={{ backgroundColor: "#f1f5f9", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "600" }}>🚨 Şu an {role === "ogretmen" ? "Yayın Yapıyorsunuz" : "Dersteydiniz (Öğrenci)"}</span>
            <button onClick={dersiKapat} style={{ backgroundColor: "#ef4444", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer" }}>
              {role === "ogretmen" ? "Dersi Bitir (Herkes İçin)" : "Dersten Çık"}
            </button>
          </div>
          
          <VideoRoom channelName={roomUrl} userRole={role} />
        </div>
      )}
    </div>
  );
}