// Hero: video sound + entrance sequence
(() => {
  const video = document.querySelector('.hero__video');
  const soundBtn = document.querySelector('.sound');
  const header = document.querySelector('.site-header');
  const [w1, w2] = document.querySelectorAll('.hero__w');
  const tagline = document.querySelector('.hero__tagline');
  const panel = document.querySelector('.panel');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOut = 'cubic-bezier(.16, 1, .3, 1)';
  const VOLUME = 0.6;

  if (reduce) { video.pause(); video.removeAttribute('autoplay'); }

  // ---- Sound ----
  // Browsers only allow sound after the visitor has clicked/tapped/pressed a key.
  // If they haven't yet, the video keeps playing muted and the sound fades in on
  // their first interaction. The keycap in the header turns it on/off.
  // Volume = VOLUME × level (the fade in/out) × presence (how much of the hero is
  // still showing — the sound fades away as the projects panel covers it).
  let wanted = !reduce;
  let level = 0;
  let presence = 1;
  const applyVolume = () => { video.volume = Math.min(1, Math.max(0, VOLUME * level * presence)); };
  let raf;
  const fadeTo = (target, ms) => new Promise(done => {
    cancelAnimationFrame(raf);
    const from = level, start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / ms);
      level = from + (target - from) * t * t * (3 - 2 * t);   // smoothstep
      applyVolume();
      t < 1 ? (raf = requestAnimationFrame(step)) : done();
    };
    raf = requestAnimationFrame(step);
  });
  // The key shows whether sound is on (muted until the browser allows sound)
  const setButton = () => soundBtn.setAttribute('aria-pressed', String(!video.muted && wanted && level > 0));
  video.addEventListener('volumechange', setButton);

  const gestureEvents = ['pointerdown', 'keydown', 'touchend', 'click'];
  const stopWaiting = () => gestureEvents.forEach(t => removeEventListener(t, onGesture, true));
  function onGesture(e) {
    if (soundBtn.contains(e.target)) return;   // the sound key handles itself
    stopWaiting();
    startSound();
  }
  const waitForGesture = () => gestureEvents.forEach(t => addEventListener(t, onGesture, { capture: true }));

  const startSound = () => {
    if (!wanted) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return waitForGesture();
    level = 0;
    applyVolume();
    video.muted = false;
    video.play().catch(() => {});
    // Some browsers pause instead of throwing when unmuting isn't allowed yet
    setTimeout(() => {
      if (video.paused || video.muted) {
        video.muted = true;
        video.play().catch(() => {});
        waitForGesture();
      }
    }, 80);
    fadeTo(VOLUME, 2500);
    stopWaiting();
  };

  soundBtn.addEventListener('click', async () => {
    const audible = !video.muted && wanted && level > 0;
    if (audible) {
      wanted = false;
      await fadeTo(0, 400);
      video.muted = true;
    } else {
      wanted = true;
      stopWaiting();
      if (video.paused) video.play().catch(() => {});
      startSound();
    }
  });
  setButton();

  // ---- Entrance: words → nav → bottom card ----
  const enter = (el, from, delay, duration = 900, to = 'none') => el.animate(
    [{ opacity: 0, ...from }, { opacity: 1, transform: to, filter: 'blur(0)' }],
    { duration, delay, easing: easeOut, fill: 'backwards' }
  );

  const intro = () => {
    if (reduce) return document.dispatchEvent(new Event('hero:cards'));
    enter(w1, { transform: 'translateY(.45em)', filter: 'blur(8px)' }, 100, 1300);     // first word rises up
    enter(w2, { transform: 'translateY(-.45em)', filter: 'blur(8px)' }, 380, 1300);    // second drops down
    setTimeout(startSound, 100);                                                       // sound fades in with "Relentlessly"
    enter(header, { transform: 'translateY(-100%)' }, 1150, 800);
    enter(tagline, { transform: 'translate(-50%, 14px)' }, 1350, 800, 'translate(-50%, 0)');
    enter(panel, { transform: 'translateY(90px)' }, 1350, 1000);
    setTimeout(() => document.dispatchEvent(new Event('hero:cards')), 1550);
  };
  document.body.classList.contains('loading')
    ? document.addEventListener('app:ready', intro, { once: true })
    : intro();

  // ---- Header: swap the arrow hint for Resume + Menu once you scroll down ----
  // ---- Scroll effects (one handler, at most once per frame) ----
  const root = document.documentElement;
  const PARALLAX = [0.35, 0.22];   // how fast each word drifts, relative to the scroll
  let lastY = scrollY;
  let ticking = false;

  const desktop = matchMedia('(min-width: 900px)');
  const spacer = document.querySelector('.panel-spacer');
  const design = document.querySelector('.design');
  let section = null;

  const update = () => {
    ticking = false;
    const docked = panel.classList.contains('is-docked');
    // Distance scrolled overall: the page, plus the inside of the docked panel
    const y = Math.max(0, scrollY) + (docked ? panel.scrollTop : 0);
    const vh = innerHeight;

    // Swap the arrow hint for Resume + Menu once you've scrolled a little
    header.classList.toggle('is-scrolled', y > 80);

    // Hide the bar while scrolling down, bring it back as soon as you scroll up
    if (modalOpen()) { /* leave it alone while a dialog is open */ }
    else if (y < 10) header.classList.remove('is-hidden');
    else if (y > lastY + 4 && y > header.offsetHeight) header.classList.add('is-hidden');
    else if (y < lastY - 4) header.classList.remove('is-hidden');
    lastY = y;

    // Parallax: the words drift down slower than the page scrolls (only while the hero is on screen)
    if (!reduce && scrollY < vh * 1.2) {
      w1.style.setProperty('--py', `${(scrollY * PARALLAX[0]).toFixed(1)}px`);
      w2.style.setProperty('--py', `${(scrollY * PARALLAX[1]).toFixed(1)}px`);
    }

    const clamp01 = v => Math.min(1, Math.max(0, v));
    const smooth = t => t * t * (3 - 2 * t);
    const full = root.clientWidth;                   // excludes the scrollbar
    const start = Math.min(640, full - 32);
    const top = panel.getBoundingClientRect().top;
    const travel = Math.max(1, vh - parseFloat(getComputedStyle(root).getPropertyValue('--panel-peek')));
    // p: how far the panel has risen (0 at the fold, 1 docked at the top)
    const p = clamp01(1 - top / travel);
    // w: how far it has widened. Desktop: during the spacer, before it rises. Phones: as it rises.
    const spacerH = spacer.offsetHeight;
    const w = smooth(spacerH ? clamp01(scrollY / spacerH) : clamp01(p / 0.6));
    panel.style.setProperty('--panel-w', `${(start + (full - start) * w).toFixed(1)}px`);
    panel.style.setProperty('--p', w.toFixed(3));
    panel.style.setProperty('--rise', smooth(p).toFixed(3));

    // Full width reached → the words column opens; scrolling back closes it again
    if (w >= 0.995) design.classList.add('is-open');
    else if (w < 0.9) design.classList.remove('is-open');

    // Sound fades out as the panel covers the hero; the video pauses once it's fully hidden
    presence = 1 - smooth(p);
    applyVolume();
    if (!reduce) {
      if (p >= 0.995 && !video.paused) video.pause();
      else if (p < 0.995 && video.paused) video.play().catch(() => {});
    }

    // Desktop: dock once the panel reaches the top, so its cards scroll inside it
    const dock = desktop.matches && p >= 0.995;
    if (dock !== docked) {
      if (!dock) panel.scrollTop = 0;
      panel.classList.toggle('is-docked', dock);
    }

    // Which section you're in: Hey (hero) or Design (panel)
    const now = p > 0.6 ? 'design' : 'hey';
    if (now !== section) {
      section = now;
      document.dispatchEvent(new CustomEvent('section', { detail: now }));
    }
  };
  const modalOpen = () => !!document.querySelector('.cmdk[open], .project[open]');
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  panel.addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  // The header floats over the docked panel: let the wheel there scroll the panel too
  header.addEventListener('wheel', e => {
    if (panel.classList.contains('is-docked')) panel.scrollBy({ top: e.deltaY });
  }, { passive: true });
  requestAnimationFrame(update);   // first run after every script has loaded, so the nav hears the section
})();
