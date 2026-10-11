// Project modal: a card grows into a full project page; × (or Esc / Back) shrinks it back
(() => {
  const modal = document.querySelector('.project');
  const scroller = modal.querySelector('.project__scroll');
  const closeBtn = modal.querySelector('.project__close');
  const panel = document.querySelector('.panel');
  const desktop = matchMedia('(min-width: 900px)');
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(.32, .72, 0, 1)';
  let card = null;
  let busy = false;

  // Where the modal ends up: a wide centred sheet below the header on desktop, the screen on phones
  const frame = () => {
    if (desktop.matches) {
      const width = Math.min(innerWidth - 48, 1040);
      const top = document.querySelector('.site-header').offsetHeight + 8;
      return { top, left: (innerWidth - width) / 2, width, height: innerHeight - top - 16 };
    }
    return { top: 8, left: 8, width: innerWidth - 16, height: innerHeight - 16 };
  };

  const cardClip = (f, c) => {
    const r = c.getBoundingClientRect();
    return `inset(${r.top - f.top}px ${f.left + f.width - r.right}px ${f.top + f.height - r.bottom}px ${r.left - f.left}px round 10px)`;
  };
  const fullClip = 'inset(0px 0px 0px 0px round 10px)';

  const esc = t => t.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  const placeholder = c => {
    const title = c.querySelector('.work__title')?.textContent.trim() || 'Project';
    const meta = c.querySelector('.work__meta')?.textContent.trim() || '';
    const img = c.querySelector('.card__media img');
    return `
      <p class="project__label">${esc(meta)}</p>
      <h2 class="project__title" id="project-title">${esc(title)}</h2>
      <div class="project__hero">${img ? `<img src="${esc(img.getAttribute('src'))}" alt="">` : ''}</div>
      <dl class="project__meta">
        <div><dt>Role</dt><dd>—</dd></div>
        <div><dt>Year</dt><dd>—</dd></div>
        <div><dt>Team</dt><dd>—</dd></div>
      </dl>
      <div class="project__body"><p>Project write-up coming soon.</p></div>`;
  };

  const setFrame = f => Object.entries({ t: f.top, l: f.left, w: f.width, h: f.height })
    .forEach(([k, v]) => modal.style.setProperty(`--${k}`, `${v}px`));

  // c is the whole project (.work); the modal grows out of its .card
  const open = c => {
    if (modal.open || busy) return;
    card = c;
    const box = c.querySelector('.card') || c;
    const f = frame();
    setFrame(f);

    const detail = c.querySelector('template.card__detail');
    scroller.replaceChildren();
    detail ? scroller.append(detail.content.cloneNode(true)) : (scroller.innerHTML = placeholder(c));
    scroller.scrollTop = 0;

    modal.showModal();
    closeBtn.focus({ preventScroll: true });
    document.documentElement.classList.add('modal-open');
    history.pushState({ project: true }, '');

    if (reduce()) return;
    modal.animate([{ clipPath: cardClip(f, box) }, { clipPath: fullClip }], { duration: 600, easing: ease });
    [closeBtn, ...scroller.children].forEach((el, i) =>
      el.animate(
        [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
        { duration: 500, delay: 250 + i * 60, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' }
      ));
  };

  const close = async () => {
    if (!modal.open || busy) return;
    busy = true;
    if (!reduce() && card) {
      const f = frame();
      const fade = [closeBtn, ...scroller.children].map(el =>
        el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }));
      const shrink = modal.animate([{ clipPath: fullClip }, { clipPath: cardClip(f, card.querySelector('.card') || card) }],
        { duration: 450, delay: 80, easing: ease, fill: 'forwards' });
      await shrink.finished;
      fade.forEach(a => a.cancel());
      shrink.cancel();
    }
    modal.close();
    busy = false;
  };

  const requestClose = () => (history.state?.project ? history.back() : close());
  addEventListener('popstate', () => { if (modal.open) close(); });

  closeBtn.addEventListener('click', requestClose);
  modal.addEventListener('cancel', e => { e.preventDefault(); requestClose(); });
  modal.addEventListener('click', e => { if (e.target === modal) requestClose(); });
  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('modal-open');
    card?.focus({ preventScroll: true });
  });

  panel.addEventListener('click', e => {
    const c = e.target.closest('.work');
    if (!c) return;
    e.preventDefault();
    open(c);
  });

  addEventListener('resize', () => { if (modal.open) setFrame(frame()); });
})();
