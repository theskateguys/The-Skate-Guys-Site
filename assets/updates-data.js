// Edit this file for short homepage updates. Newest updates should stay first.
window.TSG_UPDATES = [
  {
    type: "Merch Drop",
    dateLabel: "July 2026",
    title: "Classic T-Shirt is live",
    body: "The limited edition community Classic T-Shirt is now in the merch store for $160 TTD.",
    ctaLabel: "Shop the T-Shirt",
    href: "merch.html",
    theme: "pink",
    tickerText: "Classic T-Shirt now available - $160 TTD - limited edition community gear"
  },
  {
    type: "Class Booking",
    dateLabel: "July 2026",
    title: "Class package bookings are open",
    body: "Choose your package, send your details, and TSG will confirm availability for Trinidad or Tobago.",
    ctaLabel: "Book a Class",
    href: "book.html",
    theme: "cyan",
    tickerText: "Class bookings open - Starter Pass, Beginner Bootcamp and Academy Monthly available"
  }
];

// Load the real Canoe Bay team image only on the homepage.
(() => {
  const heroScript = document.createElement('script');
  heroScript.src = 'assets/hero/canoe-bay-team.js';

  heroScript.onload = () => {
    if (!window.TSG_CANOEBAY_B64) return;

    const encoded = window.TSG_CANOEBAY_B64.replace(/-/g, '+').replace(/_/g, '/');
    const photo = new Image();
    photo.onload = () => {
      const heroArt = document.querySelector('.hero-art');
      if (!heroArt) return;

      const photoStyle = document.createElement('style');
      photoStyle.textContent = `
        .hero-art.hero-art-photo {
          background-image: linear-gradient(180deg, rgba(5,5,8,.04) 14%, rgba(5,5,8,.42) 100%), url('${photo.src}') !important;
          background-size: cover !important;
          background-position: center center !important;
        }
        .hero-art.hero-art-photo::before { display: none !important; }
        .hero-art.hero-art-photo::after { background: linear-gradient(180deg, transparent 35%, rgba(5,5,8,.25) 100%) !important; }
      `;
      document.head.appendChild(photoStyle);
      heroArt.classList.add('hero-art-photo');
      heroArt.querySelector('.hero-wheel')?.remove();
      heroArt.querySelector('.hero-logo')?.remove();
    };
    photo.src = `data:image/webp;base64,${encoded}`;
  };

  document.head.appendChild(heroScript);
})();
