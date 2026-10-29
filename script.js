const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      navigation.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
    }
  });
}

const hero = document.querySelector('.hero');

if (hero) {
  // The first hero image is immediately available. Load just two compressed follow-up images after it paints.
  const heroSlides = ['/images/hero4-mobile.webp', '/images/truckbsB-mobile.webp'];
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      let loaded = 0;
      heroSlides.forEach((src) => {
        const image = new Image();
        image.className = 'hero-image hero-slide';
        image.alt = '';
        image.decoding = 'async';
        image.onload = () => {
          loaded += 1;
          if (loaded === heroSlides.length) hero.classList.add('has-slideshow');
        };
        image.src = src;
        hero.insertBefore(image, hero.querySelector('.hero-shade'));
      });
    }, 250);
  }, { once: true });
}
