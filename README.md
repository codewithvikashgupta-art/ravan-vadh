# श्री राम विजय — रावण वध · Ravan Vadh Cinematic

An interactive, **5D-style cinematic 3D web experience** of Shri Ram's victory
over Ravan, built for Vijayadashami (Dussehra). Twelve hand-sequenced scenes,
dual cinematic camera tracks, a premium **Ultra View** presentation mode, fully
procedural audio, and GitHub Pages deployment — all rendered in real time with
React + Three.js (React Three Fiber) + GSAP.

> **सत्य की असत्य पर विजय** — *Truth triumphs over untruth.*

---

## ✨ Features

- **12 animated scenes** in story order: invocation → Ram Ji's puja → Hanuman
  Ji's devotion → war preparation → Ravan's entrance → the first arrow (which
  **fails**) → epic arrow battles → the battle's peak → the divine final arrow →
  **Ravan Vadh** → fireworks → a peaceful divine ending with replay.
- **Ultra View mode** — anamorphic 2.39:1 letterbox, ACES tone mapping, selective
  bloom, depth-of-field focus pulls, god rays, anamorphic lens flares, film
  grain, vignette and chromatic aberration. Toggle it from the landing screen,
  the HUD, or the **U** key — before *or during* playback with **zero timeline
  desync**.
- **Dual camera tracks** — every scene has a Standard and an Ultra "Director's
  Cut" keyframe track, sampled against the same master timeline progress.
- **Photo Mode** — pause, free-orbit the camera, adjust FOV, and export a PNG.
- **Procedural everything** — characters, effects and *all audio* are generated
  at runtime. No external models, textures, or copyrighted recordings.
- **Independent effect toggles** — flash, shake, grain, chromatic aberration,
  bloom, DOF, god rays and haptic vibration can each be turned on/off.
- **Adaptive quality** — monitors FPS and progressively drops post-processing
  tiers and resolution so it stays smooth on weaker hardware.
- **Accessible** — honors `prefers-reduced-motion` (disables dolly-zoom,
  bullet-time, shake and flicker), shows a photosensitivity warning, and never
  blocks playback if WebGL2 is unavailable.
- **Keyboard shortcuts** — Space play/pause · ←/→ scene · N replay scene ·
  R restart · U Ultra View · P photo mode · M mute · F fullscreen.

---

## 🛠 Tech stack

| Layer | Choice |
| --- | --- |
| Build | Vite 7 |
| UI | React 19 |
| 3D | Three.js + `@react-three/fiber` + `@react-three/drei` |
| Post-processing | `@react-three/postprocessing` + `postprocessing` |
| Timeline | GSAP |
| State | Zustand |
| Audio | Web Audio API (procedural synthesis) |

Characters and the environment are built from Three.js primitives and animated
procedurally from the timeline — so the project runs with **zero binary assets**.

---

## 📁 Project structure

```
src/
  components/
    CinematicUI/         Landing, HUD, Settings
    SceneController/     World assembly + CameraRig
    LoadingScreen.jsx
  scenes/
    sceneData.js         The 12 scenes + timing helpers
  characters/
    RamCharacter.jsx     HanumanCharacter.jsx   RavanCharacter.jsx
  effects/
    Environment.jsx      Fire/Smoke/Lightning/DivineArrow/Fireworks/
                         Shockwave/GodRays/LensFlare/ParticleField
    ultra/               PostFX  LetterboxBars  PhotoMode
  animation/
    director.js          cameraTracks.js  timeline.js  adaptiveQuality.js
  audio/
    AudioEngine.js       Procedural SFX + generative score
  store/
    useStore.js          Zustand store
  styles/global.css
  App.jsx  main.jsx
public/
.github/workflows/deploy.yml
```

---

## 🚀 Getting started

```bash
# install dependencies
npm install

# start the dev server  ->  http://localhost:5173
npm run dev

# production build      ->  ./dist
npm run build

# preview the production build locally
npm run preview
```

---

## 🌐 Deploy to GitHub Pages

This project is deployed from a **`gh-pages` branch** containing the production
build. It needs no Actions workflow (and therefore no `workflow` token scope) —
only `Contents` write access to push, and Pages enabled on the repo.

### One-time: enable Pages

Repo → **Settings** → **Pages** → **Build and deployment**:

- **Source:** `Deploy from a branch`
- **Branch:** `gh-pages` / `/ (root)`
- **Save**

Your site goes live at:

```
https://<user>.github.io/ravan-vadh/
```

### Deploy / update the site

```bash
# 1. build the production bundle (base = /ravan-vadh/ from vite.config.js)
npm run build

# 2. publish ./dist to the gh-pages branch
npm run deploy
```

`npm run deploy` creates an orphan `gh-pages` branch containing only `dist/`
and force-pushes it. Re-run it after every change you want live.

### Custom domain

For a custom domain, build with an empty base and set the CNAME:

```bash
# publish base "/" instead of "/ravan-vadh/"
# then add a CNAME file to ./public and re-deploy
```

> The Vite `base` is read from `VITE_BASE` (default `/ravan-vadh/`), so the same
> config works for a project subpath, a user page, or a custom domain. No
> hardcoded `localhost` URLs are used anywhere.

---

## ⚙️ Performance notes

- Targets **60 FPS** on capable desktop GPUs; Ultra View holds 60 FPS at 1440p
  with adaptive resolution scaling.
- Particles are **pooled and recycled** — no per-frame allocation.
- Geometries and materials are reused; post-processing is merged into a single
  effect composer.
- If sustained FPS drops below 30, post-processing tiers are reduced
  automatically and a small notice appears.

## ♿ Accessibility & safety

- Photosensitivity warning on first launch.
- Flash, shake, chromatic aberration and grain are individually controllable.
- `prefers-reduced-motion` is detected and respected automatically.
- Ultra View silently falls back to Standard View if WebGL2 is unavailable.

---

## 📜 License & credits

Original code and procedural art created for this project. The story is drawn
from the **Ramayana**, an ancient public-domain epic. All audio is synthesized
at runtime — no copyrighted music or recordings are included.
