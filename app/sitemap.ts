import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Buraya Vercel'den aldığın veya alacağın canlı site linkini yazmalısın
  // Şimdilik örnek bir link bırakıyorum, daha sonra kendi domainini yazarsın
  const baseUrl = 'https://turkish-learning-academy.vercel.app'; 

  // Veritabanından yayındaki blog yazılarını çekiyoruz
  const { data: posts } = await supabase
    .from('blog_yazilari')
    .select('slug, created_at')
    .eq('durum', 'Yayında');

  // Her bir blog yazısı için Google'a verilecek URL yapısını hazırlıyoruz
  const blogUrls = posts?.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.created_at),
  })) || [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/egitmen-bul`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/become-teacher`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
    },
    ...blogUrls, // Dinamik blog yazılarımızı buraya ekliyoruz
  ];
}