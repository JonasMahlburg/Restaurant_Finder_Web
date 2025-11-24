
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.carousel-container');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');

  if (!carousel || !prevBtn || !nextBtn) return;

  const getScrollAmount = () => {
    const first = carousel.querySelector('.images');
    if (!first) return carousel.clientWidth * 0.8;
    const rect = first.getBoundingClientRect();
    return Math.round(rect.width + 20);
  };

  const updateButtons = () => {
    prevBtn.disabled = carousel.scrollLeft <= 0;
    nextBtn.disabled = Math.ceil(carousel.scrollLeft + carousel.clientWidth) >= carousel.scrollWidth;
  };

  prevBtn.addEventListener('click', () => {
    const amt = getScrollAmount();
    carousel.scrollBy({ left: -amt, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    const amt = getScrollAmount();
    carousel.scrollBy({ left: amt, behavior: 'smooth' });
  });

  carousel.addEventListener('scroll', () => {

    updateButtons();
  });

  window.addEventListener('resize', updateButtons);
  updateButtons();
});
