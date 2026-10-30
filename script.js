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
  // The first hero image is in the HTML. Each follow-up slide is fetched one at a time, only
  // after the page has loaded, and only joins the rotation once it is fully decoded.
  const heroSlides = ['/images/hero1-slide.webp', '/images/truckextB-slide.webp', '/images/hero6-slide.webp', '/images/truckbsB-slide.webp', '/images/truckfrtB-slide.webp'];
  const saveData = navigator.connection && navigator.connection.saveData;
  if (!saveData && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) window.addEventListener('load', () => {
    const slides = [hero.querySelector('.hero-slide')];
    let active = 0;
    let next = 0;
    let loading = false;

    const loadNext = () => {
      if (loading || next >= heroSlides.length) return;
      loading = true;
      const image = new Image();
      image.className = 'hero-image hero-slide';
      image.alt = '';
      image.src = heroSlides[next];
      next += 1;
      image.decode().then(() => {
        hero.insertBefore(image, hero.querySelector('.hero-shade'));
        slides.push(image);
      }).catch(() => {}).finally(() => { loading = false; });
    };

    hero.classList.add('has-slideshow');
    slides[0].classList.add('is-active');
    window.setTimeout(loadNext, 250);
    window.setInterval(() => {
      if (slides.length > 1) {
        slides[active].classList.remove('is-active');
        active = (active + 1) % slides.length;
        slides[active].classList.add('is-active');
      }
      loadNext();
    }, 5000);
  }, { once: true });
}
