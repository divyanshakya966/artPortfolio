import feather from 'feather-icons';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ─────────────────────────────────────────
   BOOTSTRAP
───────────────────────────────────────── */
gsap.registerPlugin(ScrollTrigger);
feather.replace();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth < 700;

/* ─────────────────────────────────────────
   BOKEH BUBBLE CANVAS
───────────────────────────────────────── */
(function initBokeh() {
  const canvas = document.getElementById('bokeh-canvas');
  if (!canvas || prefersReducedMotion) {
    if (canvas) canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let W, H, bubbles = [];

  // Colour palette matching the uploaded bokeh image
  const PALETTE = [
    [200, 230, 255],   // ice blue
    [180, 215, 245],   // sky blue
    [245, 200, 220],   // blush pink
    [160, 200, 240],   // steel blue
    [230, 240, 255],   // pale white-blue
    [255, 245, 230],   // warm cream
    [200, 168, 220],   // soft lavender
    [140, 190, 230],   // deep sky
  ];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function randomBetween(a, b) { return a + Math.random() * (b - a); }

  function createBubble(spawnAtBottom = false) {
    const r = randomBetween(isMobile() ? 14 : 22, isMobile() ? 60 : 110);
    const col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    return {
      x: randomBetween(0, W),
      y: spawnAtBottom ? H + r : randomBetween(-r, H + r),
      r,
      alpha: randomBetween(0.06, 0.32),
      targetAlpha: randomBetween(0.1, 0.38),
      alphaDir: 1,
      alphaSpeed: randomBetween(0.0008, 0.003),
      vx: randomBetween(-0.18, 0.18),
      vy: randomBetween(-0.18, -0.55),
      vr: randomBetween(-0.002, 0.002), // wobble
      wob: randomBetween(0, Math.PI * 2),
      wobSpeed: randomBetween(0.004, 0.012),
      wobAmp: randomBetween(0.4, 1.4),
      col,
      // inner highlight offset
      hx: randomBetween(-0.3, -0.1),
      hy: randomBetween(-0.35, -0.15),
    };
  }

  function initBubbles() {
    const count = isMobile() ? 18 : 38;
    bubbles = Array.from({ length: count }, () => createBubble(false));
  }

  function drawBubble(b) {
    ctx.save();
    ctx.globalAlpha = b.alpha;

    // Main soft glow circle
    const grad = ctx.createRadialGradient(b.x, b.y, b.r * 0.05, b.x, b.y, b.r);
    grad.addColorStop(0, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},0.55)`);
    grad.addColorStop(0.55, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},0.22)`);
    grad.addColorStop(1, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},0)`);

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner bright highlight — bokeh lens quality
    const hx = b.x + b.r * b.hx;
    const hy = b.y + b.r * b.hy;
    const hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, b.r * 0.46);
    hGrad.addColorStop(0, `rgba(255,255,255,0.72)`);
    hGrad.addColorStop(0.5, `rgba(255,255,255,0.14)`);
    hGrad.addColorStop(1, `rgba(255,255,255,0)`);

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = hGrad;
    ctx.fill();

    ctx.restore();
  }

  let raf;
  function tick() {
    ctx.clearRect(0, 0, W, H);

    bubbles.forEach((b, i) => {
      // Wobble horizontal drift
      b.wob += b.wobSpeed;
      b.x += b.vx + Math.sin(b.wob) * b.wobAmp;
      b.y += b.vy;

      // Alpha breathe
      b.alpha += b.alphaSpeed * b.alphaDir;
      if (b.alpha > b.targetAlpha) b.alphaDir = -1;
      if (b.alpha < 0.04) {
        b.alphaDir = 1;
        b.targetAlpha = randomBetween(0.12, 0.38);
      }

      drawBubble(b);

      // Recycle when off screen
      if (b.y < -b.r * 2) {
        bubbles[i] = createBubble(true);
      }
    });

    raf = requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', () => { resize(); initBubbles(); });
  initBubbles();
  tick();
})();

/* ─────────────────────────────────────────
   MAGNETIC CURSOR
───────────────────────────────────────── */
(function initCursor() {
  if (isMobile() || prefersReducedMotion) return;

  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  // Lerp ring after dot
  (function lerpRing() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(lerpRing);
  })();

  // Expand ring on hoverable elements
  const hoverEls = document.querySelectorAll('.card, .chip, .social-btn, a, button, [data-magnetic]');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-hovering'));
  });
})();

/* ─────────────────────────────────────────
   HERO WORD REVEAL — already CSS-driven,
   but we'll sync stats counter on load
───────────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const dur = 1600;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Trigger counters once hero is visible
const statNums = document.querySelectorAll('.stat-num[data-count]');
if (statNums.length && !prefersReducedMotion) {
  const statsObs = new IntersectionObserver((entries, obs) => {
    if (entries[0]?.isIntersecting) {
      statNums.forEach(el => animateCounter(el));
      obs.disconnect();
    }
  }, { threshold: 0.5 });
  statsObs.observe(document.querySelector('.hero-stats') || document.body);
}

/* ─────────────────────────────────────────
   GSAP CARD STAGGER REVEALS
───────────────────────────────────────── */
const cards = document.querySelectorAll('.reveal');
cards.forEach((card, i) => {
  gsap.fromTo(card,
    { opacity: 0, y: 36, scale: 0.978 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: 0.72,
      ease: 'power3.out',
      delay: i * 0.04,
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        once: true,
      },
    }
  );
});

/* ─────────────────────────────────────────
   PROGRESS BAR ANIMATION
───────────────────────────────────────── */
const progressFills = document.querySelectorAll('.progress-fill[data-pct]');
progressFills.forEach(fill => {
  ScrollTrigger.create({
    trigger: fill,
    start: 'top 88%',
    once: true,
    onEnter: () => {
      fill.style.width = fill.dataset.pct + '%';
    },
  });
});

/* ─────────────────────────────────────────
   HERO ART — FLOATING
───────────────────────────────────────── */
if (!prefersReducedMotion) {
  gsap.to('.hero-art', {
    yPercent: -2.5,
    duration: 4.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });

  // Staggered stack rotation
  gsap.to('.stack-img-front', {
    rotation: '+=2',
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
  gsap.to('.stack-img-mid', {
    rotation: '-=1.5',
    duration: 7,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    delay: 1,
  });

  // Marquee: pause on hover
  const track = document.querySelector('.marquee-track');
  if (track) {
    track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
    track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
  }
}

/* ─────────────────────────────────────────
   PARALLAX TILT ON BOARD
───────────────────────────────────────── */
const board = document.querySelector('.board');
let rafTilt = null;

board?.addEventListener('pointermove', (e) => {
  if (isMobile() || prefersReducedMotion) return;
  if (rafTilt) cancelAnimationFrame(rafTilt);

  rafTilt = requestAnimationFrame(() => {
    const rect = board.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;

    document.querySelectorAll('.card').forEach((card, idx) => {
      const depth = (idx % 3 + 1) * 2.4;
      gsap.to(card, {
        x: x * depth,
        y: y * depth,
        duration: 0.6,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    });
  });
});

board?.addEventListener('pointerleave', () => {
  document.querySelectorAll('.card').forEach(card => {
    gsap.to(card, { x: 0, y: 0, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
  });
});

/* ─────────────────────────────────────────
   CARD PRESS STATE
───────────────────────────────────────── */
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('pointerdown', () => card.classList.add('is-pressed'));
  card.addEventListener('pointerup',   () => card.classList.remove('is-pressed'));
  card.addEventListener('pointercancel',() => card.classList.remove('is-pressed'));
  card.addEventListener('mouseleave',  () => card.classList.remove('is-pressed'));
});

/* ─────────────────────────────────────────
   HERO SECTION GSAP ENTRANCE
───────────────────────────────────────── */
if (!prefersReducedMotion) {
  const tl = gsap.timeline({ delay: 0.1 });
  tl.from('.hero-copy', { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out' })
    .from('.hero-art',  { opacity: 0, x: 30, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .from('.eyebrow',   { opacity: 0, y: 10, duration: 0.5, ease: 'power2.out' }, '-=0.7')
    .from('.hero-stats .stat', {
      opacity: 0, y: 14, stagger: 0.1, duration: 0.5, ease: 'power2.out',
    }, '-=0.4')
    .from('.hero-chips .chip', {
      opacity: 0, scale: 0.88, stagger: 0.08, duration: 0.45, ease: 'back.out(2)',
    }, '-=0.4')
    .from('.marquee-wrap', { opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.2');
}

/* ─────────────────────────────────────────
   SITE FRAME glow on scroll
───────────────────────────────────────── */
if (!prefersReducedMotion) {
  ScrollTrigger.create({
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      const frame = document.querySelector('.site-frame');
      if (frame) {
        const alpha = 0.32 + self.progress * 0.34;
        frame.style.borderColor = `rgba(79, 121, 177, ${alpha})`;
      }
    },
  });
}

/* ─────────────────────────────────────────
   AMBIENT ORB mouse follow
───────────────────────────────────────── */
if (!prefersReducedMotion && !isMobile()) {
  document.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 60;
    const ny = (e.clientY / window.innerHeight - 0.5) * 40;
    gsap.to('.orb-c', {
      x: nx, y: ny,
      duration: 3.5,
      ease: 'power1.out',
      overwrite: 'auto',
    });
  });
}