document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Navigation Toggle Menu
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
      } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    });

    // Close menu on navigation click
    document.querySelectorAll('.nav-item, .btn-nav-join').forEach(item => {
      item.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      });
    });
  }

  // 2. Highlight active nav item on scroll
  const sections = document.querySelectorAll('section, footer');
  const navItems = document.querySelectorAll('.nav-item');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.pageYOffset >= (sectionTop - sectionHeight / 3)) {
        current = section.getAttribute('id');
      }
    });

    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') && item.getAttribute('href').includes(current)) {
        item.classList.add('active');
      }
    });
  });

  // 3. Scroll Reveal Animation (Animasi Muncul Saat Discroll)
  const animatedElements = document.querySelectorAll(
    '.section-header, .card, .gallery-item, .schedule-card, .info-item, .map-container'
  );

  animatedElements.forEach((el, index) => {
    el.classList.add('reveal-init');
    el.style.transitionDelay = `${(index % 3) * 0.15}s`;
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  });

  animatedElements.forEach(el => {
    revealObserver.observe(el);
  });
});
