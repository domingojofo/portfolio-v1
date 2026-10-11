// Loader: J + F, "You’re in calloused hands"; waits for the hero video, then fires app:ready
(() => {
  const loader = document.getElementById('loader');
  const stage = loader.querySelector('.jf');
  const J = stage.querySelector('.jf-j');
  const F = stage.querySelector('.jf-f');
  const line1 = stage.querySelector('.jf-line1');
  const line2 = stage.querySelector('.jf-line2');
  const youre = stage.querySelector('.jf-youre');
  const hands = stage.querySelector('.jf-hands');
  const ink = [...stage.querySelectorAll('.jf-ink path')];
  const word = stage.querySelector('.jf-word');

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const deadline = sleep(8000);   // never wait on the video longer than this
  const pageLoaded = new Promise(r =>
    document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })
  );

  // The loader holds on the phrase until the background video can play through.
  // Mark that video with data-loader-wait; without one, it waits for the page to load.
  const videoReady = new Promise(r => {
    const v = document.querySelector('video[data-loader-wait]');
    if (!v || v.readyState >= 4) return r();
    v.addEventListener('canplaythrough', r, { once: true });
    v.addEventListener('error', r, { once: true });
  });
  const ready = Promise.race([Promise.all([pageLoaded, videoReady]), deadline]);

  const ease = {
    enter: 'cubic-bezier(.33, 1, .68, 1)',   // gentle ease-out, so the glide through the faded edge is visible
    inOut: 'cubic-bezier(.7, 0, .3, 1)',
    exit: 'cubic-bezier(.55, 0, .45, 1)',    // eases in and out, so the letters fade out while still moving steadily
    in: 'cubic-bezier(.7, 0, .84, 0)',
  };
  // Distances are in design px, converted to % of each letter's width so they scale with the stage
  const slide = (el, from, to, duration, easing) => {
    const w = +el.dataset.w;
    return el.animate([{ transform: `translateX(${from / w * 100}%)` }, { transform: `translateX(${to / w * 100}%)` }],
      { duration, easing, fill: 'forwards' }).finished;
  };

  const appear = (el, duration) =>
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'ease-out', fill: 'forwards' }).finished;

  // "calloused" is written in stroke by stroke along a path traced through each letter,
  // then swapped for the real font so the finished word is exact
  const writeOn = async total => {
    const lens = ink.map(p => +p.dataset.len);
    const sum = lens.reduce((a, b) => a + b, 0);
    let at = 0;
    const runs = ink.map((p, i) => {
      const L = lens[i];
      // Offset one unit past the start, so no round-cap dot shows before a stroke begins
      p.style.strokeDasharray = `${L} ${L + 2}`;
      const anim = p.animate([{ strokeDashoffset: `${L + 1}px` }, { strokeDashoffset: '0px' }],
        { duration: Math.max(30, total * L / sum), delay: total * at / sum, easing: 'linear', fill: 'both' });
      at += L;
      return anim.finished;
    });
    ink[0].parentNode.style.visibility = 'visible';
    await Promise.all(runs);
    word.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: 'forwards' });
    ink.forEach(p => p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
  };

  const rise = (el, delay) =>
    el.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-6.306%)', opacity: 0 }],   // 14 of 222
      { duration: 450, delay, easing: ease.in, fill: 'forwards' }).finished;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    loader.classList.add('done');
    document.body.classList.remove('loading');
    document.dispatchEvent(new Event('app:ready'));
    setTimeout(() => loader.remove(), 700);
  };

  async function run() {
    // Reduced motion: show the finished phrase, then fade to the page when ready
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      J.style.transform = F.style.transform = 'none';
      youre.style.opacity = hands.style.opacity = word.style.opacity = 1;
      ink.forEach(p => (p.style.display = 'none'));
      await ready;
      return finish();
    }

    // Wait for the loader fonts (max 1s; a failed load just uses the fallback)
    await Promise.race([
      Promise.all([
        document.fonts.load('400 24px "Maragsa"', 'You’re in hands'),
        document.fonts.load('400 24px "Brittany Signature Script"', 'calloused'),
        document.fonts.load('1em "Brittany Signature"', 'RC'),
        document.fonts.load('1em "Maragsa"', 'elentlessly ollaborative'),
      ]).catch(() => {}),
      sleep(1000),
    ]);
    await sleep(150);

    // Positions are offsets from frame 3 (J at x 605, F at x 858).
    // 1. J and F appear from the stage edges and meet in the middle (frame 2)
    await Promise.all([
      slide(J, -158, 100, 800, ease.enter),
      slide(F, 158, -100, 800, ease.enter),
    ]);
    await sleep(250);

    // 2. They part just enough for the text (frame 3), then start bobbing
    const part = Promise.all([
      slide(J, 100, 0, 450, ease.inOut),
      slide(F, -100, 0, 450, ease.inOut),
    ]).then(() => stage.classList.add('bobbing'));
    await sleep(200);

    // 3. "You're in" appears, "calloused" is written in, then "hands" appears just after
    const l1 = appear(youre, 350);
    await sleep(250);
    await writeOn(900);
    await sleep(80);
    await Promise.all([part, l1, appear(hands, 300)]);

    // 4. Hold on the phrase until the video can play (at least long enough to read it)
    await Promise.all([sleep(400), ready]);

    // 5. Lines rise away one after the other; J exits left, F exits right
    rise(line1, 0);
    rise(line2, 80);
    slide(J, 0, -158, 700, ease.exit);
    slide(F, 0, 158, 700, ease.exit);
    await sleep(500);
    finish();
  }

  // Never trap the visitor: any error reveals the page, and so does a hard 12s cap
  run().catch(finish);
  setTimeout(finish, 12000);
})();
