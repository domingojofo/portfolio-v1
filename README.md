# Jofo Domingo — Portfolio

Personal portfolio site. Plain HTML, CSS and JavaScript: no build step, no dependencies.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Use a local server rather than opening `index.html` directly,
because browsers block fonts and video on `file://` pages.

## Structure

```
index.html                 Page markup
assets/
  css/main.css             All styles (fonts, colour tokens, paper texture, layout, components)
  js/
    loader.js              J + F intro; waits for the hero video, then fires `app:ready`
    hero.js                Hero entrance, video sound, scroll effects (parallax, panel, header)
    sections.js            Hey / Design navigation: nav links, ← / → keys, smooth scrolling
    project-modal.js       Project cards open into a full project page
    command-menu.js        ⌘K menu, ⌘J résumé shortcut, menu sounds
  fonts/                   Web fonts (woff/woff2, subset to the characters used)
  images/                  Hero poster, project images
  video/                   Hero background video
  audio/                   Interface sounds
_source/                   Not published (git-ignored): font originals and licences, raw media
```

Scripts load in the order above; they talk to each other through DOM events
(`app:ready` → `hero:cards`, `section`, `nav:go`).

## Common edits

| To change | Edit |
|---|---|
| Colours | `:root` tokens at the top of `assets/css/main.css` |
| Paper texture strength | the `--paper-*` notes in `assets/css/main.css` (`?paper=off` turns it off) |
| Projects | `.work` blocks inside `<main id="design">` in `index.html`; each project's page lives in its `<template class="card__detail">` |
| Intro copy beside the projects | `.design__intro` in `index.html` |
| Résumé link | the `.btn-resume` link and the Résumé item in the command menu, both in `index.html` |

## Fonts and licences

- **General Sans** (Fontshare, ITF Free Font Licence)
- **Geist Mono** (SIL Open Font Licence)
- **Maragsa Display** (freeware, see `_source/fonts/maragsa-font/info.txt`)
- **Brittany Signature Script**: free for **personal use only**. Check whether a commercial
  licence is needed before publishing (see `_source/fonts/brittany-signature-script/Readme.txt`).
