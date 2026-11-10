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

  // 4. Custom Neon Cursor Effect (Desktop Only)
  if (window.innerWidth > 992) {
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    const cursorDot = document.createElement('div');
    cursorDot.classList.add('custom-cursor-dot');
    
    document.body.appendChild(cursor);
    document.body.appendChild(cursorDot);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    });

    function renderCursor() {
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    const interactiveElements = document.querySelectorAll('a, button, .interactive-card, .gallery-item');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  // 5. Parallax Effect Halus pada Hero Background
  const heroSection = document.querySelector('.hero-section');
  const heroGlowBg = document.querySelector('.hero-glow-bg');

  if (heroSection && heroGlowBg) {
    window.addEventListener('scroll', () => {
      let scrollY = window.pageYOffset;
      if (scrollY <= heroSection.offsetHeight) {
        heroGlowBg.style.transform = `translate(-50%, calc(-50% + ${scrollY * 0.3}px))`;
      }
    });
  }
});
