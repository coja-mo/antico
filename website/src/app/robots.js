export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/pos/', '/api/'],
      },
    ],
    sitemap: 'https://anticorestaurant.ca/sitemap.xml',
  };
}
