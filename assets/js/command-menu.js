// Command menu: ⌘K / Ctrl+K or the header button opens it
(() => {
  const dialog = document.querySelector('.cmdk');
  const input = dialog.querySelector('.cmdk__input');
  const items = [...dialog.querySelectorAll('.cmdk__item')];
  const groups = [...dialog.querySelectorAll('.cmdk__group')];
  const empty = dialog.querySelector('.cmdk__empty');
  const trigger = document.querySelector('.cmdk-trigger');
  const list = dialog.querySelector('.cmdk__list');
  const sheetQuery = matchMedia('(max-width: 599px), (hover: none) and (pointer: coarse)');
  const isSheet = () => sheetQuery.matches;
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = items;
  let index = 0;

  items.forEach((item, i) => (item.id = `cmdk-item-${i}`));

  const select = i => {
    index = (i + visible.length) % visible.length;
    items.forEach(item => item.setAttribute('aria-selected', 'false'));
    const current = visible[index];
    if (!current) return input.removeAttribute('aria-activedescendant');
    current.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', current.id);
    current.scrollIntoView({ block: 'nearest' });
  };

  const filter = () => {
    const q = input.value.trim().toLowerCase();
    visible = items.filter(item => {
      const match = item.textContent.toLowerCase().includes(q);
      item.hidden = !match;
      return match;
    });
    groups.forEach(g => (g.hidden = !g.querySelector('.cmdk__item:not([hidden])')));
    empty.hidden = visible.length > 0;
    select(0);
  };

  const clickSound = new Audio('assets/audio/click.mp3');
  clickSound.preload = 'auto';
  clickSound.volume = 0.6;

  let audioCtx;
  const tick = () => {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.03);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch {}
  };

  const open = () => {
    if (dialog.open) return;
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
    input.value = '';
    filter();
    list.toggleAttribute('autofocus', isSheet());
    input.toggleAttribute('autofocus', !isSheet());
    dialog.showModal();
    if (isSheet()) document.documentElement.classList.add('sheet-open');
  };

  let closing = false;
  const close = async (fromY = 0) => {
    if (!dialog.open || closing) return;
    if (isSheet() && !reduceMotion()) {
      closing = true;
      const opts = { duration: 280, easing: 'cubic-bezier(.32, .72, 0, 1)', fill: 'forwards' };
      const slide = dialog.animate([{ transform: `translateY(${fromY}px)` }, { transform: 'translateY(100%)' }], opts);
      try { dialog.animate([{ opacity: 1 }, { opacity: 0 }], { ...opts, pseudoElement: '::backdrop' }); } catch {}
      await slide.finished;
      dialog.getAnimations({ subtree: true }).forEach(a => a.cancel());
      dialog.style.transform = '';
      closing = false;
    }
    dialog.close();
  };
  dialog.addEventListener('close', () => document.documentElement.classList.remove('sheet-open'));
  dialog.addEventListener('cancel', e => { if (isSheet()) { e.preventDefault(); close(); } });

  const grab = dialog.querySelector('.cmdk__grab');
  let startY = 0, startT = 0, dy = 0, dragging = false;
  grab.addEventListener('pointerdown', e => {
    dragging = true;
    startY = e.clientY;
    startT = performance.now();
    dy = 0;
    grab.setPointerCapture(e.pointerId);
    dialog.style.transition = 'none';
  });
  grab.addEventListener('pointermove', e => {
    if (!dragging) return;
    dy = Math.max(0, e.clientY - startY);
    dialog.style.transform = `translateY(${dy}px)`;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    const velocity = dy / (performance.now() - startT);
    if (dy > 120 || velocity > 0.6) {
      close(dy);
    } else {
      dialog.style.transition = 'transform .35s cubic-bezier(.32, .72, 0, 1)';
      dialog.style.transform = '';
    }
  };
  grab.addEventListener('pointerup', endDrag);
  grab.addEventListener('pointercancel', endDrag);

  const run = item => {
    if (!item) return;
    close();
    const href = item.dataset.href;
    if ('external' in item.dataset) {
      window.open(href, '_blank', 'noopener');
    } else if (href.startsWith('#')) {
      document.dispatchEvent(new CustomEvent('nav:go', { detail: href.slice(1) }));   // smooth-scroll to the section
    } else {
      location.href = href;
    }
  };

  const resume = document.querySelector('.btn-resume');

  // ⌘K / Ctrl+K and ⌘J / Ctrl+J work everywhere, even while the Menu button is hidden
  document.addEventListener('keydown', e => {
    if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
    if (document.body.classList.contains('loading')) return;
    const key = e.key.toLowerCase();
    if (key === 'k') {
      e.preventDefault();
      dialog.open ? close() : open();
    } else if (key === 'j') {
      e.preventDefault();
      close();
      window.open(resume.href, '_blank', 'noopener');
    }
  });

  input.addEventListener('input', filter);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); select(index + 1); tick(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); select(index - 1); tick(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(visible[index]); }
  });

  items.forEach(item => {
    item.addEventListener('mousemove', () => select(visible.indexOf(item)));
    item.addEventListener('click', () => run(item));
  });

  dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
  dialog.addEventListener('close', () => trigger.focus({ preventScroll: true }));
  trigger.addEventListener('click', open);
})();
