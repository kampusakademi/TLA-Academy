"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      console.log("SIGNUP DATA:", data);
      console.log("SIGNUP ERROR:", error);

      if (error) {
        alert("Hata: " + error.message);
        return;
      }

      alert("Kayıt isteği gönderildi. Konsolu kontrol et (F12).");

      console.log("USER:", data.user);
      console.log("SESSION:", data.session);
    } catch (err) {
      console.error("REGISTER CRASH:", err);
      alert("Beklenmeyen hata oluştu.");
    }
  }

  return (
    <div>
      <h1>Kayıt Ol</h1>

      <input
        placeholder="Ad"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Şifre"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleSubmit}>
        Kayıt Ol
      </button>
    </div>
  );
}