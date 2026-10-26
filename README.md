# RESCUELINK // AEGIS

An emergency response coordination console prototype for the fictional **Monsoon Flood Response** exercise in
Sector V-7 (Kaiva Basin).

> **SIMULATION / NOT CONNECTED TO LIVE SYSTEMS.**
> This is a front-end prototype. It does **not** provide phone, cellular, satellite, drone, radio or emergency-service
> connectivity; it does not control aircraft; and it does not prove or predict real coverage. All incidents, teams,
> places, people counts and timings are invented for demonstration. The priority score is a demo heuristic, not a
> validated emergency triage protocol.

The console walks one workflow end to end:

**Communications outage → simulated relay coverage → prioritised help report → recommended response team →
human-approved dispatch → logged action.**

---

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (Vite defaults to `http://localhost:5173`). No sign-in, backend, API key or network access
is required — all state lives in the browser.

```bash
npm run build     # production bundle in dist/
npm run preview   # serve the production bundle
```

Requires Node 18+. Tested with Node 22 and Vite 8.

---

## Demo flow (about two minutes)

1. **Land on Live Operations.** The scenario opens in a blackout: normal network unavailable, relay mesh off. The
   indicators show `0/8` reports reachable and the map overlays read `MESH OFF`. The critical report
   **RL-0423 · Greyfall Transit Shed** is preselected, and the recommendation panel explains that
   **Heavy 3 (VOLT-03)** is the nearest available team with capacity for 21 people.
2. **Turn the simulated relay mesh on** in *Network controls*. Three powered nodes link to the gateway, coverage rings
   and relay links appear, and reachability jumps to `5/8`. A status explanation and a log entry record the change.
   The critical Greyfall report is still unreachable — it sits outside every powered node's radius.
3. **Open Relay Network → restore node AEGIS-04 Ridge** (it starts on standby). The critical report becomes reachable (AEGIS-04 Ridge · 1 hop),
   the map updates and the event log records the node change. Try setting the gateway to *Unavailable* to watch
   reachability collapse back to `0/8`.
4. **Select reports.** Click a map marker or a queue row — both update the same detail panel: ID, severity, people,
   received time, location confidence, source, simulated reachability, priority reasoning and score breakdown.
5. **Approve a dispatch** in *Recommended response*. The report becomes **Assigned**, the team becomes **En Route**,
   the map marker and queue update, and a timestamped `DISPATCH` entry appears immediately in the event log. If the selected report has no simulated path, the panel says so before you approve.
6. **Try the edges.** Select a report nobody can handle (dispatch a big team first, or file a 30-person report) to see
   the explicit *No eligible team* explanation with a disabled dispatch button. Use **Reset Scenario** to restore the
   exact starting picture, and **New Report** to inject your own fictional report.

---

## What works

| Area | Behaviour |
| --- | --- |
| Navigation rail | Live Operations, Reports, Response Teams, Relay Network, Event Log — active section marked; collapses to icon + short label, then to a horizontal bar on phones |
| Command header | Exercise name, sector, schematic grid note, live local clock, incident status derived from network state, persistent simulation warning, **Reset Scenario** and **New Report** |
| Indicators | Open reports, critical reports, reachable reports, available teams, active relay nodes — all computed from state every tick |
| Map | Schematic SVG (no tiles, works offline): fictional flood extent, spill channel, report markers (severity shape + colour + label), team positions and statuses, simulated relay nodes, gateway, coverage rings, mesh links, selected-report reticle, legend, grid references, scale and orientation marks |
| Network controls | Normal network Available/Unavailable, simulated relay mesh On/Off, gateway Connected/Unavailable. Each change recalculates reachability, redraws the map, updates counts and writes an explainable status note plus a log entry |
| Selected report | Same panel from map or queue: ID, severity, people, received time and age, location confidence, source, simulated reachability with the reason (node, distance, hop count, or why there is no path), priority explanation and expandable score breakdown |
| Recommended response | Nearest eligible available team with sufficient capacity, with a written justification, alternatives expander, rejected-team reasons, and a disabled state when nothing qualifies |
| Dispatch | Operator-approved only: report → **Assigned**, team → **En Route**, timestamped log entry, dispatch panel switches to a recorded state |
| Priority queue | Deterministic score ordering with rank, ID, location, severity, people, age, urgency meter, status and a reachability dot; assigned reports stay visible below the open queue |
| Event log | Seeded history plus live entries for network changes, node power changes, new reports and dispatches; filterable by kind; newest first; scrollable panel and full-page view |
| Reports page | Severity and status filters that work, full queue, same detail/recommendation panels, and a source/confidence audit grid |
| Teams page | Team posture cards with capacity, distance to the selected report, eligibility verdicts and the tasking rules, plus a link from an assigned team to its report |
| Relay page | Gateway status, node table with simulated power controls (`Take standby` / `Restore node`), hop counts, per-node covered-report counts and a per-report reachability audit |
| Accessibility | Keyboard-operable markers and rows, visible focus rings, skip link, focus trap and Escape handling in the report dialog, ARIA labels that restate marker contents, labelled colour usage (colour is never the only signal), status regions, reduced-motion support |
| Responsive | 4-column desktop console → 2-column → single column; the schematic gains horizontal pan on narrow screens rather than shrinking labels into illegibility |

---

## How the simulation decides things

All logic is pure and lives in [`src/lib/simulation.js`](src/lib/simulation.js), separate from the components.

**Demo priority score (0–100).** `severity + people + age + low confidence`, capped at 100:

| Factor | Points |
| --- | --- |
| Severity | critical 46 · high 30 · moderate 16 · low 7 |
| People | `min(people, 24) × 1.6` |
| Report age | `min(age in minutes, 90) × 0.22` |
| Low location confidence | confidence below 60% adds `(0.6 − confidence) × 40` |

Ties break deterministically by severity, then people, then report ID. Open reports always rank above assigned ones.
This is a demonstration heuristic for explaining ordering — **not** a validated triage protocol.

**Simulated reachability.** A report is reachable when:

1. the normal network is marked available (direct path), **or**
2. the relay mesh is on, the gateway is connected, and the report lies inside the radius of a **powered** node that has
   a mesh path to the gateway. Nodes reach the gateway directly when within gateway range, otherwise by chaining through
   other powered nodes within link range (hop count is shown).

Distances are plain map units in a 1000 × 700 schematic. Coverage rings are geometric illustrations only.

**Team recommendation.** Candidates must be `available` and have capacity ≥ the report's people count. The nearest
candidate wins (distance in map units); capacity then team ID break ties. Everything else is listed with a reason.
The simulator never dispatches — the operator presses the button.

---

## Project structure

```
index.html
vite.config.js
src/
  main.jsx                    entry point + bundled fonts
  App.jsx                     shell, section routing, dialog, live region
  styles.css                  console styling, responsive rules, reduced motion
  data/scenario.js            fictional reports, teams, relay nodes, gateway, geography
  lib/simulation.js           scoring, reachability, relay graph, recommendation (pure)
  lib/format.js               time/age/percentage formatting
  state/useRescueLink.js      state, actions, event log, network/node controls
  components/                 rail, header, indicators, map, legend, controls,
                              detail, queue, recommendation, event log, dialog, ui primitives
  views/                      Ops, Reports, Teams, Relay, Log
```

No backend, no external AI, no API keys, no map tile provider, no persistence. Reloading re-seeds the exercise.

---

## Simulation limitations

- Not an emergency system. Do not use it to make real safety decisions.
- No real connectivity of any kind: no telephony, SMS, cellular, satellite, radio, mesh networking or drone links.
  "Reports" and "relay" statuses are UI state only.
- No aircraft control, flight planning, telemetry or geofencing. Nodes and the gateway are points on a drawing.
- Coverage rings are distance circles over an invented coordinate space. They are not radio propagation models and
  say nothing about real-world coverage, terrain, weather or capacity.
- Positions, distances, travel times, team capacities, locations and severity are fictional and not geospatially valid.
- The priority score is a demo formula with arbitrary weights; it is not clinically or operationally validated.
- Nothing is stored beyond the current browser session, and no data is transmitted anywhere.

Built as a front-end prototype for the SIH 2026 problem statement; all data is fabricated for demonstration.
