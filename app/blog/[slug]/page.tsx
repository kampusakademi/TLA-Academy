'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function BlogPostPage() {
  const router = useRouter();
  const params = useParams(); // 🚀 Next.js'te URL parametrelerini almanın en güvenli yolu
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSinglePost() {
      // params henüz yüklenmediyse bekle
      if (!params || !params.slug) return;

      // URL'deki olası özel karakterleri temiz metne çeviriyoruz
      const decodedSlug = decodeURIComponent(params.slug as string);

      const { data, error } = await supabase
        .from('blog_yazilari')
        .select('*')
        .eq('slug', decodedSlug)
        .single();

      if (!error && data) {
        setPost(data);
      } else {
        console.error("Veritabanı Hatası:", error);
      }
      setLoading(false);
    }
    
    fetchSinglePost();
  }, [params]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#64748b' }}>Makale yükleniyor...</div>;
  }

  if (!post) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <h1 style={{ fontSize: '4rem', margin: 0 }}>🔍</h1>
        <h2 style={{ color: '#0f172a', fontWeight: 800 }}>Makale Bulunamadı</h2>
        <p style={{ color: '#64748b' }}>Aradığınız yazı yayından kaldırılmış veya adresi değişmiş olabilir.</p>
        <button onClick={() => router.push('/blog')} style={{ marginTop: '24px', padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Bloga Dön</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: '"Inter", sans-serif' }}>
      
      {/* 🚀 NAVBAR */}
      <nav style={{ padding: '20px 8%', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e1b4b', margin: 0 }}>
            Turkish Learning Academy<span style={{ color: '#4f46e5' }}>.</span>
          </h1>
        </div>
        <button onClick={() => router.push('/blog')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '10px', color: '#0f172a', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
          ← Tüm Yazılar
        </button>
      </nav>

      {/* 🚀 MAKALE İÇERİĞİ */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
        
        {/* Üst Bilgiler */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '20px', fontWeight: 800, fontSize: '0.9rem', marginBottom: '24px' }}>
            {post.kategori}
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.2, margin: '0 0 24px 0' }}>
            {post.baslik}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#64748b', fontWeight: 600 }}>
            <span>{new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span style={{ width: '6px', height: '6px', backgroundColor: '#cbd5e1', borderRadius: '50%' }}></span>
            <span>⏱ {post.okuma_suresi} dk okuma süresi</span>
          </div>
        </div>

        {/* Kapak Görseli */}
        <div style={{ width: '100%', height: '400px', borderRadius: '24px', overflow: 'hidden', marginBottom: '48px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <img 
            src={post.gorsel_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop'} 
            alt={post.baslik} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>

        {/* 🚀 ANA METİN (İçerik) */}
        <article 
          style={{ fontSize: '1.15rem', color: '#334155', lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: post.icerik.replace(/\n/g, '<br/>') }}
        />

        {/* Alt Paylaşım Çizgisi */}
        <div style={{ marginTop: '60px', paddingTop: '32px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>Bu makaleyi faydalı buldunuz mu?</span>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Makale linki kopyalandı!'); }} style={{ padding: '10px 20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
            🔗 Linki Kopyala
          </button>
        </div>

      </main>
    </div>
  );
}