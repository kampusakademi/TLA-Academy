"use client";

import { useState, useEffect } from "react";
import LiveRoom from "../components/LiveRoom";

export default function CanliDersEntegrasyonPage() {
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"secim" | "ogretmen" | "ogrenci">("secim");

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

      if (data.roomUrl) {
        setRoomUrl(data.roomUrl);
        // Linki sanki veritabanına yazar gibi tarayıcı hafızasına kaydediyoruz!
        localStorage.setItem("aktif_ders_linki", data.roomUrl);
      } else {
        // Kart girilmediği için uyarı verirse bile test amaçlı sahte bir linkle devam etmesini sağlıyoruz!
        const sahteLink = "https://demo.daily.co/test-odasi";
        setRoomUrl(sahteLink);
        localStorage.setItem("aktif_ders_linki", sahteLink);
      }
    } catch (error) {
      console.error(error);
      alert("Sistem simüle ediliyor...");
    } finally {
      setLoading(false);
    }
  };

  // Ders Kapatma (Hafızayı temizler)
  const dersiKapat = () => {
    localStorage.removeItem("aktif_ders_linki");
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

      {/* ÖĞRENCİ EKRANI */}
      {role === "ogrenci" && !roomUrl && (
        <div style={{ textAlign: "center", padding: "2rem", border: "1px solid #e2e8f0", borderRadius: "0.75rem", backgroundColor: "#f0f9ff" }}>
          <h3 style={{ color: "#0369a1", marginBottom: "1rem" }}>Canlı Ders Kontrol Ediliyor...</h3>
          <p style={{ color: "#0c4a6e" }}>Öğretmen henüz dersi başlatmamış olabilir. Sayfayı yenileyerek kontrol edebilirsiniz.</p>
          <button onClick={() => setRole("secim")} style={{ marginTop: "1rem", background: "none", border: "underline", cursor: "pointer", color: "#64748b" }}>Geri Dön</button>
        </div>
      )}

      {/* CANLI YAYIN ODASI (Burası entegre olan kısım) */}
      {roomUrl && (
        <div>
          <div style={{ backgroundColor: "#f1f5f9", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "600" }}>🚨 Şu an {role === "ogretmen" ? "Yayın Yapıyorsunuz" : "Dersteydiniz (Öğrenci)"}</span>
            <button onClick={dersiKapat} style={{ backgroundColor: "#ef4444", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer" }}>
              {role === "ogretmen" ? "Dersi Bitir (Herkes İçin)" : "Dersten Çık"}
            </button>
          </div>
          
          {/* Esas video ekranı */}
          <LiveRoom roomUrl={roomUrl} />
        </div>
      )}
    </div>
  );
}