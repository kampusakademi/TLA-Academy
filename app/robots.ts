import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Google'ın indekslemesini İSTEMEDİĞİMİZ gizli/özel sayfalar
      disallow: [
        '/teacher-dashboard/', 
        '/admin-dashboard/', 
        '/sifre-belirle/', 
        '/sifre-yenile/'
      ],
    },
    sitemap: 'https://turkishlearningacademy.com/sitemap.xml',
  }
}