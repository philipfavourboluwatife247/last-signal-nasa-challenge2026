# Last Signal

**Stories from the silent machines.**

Last Signal is a web game and interactive story about the machines NASA has left on the Moon and Mars. You are a *Signal Operator*: tune in to a glowing signal on a 3D world, hear the machine tell its own story, prove you were listening, then unlock its full story, a mission replay and a chat that answers only from verified facts.

Built for the **NASA Space Apps Challenge 2026**, challenge *“Abandoned but not Forgotten: Storytelling about NASA’s Discarded Equipment on the Moon and Mars”*, and aimed at school-age space enthusiasts.

> One machine is still working: the laser mirror Apollo 11 placed on the Moon in 1969 is still used by scientists today.

## Highlights

- **Learn first, then play.** Tune (radio dial) → Listen (the machine speaks) → Decode (questions and an ordering round) → Reward (mission patch, stars, points, rank) → Story.
- **Real 3D worlds.** The Moon and Mars at true relative size, with day/night edge, atmosphere, bloom, a sky of planets, shooting stars to catch and asteroid impacts. Signal rings are painted onto the surface by the shader.
- **15 machines** at their real coordinates, each told in first person at three reading levels (Kids, Explorer, Scientist), with key numbers and sources.
- **Mission replay.** A timeline with true elapsed time and effects (laser, dust haze, marsquake, flight).
- **Ask about my mission.** A retrieval-only chat: it can only answer from the machine’s own fact file, always shows sources, and politely says “I don’t have that” otherwise. It cannot invent facts.
- **NASA photos with honest labels.** Each card shows a NASA image that opens **full screen**. Every caption says what the picture really is: a photo on Mars, a model on Earth, or an artist’s concept.
- **Credits and sources page** (Settings → Credits and sources), generated from the dossiers: every source link, every picture credit and the project’s honesty notes.
- **Your voice, across space.** Record a message and hear it echo back (processed on-device, never uploaded).
- **For everyone.** Installable app, works offline after the first visit, self-hosted fonts, captions for all spoken text, voices, keyboard play, reduced-motion support and quality tiers for slower phones. An automated axe audit finds 0 violations on every screen checked.

## The machines

| World | Machine | Site | Arrived | Status | Last contact | Picture |
|---|---|---|---|---|---|---|
| Moon | Surveyor 3 | Oceanus Procellarum | 1967-04-20 | Silent | 1967-05-04 | NASA photo |
| Moon | Apollo 11 Lunar Module Eagle | Tranquility Base, Sea of Tranquility | 1969-07-20 | Silent | 1969-07-21 | NASA photo |
| Moon | Apollo 11 Laser Mirror | Tranquility Base, Sea of Tranquility | 1969-07-20 | Still working | — | NASA photo |
| Moon | Apollo 14 Lunar Module Antares | Fra Mauro highlands | 1971-02-05 | Silent | 1971-02-06 | NASA photo |
| Moon | Apollo 15 Lunar Rover | Hadley–Apennine region | 1971-07-30 | Silent | 1971-08-02 | NASA photo |
| Moon | Apollo 16 Lunar Rover | Descartes Highlands | 1972-04-21 | Silent | 1972-04-23 | NASA photo |
| Moon | Apollo 17 Lunar Rover | Taurus–Littrow valley | 1972-12-11 | Silent | 1972-12-13 | NASA photo |
| Mars | Viking 1 | Chryse Planitia | 1976-07-20 | Silent | 1982-11-11 | NASA photo |
| Mars | Viking 2 | Utopia Planitia | 1976-09-03 | Silent | 1980-04-11 | NASA photo |
| Mars | Sojourner and Pathfinder | Ares Vallis | 1997-07-04 | Silent | 1997-09-27 | NASA photo |
| Mars | Spirit | Gusev crater | 2004-01-04 | Silent | 2010-03-22 | NASA photo |
| Mars | Opportunity | Meridiani Planum | 2004-01-25 | Silent | 2018-06-10 | NASA photo |
| Mars | Phoenix | Green Valley, Vastitas Borealis | 2008-05-25 | Silent | 2008-11-02 | NASA photo |
| Mars | InSight | Elysium Planitia | 2018-11-26 | Silent | 2022-12-15 | NASA photo |
| Mars | Ingenuity | Jezero crater (Wright Brothers Field) | 2021-02-18 | Silent | 2024-01-18 | NASA photo |

All dossiers are marked **FACT-CHECKED** after an AI-assisted check against NASA sources (see [Facts, sources and honesty](#facts-sources-and-honesty) and [`docs/FACT_CHECK.md`](docs/FACT_CHECK.md)).

## Quick start

Requires Node.js 18.17 or newer (Node 20 recommended).

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run validate` | Checks every dossier in `content/machines` against the schema |
| `npm run test:schema` | Proves the validator rejects bad data (uses `content/_fixtures`) |
| `npm run test:ask` | Runs the Ask engine test suite (every answer must come from the right fact; off-topic questions must be refused) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Runs `validate`, `test:schema` and `test:ask` first, then builds |
| `npm start` | Serves the production build |

URL options: `/?tier=low|medium|high|auto` (force graphics quality), `/?debug` (FPS counter), `/foundations` (design-system page).

Deploys on Vercel with no special settings. Set `NEXT_PUBLIC_SITE_URL` only if you use a custom domain.

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · three.js with React Three Fiber, drei and postprocessing · GSAP · Zustand · Tailwind CSS · zod · Web Audio, SpeechSynthesis, SpeechRecognition and MediaRecorder · a hand-written service worker. Sounds are generated in code (no audio files) and fonts (Michroma, Exo 2, B612 Mono) are self-hosted.

## Project structure

```
app/            Shell, metadata, manifest, share cards, /foundations
components/     Scene, Planet, Signals, Panel (machine card), game steps, Replay, Ask, ImageViewer, Credits, HUD, ...
lib/            schema.ts (data contract), store, shaders, audio, voice, ask engine, ranks, progress
content/
  machines/     One JSON dossier per machine: the only file to edit to add or change a machine
  _fixtures/    Deliberately invalid dossiers used by test:schema
public/
  machines/     Self-hosted NASA photos shown on the cards
  icons/, sw.js Icons and the offline service worker
scripts/        Dossier validator and the Ask test suite
```

## Adding or changing a machine

Everything about a machine lives in `content/machines/<id>.json`. The schema in `lib/schema.ts` rejects bad data and the build fails, so mistakes cannot ship.

A dossier needs: `id`, `name`, `world` (`moon` or `mars`), `location` (site name, latitude, longitude, east positive), `startDate`, `status` (`silent`, `active` or `lost`), a `summary`, **3 or more `learn` cards** (first person, kid-friendly), **2 or more `clues`** whose answers can be found in the learn cards, a `timeline` (3 or more events enables the ordering round), `stories`, `keyNumbers` that point to a source, at least one `sources` entry and a `review` block. Optional: `image`, `route`, `learnMore`.

To add a photo: save a JPG under `public/machines/` (about 1600 px on the long side), then add

```json
"image": { "url": "/machines/name.jpg", "alt": "Describe what the picture shows", "credit": "NASA",
  "creditUrl": "https://images.nasa.gov/", "note": "PHOTO ON MARS" }
```

`note` is a short honest label shown in the caption (for example `ARTIST’S CONCEPT` or `MODEL ON EARTH`). Remember to bump `VERSION` in `public/sw.js` when assets change.

Each world’s shader supports up to 8 machines (`MAXB` in `components/Planet.tsx` and the array sizes in `lib/shaders.ts`). Mars is at 8; raise those before adding a ninth Mars machine. After adding a machine, add test questions to `scripts/test-ask.ts` and run `npm run test:ask`.

## Scoring and saving

Multiple choice: 100 / 50 / 25 points for first / second / third try, plus a first-try combo bonus. Order round: 150 / 100 / 50. Stars: 3 / 2 / 1. One-time bonuses for sky discoveries, stardust, messages sent, the daily signal, finishing a world and finishing the mission. Ranks: Cadet, Operator, Navigator, Commander, Legend. Progress is saved in the browser (`localStorage`) and never leaves the device.

## Accessibility and offline

Keyboard-reachable machines, a native slider for tuning, captions for every spoken line, a separate Voices switch, Reduce motion (also detected from the system), data-saver detection, and a full-screen photo viewer with focus handling and Escape to close. Automated axe-core checks (WCAG 2.0/2.1 A and AA) report no violations on the screens checked. Automated checks catch only part of the problems, so a manual screen-reader and keyboard pass is still recommended.

The service worker caches the app, fonts, icons and photos so the game opens and plays without a connection after the first visit.

## Facts, sources and honesty

- Every claim in a dossier is meant to trace to a NASA/JPL page listed in that dossier’s `sources`.
- A dossier can only be marked `verified` with a reviewer and a date, and its card then shows FACT-CHECKED.
- Where NASA sources disagree, the dossier says so (for example, the Apollo 17 rover distance is listed by NASA NSSDCA as about 35.9 km, while other NASA material gives about 35.7 km).
- The Ask chat is deliberately not a generative AI model: it retrieves from the dossier and cannot make anything up.
- The Moon is painted from NASA’s CGI Moon Kit colour map (NASA Scientific Visualization Studio, built from LRO camera and laser altimeter data, https://svs.gsfc.nasa.gov/4720, `public/textures/moon_color.jpg`). The Mars surface is still generated in code. To add a Mars map, put an equirectangular 2:1 image (longitude −180° at the left edge, east positive; not a picture of a single hemisphere) at `public/textures/mars_color.jpg`, set `mars: true` in `TEXTURES` in `lib/world.ts`, and bump `VERSION` in `public/sw.js`. Suggested source: the USGS/NASA Viking colorized global mosaic of Mars.

## Credits and notices

Photos are from the **NASA Image and Video Library** (https://images.nasa.gov/). NASA media is generally not subject to copyright in the United States, but each image keeps its NASA credit. Some images are artist’s concepts or photos of models and spacecraft on Earth; the card caption says which. Facts are drawn from NASA, NASA/JPL, NASA NSSDCA, NASA History and NASA PDS pages linked in each dossier.

Last Signal is an independent project made for the NASA Space Apps Challenge. **NASA does not endorse this project**, and the NASA logo is not used.

## Roadmap

Real Moon and Mars maps and relief, rover routes from official traverse data, more machines, human fact-check sign-off, and a second language.

## Team and licence

Developed By: Favour Boluwatife Philip
Team Leader: Treasure Oluwadurotimi Philip
