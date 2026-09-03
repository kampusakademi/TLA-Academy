import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://turkishlearningacademy.com';

  // 1. Sabit (Statik) Sayfalar
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/become-teacher`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // 2. Veritabanından Eğitmenleri Çek
  const { data: egitmenler } = await supabase
    .from('egitmenler')
    .select('id, user_id, durum')
    .eq('durum', 'Aktif');

  const teacherRoutes: MetadataRoute.Sitemap = egitmenler 
    ? egitmenler.map((egitmen) => ({
        url: `${baseUrl}/teachers/${egitmen.user_id || egitmen.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9, // Eğitmen profilleri çok önemli, puanı yüksek tutuyoruz
      }))
    : [];

  // 3. Veritabanından Blog Yazılarını Çek (Eğer eklediysen)
  const { data: bloglar } = await supabase
    .from('blog_yazilari')
    .select('slug, created_at')
    .eq('durum', 'Yayında');

  const blogRoutes: MetadataRoute.Sitemap = bloglar
    ? bloglar.map((blog) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: new Date(blog.created_at),
        changeFrequency: 'monthly',
        priority: 0.7,
      }))
    : [];

  // Tüm rotaları birleştirip Google'a sunuyoruz
  return [...staticRoutes, ...teacherRoutes, ...blogRoutes];
}