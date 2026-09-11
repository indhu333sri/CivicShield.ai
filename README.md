# CivicShield AI

**AI-Powered Emergency Response & Civic Safety — Prototype**

CivicShield AI is a working, static-site prototype that simulates how AI could help a city
detect, prioritize, dispatch and resolve emergencies. It connects a citizen reporting
experience, a rule-based AI triage engine, a live command-center map, and a hospital/
response-unit simulation into one end-to-end demo.

> **SIMULATION ENVIRONMENT · NO REAL EMERGENCY SERVICES CONNECTED.**
> Every incident, ambulance, hospital, police/fire unit and location in this
> prototype is simulated data generated in the browser. Nothing in this project
> is connected to a real emergency dispatch network, government database, or
> hospital system. The "AI" is a transparent, deterministic rules engine
> (see `analyzeIncident()` in `assets/app.js`), not a live LLM.

---

## What it demonstrates

```
Citizen → AI Triage → Command Center → Response Unit → Hospital → Resolution → Civic Intelligence
```

- **Citizen Portal** — a mobile-first SOS button and emergency report form.
- **AI Triage** — a keyword/rule-based engine that classifies severity, priority,
  medical urgency, recommended resources, a plain-language reasoning string, and
  a confidence score for every incident.
- **Command Center** — a dark, operational dashboard with a live Leaflet map
  (OpenStreetMap/CARTO dark tiles), shape-coded unit markers, an AI priority
  queue, an activity feed, and simulation controls (pause/resume, reset, 1×/2×
  speed, trigger emergency).
- **Live ambulance simulation** — dispatched ambulances actually move toward
  the incident tick by tick, with distance/ETA recalculated from real
  coordinates, then transition through EN ROUTE → ON SCENE → TRANSPORTING →
  resolved at the recommended hospital.
- **Civic Intelligence** — simulated administrative insights (hotspots,
  resource recommendations, hospital load, response bottlenecks, recurring
  incidents) inside the AI Intelligence screen.
- **Analytics** — incident counts, severity mix, fleet utilization, and
  response-time metrics computed from the simulated data.

## Project structure

```
CivicShield-AI/
├── index.html        # App shell — links assets, loads Leaflet from CDN
├── assets/
│   ├── style.css      # All styling (dark command-center design system)
│   └── app.js         # All application logic (data, AI rules, simulation, rendering)
└── README.md
```

No build step, no framework, no backend, no API keys, no environment
variables, no npm install. It's plain HTML/CSS/JS. The only external
dependency is the Leaflet map library and Google Fonts, both loaded from a
CDN via `<link>`/`<script>` tags in `index.html` — an internet connection is
required for the map tiles and fonts to load, but there is nothing to
install or compile.

## Run it locally

Because the app loads its own JS/CSS via relative paths, open it through a
local web server rather than double-clicking the file directly (some
browsers block `fetch`/module-style loading from `file://`). Any of these
work:

```bash
# Python 3
cd CivicShield-AI
python3 -m http.server 8000
# then open http://localhost:8000

# Node (if you have it)
npx serve CivicShield-AI

# VS Code
# Right-click index.html → "Open with Live Server"
```

If you just want the fastest possible check and your browser allows local
file scripts, you can also double-click `index.html` directly — it will
work in most modern browsers since the app uses plain `<script src>` /
`<link>` tags rather than ES modules.

## Deploy as a static site

The `CivicShield-AI/` folder is deployment-ready as-is for any static host:

- **GitHub Pages** — push the folder to a repo, enable Pages on the `main`
  branch (root), done.
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the folder or
  connect the repo; no build command is required (leave the build command
  blank / "static site").
- Any other static file host (S3 + CloudFront, Surge, Firebase Hosting,
  etc.) — just upload the three items above.

## Demo flow (recommended walkthrough for judges)

1. **Landing page** — shows the live status strip, the response pipeline
   (SOS → AI Triage → Dispatch → Live GPS → Hospital → Resolved), and a live
   mini-map preview of an actual simulated active emergency with its
   assigned ambulance.
2. Click **Demo Simulation** to jump straight into an already-active Command
   Center.
3. In the **Command Center**, click the lightning-bolt (⚡) button to trigger
   a new emergency and watch it move through AI triage, dispatch and live
   GPS tracking on the map.
4. Click any incident card or map marker to open the **incident modal**:
   AI severity/priority/confidence, recommended units, and a full
   timestamped timeline.
5. Open **AI Intelligence** for the structured decision-support view and the
   **Civic Intelligence** insights (hotspots, resource recommendations,
   hospital load, bottlenecks).
6. Open **Analytics** for the operational metrics.
7. Switch to the **Citizen Portal** (from the landing page) and press the
   **SOS** button to see the confirmation → AI analysis → dispatch →
   live-response flow from the citizen's point of view.

## Notes for evaluators

- All AI classification is rule-based and fully deterministic — see
  `analyzeIncident()` in `assets/app.js` for the exact logic. It is written
  to be swapped for a real model/API later without changing the rest of the
  app.
- All incidents, ambulances, hospitals, and locations are simulated and
  regenerate each time the simulation is reset.
- The map uses real Chennai-area coordinates for geographic realism, but no
  real-time or real-world emergency data is read or transmitted.
