export default function manifest() {
  return {
    name: 'Antico Ristoranté',
    short_name: 'Antico',
    description: 'Fine Italian Dining in Sault Ste. Marie',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#d4a84b',
    icons: [
      {
        src: '/images/antico-logo-transparent.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
