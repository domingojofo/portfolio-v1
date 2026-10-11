// Sections: Hey (hero) and Design (projects panel). Nav links, ← / →, the header keycaps
// and the menu all smooth-scroll between them. My Story / Reading / Writing come later.
(() => {
  const links = [...document.querySelectorAll('.nav a')];
  const sectionLinks = links.filter(a => a.dataset.viewLink);
  const ids = sectionLinks.map(a => a.dataset.viewLink);    // ['hey', 'design']
  const hero = document.querySelector('.hero');
  const panel = document.querySelector('.panel');
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = () => (reduce() ? 'auto' : 'smooth');
  let current = 'hey';

  // Split each nav label into letters for the hover roll
  links.forEach(a => {
    const label = a.querySelector('.roll-text');
    const text = label.textContent;
    a.setAttribute('aria-label', 'soon' in a.dataset ? `${text} (coming soon)` : text);
    label.className = 'roll';
    label.setAttribute('aria-hidden', 'true');
    label.innerHTML = [...text].map((ch, i) =>
      `<span class="roll__c" style="--i:${i}"><span>${ch}</span><span>${ch}</span></span>`
    ).join('');
  });

  // Where the page needs to be for each section
  // Desktop: the very end of the page (panel widened, risen and docked). Phones: the panel's top.
  const designTop = () => matchMedia('(min-width: 900px)').matches
    ? document.documentElement.scrollHeight - innerHeight
    : hero.offsetHeight + parseFloat(getComputedStyle(panel).marginTop);

  const waitForScrollEnd = el => new Promise(r => {
    const done = () => { el.removeEventListener('scrollend', done); r(); };
    el.addEventListener('scrollend', done);
    setTimeout(done, 700);   // browsers without scrollend
  });

  const go = async id => {
    if (!ids.includes(id)) return;
    history.replaceState(null, '', `#${id}`);
    if (id === 'hey') {
      // Back to the top of the projects first, then up to the hero
      if (panel.scrollTop > 0) {
        panel.scrollTo({ top: 0, behavior: behavior() });
        await waitForScrollEnd(panel);
      }
      scrollTo({ top: 0, behavior: behavior() });
    } else {
      scrollTo({ top: designTop(), behavior: behavior() });
    }
  };

  // Highlight the section you're in (reported by the scroll handler)
  document.addEventListener('section', e => {
    current = e.detail;
    document.documentElement.classList.toggle('on-panel', current === 'design');
    sectionLinks.forEach(a => a.dataset.viewLink === current ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    document.title = `Jofo Domingo — ${current === 'hey' ? 'Hey' : 'Design'}`;
  });

  links.forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (a.dataset.viewLink) go(a.dataset.viewLink);
  }));
  document.addEventListener('nav:go', e => go(e.detail));
  addEventListener('hashchange', () => go(location.hash.slice(1)));

  // ← / → and the header keycaps step between the sections
  const step = dir => go(ids[Math.min(ids.length - 1, Math.max(0, ids.indexOf(current) + dir))]);
  const keycaps = Object.fromEntries([...document.querySelectorAll('.keycap[data-step]')].map(b => [b.dataset.step, b]));
  Object.values(keycaps).forEach(b => b.addEventListener('click', () => step(Number(b.dataset.step))));

  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (document.body.classList.contains('loading') || document.querySelector('.cmdk[open], .project[open]')) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const cap = keycaps[String(dir)];
    cap?.classList.add('is-pressed');
    setTimeout(() => cap?.classList.remove('is-pressed'), 150);
    step(dir);
  });

  // Cards stagger in when the hero hands over; a #design link then scrolls down to them
  document.addEventListener('hero:cards', () => {
    if (!reduce()) {
      const cards = [...panel.querySelectorAll('.work')].sort((a, b) => {
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return Math.abs(ra.top - rb.top) > 4 ? ra.top - rb.top : ra.left - rb.left;
      });
      cards.forEach((c, i) => c.animate(
        [{ opacity: 0, transform: 'translateY(28px) scale(.97)' }, { opacity: 1, transform: 'none' }],
        { duration: 700, delay: 60 + i * 90, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' }));
    }
    if (location.hash === '#design') setTimeout(() => go('design'), 600);
  }, { once: true });
})();
