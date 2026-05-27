// Small fade animation on scroll

const heroImages = [
  "./images/truckbsB.jpeg",
  "./images/truckfrtB.jpeg",
  "./images/hero1.jpeg"
  "./images/hero2.jpeg"
  "./images/hero3.jpeg"
  "./images/hero4.jpeg"
  "./images/hero5.jpeg"
  "./images/hero6.jpeg"
];

const randomImage =
  heroImages[Math.floor(Math.random() * heroImages.length)];

document.querySelector(".hero").style.backgroundImage =
  `linear-gradient(
    to bottom,
    rgba(0,0,0,0.45),
    rgba(15,17,21,1)
  ),
  url('${randomImage}')`;

const cards = document.querySelectorAll('.card, .price-card');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0px)';
    }
  });
});

cards.forEach((card) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'all 0.6s ease';

  observer.observe(card);
});
