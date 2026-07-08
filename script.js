// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const indexNav = document.getElementById('indexNav');

navToggle.addEventListener('click', () => {
  const isOpen = indexNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Close mobile nav after clicking a link
indexNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    indexNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Scroll-spy: highlight the active section + slide the indicator pill
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.index-nav__list a');
const navIndicator = document.getElementById('navIndicator');

const setActive = (id) => {
  navLinks.forEach(link => {
    const active = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('is-active', active);
    if (active && navIndicator) {
      navIndicator.style.transform = `translateY(${link.offsetTop}px)`;
      navIndicator.style.height = `${link.offsetHeight}px`;
    }
  });
};

const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setActive(entry.target.id);
    }
  });
}, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

sections.forEach(section => spyObserver.observe(section));

// Position indicator correctly once fonts/layout settle
window.addEventListener('load', () => {
  const activeLink = document.querySelector('.index-nav__list a.is-active');
  if (activeLink && navIndicator) {
    navIndicator.style.transform = `translateY(${activeLink.offsetTop}px)`;
    navIndicator.style.height = `${activeLink.offsetHeight}px`;
  }
});

// Reveal each section (and stagger its children) the first time it enters view
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

sections.forEach(section => revealObserver.observe(section));

// Subtle hover tilt on project cards
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${y * -4}deg) rotateY(${x * 4}deg) translateY(-2px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ---------- Dark mode toggle (persisted) ----------
const THEME_KEY = 'mahak-portfolio-theme';
const applyTheme = (theme) => {
  document.body.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage unavailable */ }
};
const storedTheme = (() => {
  try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
})();
if (storedTheme) {
  applyTheme(storedTheme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  applyTheme('dark');
}
const toggleTheme = () => {
  const current = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(current);
};
['themeToggle', 'themeToggleDesktop'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', toggleTheme);
});

// ---------- Scroll progress bar ----------
const scrollProgress = document.getElementById('scrollProgress');
const updateScrollProgress = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (scrollProgress) scrollProgress.style.width = `${pct}%`;
};
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// ---------- Typewriter line under the role ----------
const typewriterEl = document.getElementById('typewriterText');
const typewriterPhrases = [
  'AI & ML intern.',
  'Data Analyst intern.',
  'Competitive Programmer.'
];
if (typewriterEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let phraseIndex = 0, charIndex = 0, deleting = false;
  const tick = () => {
    const phrase = typewriterPhrases[phraseIndex];
    if (!deleting) {
      charIndex++;
      typewriterEl.textContent = phrase.slice(0, charIndex);
      if (charIndex === phrase.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      charIndex--;
      typewriterEl.textContent = phrase.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % typewriterPhrases.length;
      }
    }
    setTimeout(tick, deleting ? 40 : 65);
  };
  tick();
} else if (typewriterEl) {
  typewriterEl.textContent = typewriterPhrases[0];
}

// ---------- Animated counters ----------
const counters = document.querySelectorAll('.counter');
const animateCounter = (el) => {
  const target = parseInt(el.dataset.target, 10) || 0;
  const duration = 900;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(progress * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });
counters.forEach(c => counterObserver.observe(c));

// ---------- Ambient network background (canvas) ----------
(() => {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr;
  let points = [];

  const isDark = () => document.body.getAttribute('data-theme') === 'dark';
  const dotColor = () => isDark() ? 'rgba(232,163,61,0.55)' : 'rgba(20,23,28,0.35)';
  const lineColor = () => isDark() ? 'rgba(31,111,99,0.35)' : 'rgba(31,111,99,0.18)';

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(60, Math.round((width * height) / 24000));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.4 + 0.6
    }));
  };

  const drawFrame = () => {
    ctx.clearRect(0, 0, width, height);
    const linkDist = 130;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (!reduceMotion) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = dotColor();
      ctx.fill();
    }

    ctx.strokeStyle = lineColor();
    ctx.lineWidth = 1;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist) {
          ctx.globalAlpha = 1 - dist / linkDist;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  const loop = () => {
    drawFrame();
    if (!reduceMotion) requestAnimationFrame(loop);
  };

  resize();
  window.addEventListener('resize', resize);
  loop();
})();
