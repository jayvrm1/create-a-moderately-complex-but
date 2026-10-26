# RESCUELINK // AEGIS — Kaiva Basin relay simulation console

A front-end prototype of a **tactical response map** for a fictional monsoon-flood exercise in the Kaiva Basin
(Sector V-7). Three simulated relay drones fly pre-planned routes over a flooded basin; as they move, simulated
coverage grows, relay links appear, and help reports flip from **UNREACHABLE** to **REACHABLE**. The operator
prioritises reports, reviews a suggested team, and dispatches under human control.

> ### SIMULATED COVERAGE — NOT RADIO PERFORMANCE
> This is a demo interface running on invented data. It does **not** model, predict or prove real radio,
> cellular, satellite, drone, phone or emergency-service coverage. It does not control any aircraft. No live
> system, backend, account, API key or AI service is involved — everything is computed in the browser from a
> hand-authored scenario, and the "priority score" is a demo heuristic, **not** a validated emergency triage
> protocol. All places, agencies, call signs, people counts and timings are fictional.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production bundle in dist/
npm run preview  # serve the built bundle
```

Node 18+ (tested on Node 22, Vite 8). No sign-in, no backend, no network calls at runtime.

---

## The screen

| Region | What it does |
| --- | --- |
| **Top bar** | Live counts — open reports, critical reports, simulated reachable reports, teams free, relays up/down — plus the simulated clock (`T+04:12`) and the transport controls. |
| **Map** | The tactical map: flood extent, river path, reports, teams, the AEGIS gateway, relay drones with coverage rings and trails, and dashed relay links between connected nodes. The banner across the map reads `SIMULATED COVERAGE — NOT RADIO PERFORMANCE` at all times. |
| **Left rail** | Sections: Live Operations, Reports, Response Teams, Relay Network, Event Log. |
| **Right rail** | Section context — selected report detail with score breakdown, the team recommendation, network toggles, the activity log, and the drone roster (call sign, task, link state, battery). |
| **Priority queue** | Bottom strip, sorted by demo priority score. Click a card to select that report on the map. |
| **Transport bar** | `START / PAUSE`, `STEP +1 MIN`, `RESET`, speed `0.5× 1× 2× 4×`, the simulated clock and a flight-plan progress track. |

### Controls

- **START / PAUSE** — run or hold the simulated clock. Drones move, batteries drain, report ages grow and
  reachability is re-evaluated every frame.
- **STEP +1 MIN** — advance the simulation by exactly 60 simulated seconds in one jump (works while paused).
  Under `prefers-reduced-motion` this is the *only* way time advances.
- **RESET** — restores the whole scenario: reports, statuses, team tasking, drone positions, routes, battery,
  network toggles and the event log return to `T+00:00`.
- **Speed** — `0.5× / 1× / 2× / 4×` clock multiplier (motion stays smooth; only the clock changes).
- **Map** — click a report marker, team marker or drone to select it; `Enter`/`Space` on a focused marker does the
  same. Escape or `CLEAR SELECTION` deselects.
- **Network controls** — toggle `MESH`, `GATEWAY` and `NET OUT` (normal network) in Relay Network and watch the
  relay graph and reachability recompute. Turning the gateway to `UNAVAILABLE` collapses every relay path.
- **New report** — `+ REPORT` opens a dialog; a new report enters the queue and is scored like any other.

---

## Seven-step demo

1. **Open on Live Operations.** The clock reads `T+00:00`. `REACHABLE 0/8`, `RELAYS UP 0/5`. Every report on the
   map is marked `NO LINK`, and the event log shows the simulated network outage. Note the drones: HERON 1 routes
   west, HERON 2 climbs north, HERON 3 works the Tessel chain — and HERON 4 sits parked and `OFFLINE` with a flat
   battery while HERON 5 is parked on the staging pad in `STANDBY`. Parked drones never move.
2. **Press START (or 4× then START).** The drones advance along their planned routes, each with a heading marker
   and a fading trail; planned routes and waypoints are drawn as thin dashed lines. Batteries fall, HERON 1 starts
   climbing toward staging.
3. **Watch link lines appear.** As HERON 1 and HERON 2 enter gateway range and then each other's range, dashed
   relay links appear between nodes and `RELAYS UP` climbs. Report markers that fall inside a drone's simulated
   coverage ring switch to `REACHABLE · RELAY — HERON n`, and a `REACHABILITY — RL-xxxx now reachable via HERON n`
   line is written to the event log. Coverage that arrives *after* a report was filed is the point of the exercise.
4. **Select a reachable critical report** (for example **RL-0423 Greyfall Transit Shed**) from the map or the
   priority queue. The inspector shows people, waiting time, simulated location confidence, the coverage ring that
   carries it, and a transparent score breakdown (severity, people, waiting time) with a note that the score is a
   demo heuristic.
5. **Read the recommendation.** The inspector suggests the closest *eligible* team — distance, capacity, role and
   status are shown — and explains why other teams were passed over. Nothing is dispatched automatically.
6. **Dispatch with the human control.** Press `DISPATCH`. The report becomes `ASSIGNED`, the team becomes
   `EN ROUTE`, the map shows the team tasking, and the event log records
   `DISPATCH — VOLT-01 … tasked to RL-0417 … operator approved.` The dispatch only happens because you pressed it.
7. **Break the mesh, then reset.** Turn `GATEWAY` to `UNAVAILABLE` (or `MESH` off) in Relay Network: relay links
   drop to zero, `REACHABLE` falls back to `0/8`, reports return to `NO LINK`. Then press **RESET** — positions,
   clock, statuses and log all return to the opening state, ready to run again.

Reduced-motion users get the same sequence: with `prefers-reduced-motion: reduce`, the banner reads
`REDUCED MOTION ON · drones advance only when you press STEP`, the sweep and decorative animation stop, and each
`STEP +1 MIN` advances drones one minute along their routes (reachability updates immediately).

---

## How the simulation works

All of it is deterministic — the same clock value always produces the same frame.

- **Motion** (`src/lib/simulation.js`): each active drone owns a route of `{ to, task }` waypoints and a speed in
  map units per simulated second. `droneStateAt()` walks the legs by elapsed time, so a drone is always at an
  exact, reproducible point, reports its current task, and holds at its final waypoint while charging at staging.
  Trails are sampled backwards along the same route — they are path history, not random drift. Offline, standby
  and recovered drones have empty routes and never move.
- **Relay graph**: a drone relays when it is active, the mesh is on, and it is inside gateway range or chained
  through another connected drone. Coverage is a fixed radius per drone and each report is "reachable" when it
  falls inside a connected drone's ring; the shortest hop distance is reported in the inspector.
- **Reports and ages**: report ages advance with the clock, so the queue order changes over time as waiting time
  accrues.
- **Priority score**: `severity + people + waiting time`, capped at 100, with each component shown in the
  inspector. It is a demo ranking heuristic only.
- **Team recommendation**: filters to teams that are free, close enough and role-appropriate, then picks the
  nearest; the reason string explains the choice and the exclusions.
- **Dispatch** is a separate, explicit operator action — every action goes through the state hook and is logged
  with a simulated timestamp (`T-…` for events that pre-date the exercise).

### Files

```
src/
  data/scenario.js        invented scenario data: reports, teams, drones + routes, events, flood geometry
  lib/simulation.js       pure logic: motion, trails, battery, relay graph, reachability, scoring, recommendation
  state/useRescueLink.js  simulation clock (rAF), state reducer, actions, logging
  components/             map, rails, transport bar, queue strip, dialogs, small UI primitives
  styles.css              console styling (no CSS framework)
```

Data, logic and view are kept apart: `scenario.js` holds only numbers and strings, `simulation.js` is pure
functions of that data plus the clock, and components only render what the state hook exposes.

---

## Notes

- **Visual language**: flat dark tactical map, hairline rules, mono numerals, no rounded dashboard cards,
  gradients, glassmorphism or decorative holograms.
- **Motion** is limited to purposeful movement (drone travel, trail fade, link draw-in) and is disabled under
  `prefers-reduced-motion`.
- **Responsive**: layout reflows down to phone width; the right rail becomes a collapsible inspector and map
  labels shed secondary text on narrow screens.
- **Accessibility**: all controls are real buttons with `aria-pressed` / `aria-expanded` state, map markers are
  keyboard-focusable, and selection works with `Enter` and `Space`.
