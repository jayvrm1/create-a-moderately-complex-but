import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_NETWORK,
  DRONES,
  GATEWAY,
  SEED_EVENTS,
  SEED_REPORTS,
  TEAMS,
} from '../data/scenario.js';
import {
  buildRelayGraph,
  commsStatus,
  droneBattery,
  droneStateAt,
  droneTrail,
  recommendTeam,
  reportReachability,
  scoreReport,
  sortQueue,
} from '../lib/simulation.js';

let eventSeq = 0;
const nextEventId = () => `EV-${(++eventSeq).toString().padStart(4, '0')}`;

const SCENARIO_START = Date.now();

function seedEvents() {
  return SEED_EVENTS.map((event, index) => ({
    ...event,
    id: `EV-S${index + 1}`,
    live: false,
  })).reverse();
}

function createState() {
  return {
    simTime: 0,
    running: false,
    speed: 1,
    started: false,
    network: { ...DEFAULT_NETWORK },
    reports: SEED_REPORTS.map((report) => ({
      ...report,
      seedAgeMinutes: report.seedAgeMin,
    })),
    teams: TEAMS.map((team) => ({ ...team })),
    drones: DRONES.map((drone) => ({ ...drone })),
    events: seedEvents(),
    selectedId: 'RL-0423',
    reportSeq: 425,
    note: {
      tone: 'warn',
      title: 'READY — simulation paused at T+00:00',
      text: 'Normal network unavailable, relay mesh on. Three drones are at launch positions outside useful coverage: 0 of 8 open reports reachable. Press START to fly the routes.',
    },
  };
}

export function useRescueLink() {
  const [state, setState] = useState(createState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const reachRef = useRef(new Map());
  const rafRef = useRef(0);

  /* ---------------- simulation clock ---------------- */
  useEffect(() => {
    if (!state.running) return undefined;
    let last = performance.now();
    let frame = 0;

    const tick = (now) => {
      const deltaMs = Math.min(now - last, 120);
      last = now;
      const advance = (deltaMs / 1000) * stateRef.current.speed;
      setState((prev) => (prev.running ? { ...prev, simTime: prev.simTime + advance } : prev));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    rafRef.current = frame;
    return () => cancelAnimationFrame(frame);
  }, [state.running, state.speed]);

  /* ---------------- derived drone + network state ---------------- */
  const droneStates = useMemo(
    () =>
      state.drones.map((drone) => {
        const motion = droneStateAt(drone, state.simTime);
        const battery = droneBattery(drone, state.simTime);
        return {
          ...drone,
          ...motion,
          battery: battery.level,
          charging: battery.charging,
          trail: droneTrail(drone, state.simTime),
        };
      }),
    [state.drones, state.simTime],
  );

  const graph = useMemo(
    () => buildRelayGraph({ network: state.network, droneStates, drones: state.drones, gateway: GATEWAY }),
    [state.network, droneStates, state.drones],
  );

  const reports = useMemo(
    () =>
      state.reports.map((report) => {
        const ageMinutes = report.seedAgeMinutes + state.simTime / 60;
        return {
          ...report,
          ageMinutes,
          receivedAt: SCENARIO_START - report.seedAgeMinutes * 60000,
          reachability: reportReachability(report, state.network, graph, droneStates),
          ranked: scoreReport(report, ageMinutes),
        };
      }),
    [state.reports, state.simTime, state.network, graph, droneStates],
  );

  const queue = useMemo(
    () => sortQueue(reports.map((report) => ({ report, ranked: report.ranked }))),
    [reports],
  );

  const selected = useMemo(
    () => reports.find((report) => report.id === state.selectedId) ?? null,
    [reports, state.selectedId],
  );

  const recommendation = useMemo(
    () => (selected ? recommendTeam(selected, state.teams) : null),
    [selected, state.teams],
  );

  const summary = useMemo(() => {
    const open = reports.filter((report) => report.status === 'open');
    return {
      open: open.length,
      critical: open.filter((report) => report.severity === 'critical').length,
      reachable: open.filter((report) => report.reachability.reachable).length,
      unreachableCritical: open.filter(
        (report) => report.severity === 'critical' && !report.reachability.reachable,
      ).length,
      teamsAvailable: state.teams.filter((team) => team.status === 'available').length,
      teamsTotal: state.teams.length,
      dronesActive: state.drones.filter((drone) => drone.status === 'active').length,
      dronesTotal: state.drones.length,
      connectedDrones: graph.connectedCount,
    };
  }, [reports, state.teams, state.drones, graph]);

  const status = useMemo(() => commsStatus(state.network), [state.network]);

  /* ---------------- reachability change detection ---------------- */
  useEffect(() => {
    const next = new Map();
    for (const report of reports) {
      next.set(report.id, {
        reachable: report.reachability.reachable,
        via: report.reachability.via,
      });
    }
    const prev = reachRef.current;
    const changes = [];

    if (prev.size > 0) {
      for (const [id, value] of next) {
        const before = prev.get(id);
        if (!before) continue;
        if (before.reachable !== value.reachable) {
          const report = reports.find((item) => item.id === id);
          const drone = droneStates.find((item) => item.id === report?.reachability.droneId);
          changes.push({
            tone: value.reachable ? 'ok' : 'warn',
            text: value.reachable
              ? `REACHABILITY — ${id} now reachable via ${value.via.replace('RELAY · ', '')}${
                  drone ? ` (${drone.range}-unit ring)` : ''
                } at T+${formatSimLabel(stateRef.current.simTime)}.`
              : `REACHABILITY LOST — ${id} lost its simulated path at T+${formatSimLabel(stateRef.current.simTime)}.`,
          });
        }
      }
    }
    reachRef.current = next;

    if (changes.length) {
      setState((prev2) => ({
        ...prev2,
        events: [
          ...changes.map((change) => ({
            id: nextEventId(),
            atSim: prev2.simTime,
            kind: 'reach',
            live: true,
            ...change,
          })),
          ...prev2.events,
        ],
      }));
    }
  }, [reports, droneStates]);

  /* ---------------- actions ---------------- */
  const pushEvent = useCallback((entry, events) => {
    return [
      { id: nextEventId(), atSim: stateRef.current.simTime, live: true, ...entry },
      ...events,
    ];
  }, []);

  const start = useCallback(() => {
    setState((prev) => {
      if (prev.running) return prev;
      const first = !prev.started;
      return {
        ...prev,
        running: true,
        started: true,
        note: {
          tone: 'ok',
          title: first ? 'SIMULATION RUNNING — T+00:00' : 'SIMULATION RESUMED',
          text: 'Drones are following their predefined routes. Relay links and report reachability update as they move.',
        },
        events: first
          ? pushEvent(
              {
                kind: 'system',
                tone: 'ok',
                text: 'Simulation started by operator. Relay drones following pre-planned routes.',
              },
              prev.events,
            )
          : prev.events,
      };
    });
  }, [pushEvent]);

  const pause = useCallback(() => {
    setState((prev) => {
      if (!prev.running) return prev;
      return {
        ...prev,
        running: false,
        note: {
          tone: 'warn',
          title: `SIMULATION PAUSED — T+${formatSimLabel(prev.simTime)}`,
          text: 'Flight paths are frozen at their current positions. Press START to resume or STEP to advance one simulated minute.',
        },
        events: pushEvent(
          { kind: 'system', tone: 'neutral', text: `Simulation paused at T+${formatSimLabel(prev.simTime)}.` },
          prev.events,
        ),
      };
    });
  }, [pushEvent]);

  const step = useCallback(
    (seconds = 60) => {
      setState((prev) => ({
        ...prev,
        running: false,
        started: true,
        simTime: prev.simTime + seconds,
        note: {
          tone: 'warn',
          title: `STEPPED +${Math.round(seconds / 60)} MIN — T+${formatSimLabel(prev.simTime + seconds)}`,
          text: 'Drones advanced one minute along their routes without continuous animation. Reachable counts update immediately.',
        },
      }));
    },
    [],
  );

  const setSpeed = useCallback((speed) => {
    setState((prev) => ({ ...prev, speed }));
  }, []);

  const reset = useCallback(() => {
    const fresh = createState();
    reachRef.current = new Map();
    setState({
      ...fresh,
      events: [
        {
          id: nextEventId(),
          atSim: 0,
          kind: 'system',
          tone: 'neutral',
          live: true,
          text: 'SCENARIO RESET — reports, teams, drones, routes and event history restored to the starting state.',
        },
        ...fresh.events,
      ],
      note: {
        tone: 'warn',
        title: 'SCENARIO RESET — paused at T+00:00',
        text: 'Starting picture restored. Routes replay identically from T+00:00 whenever you press START.',
      },
    });
  }, []);

  const selectReport = useCallback((id) => {
    setState((prev) => ({ ...prev, selectedId: id }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedId: null }));
  }, []);

  const setNetwork = useCallback(
    (key, value) => {
      setState((prev) => {
        if (prev.network[key] === value) return prev;
        const labels = {
          normal: ['Normal network', { available: 'marked available', unavailable: 'marked unavailable' }],
          mesh: ['Relay mesh', { on: 'engaged', off: 'switched off' }],
          gateway: ['Gateway', { connected: 'connected', unavailable: 'unavailable' }],
        };
        const [label, verbs] = labels[key];
        const text = `${label} ${verbs[value]} by operator. Reachability recalculates on the next render.`;
        return {
          ...prev,
          network: { ...prev.network, [key]: value },
          note: { tone: value === 'off' || value === 'unavailable' ? 'warn' : 'ok', title: `${label.toUpperCase()} — ${verbs[value].toUpperCase()}`, text },
          events: pushEvent({ kind: 'network', tone: 'warn', text: `NETWORK — ${label} ${verbs[value]}.` }, prev.events),
        };
      });
    },
    [pushEvent],
  );

  const setDroneStatus = useCallback(
    (id, nextStatus) => {
      setState((prev) => {
        const drone = prev.drones.find((item) => item.id === id);
        if (!drone || drone.status === nextStatus) return prev;
        return {
          ...prev,
          drones: prev.drones.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)),
          note: {
            tone: nextStatus === 'active' ? 'ok' : 'warn',
            title: `${drone.callsign} — ${nextStatus.toUpperCase()}`,
            text:
              nextStatus === 'active'
                ? 'Drone restored to the mesh. It holds at its current position and adds a simulated relay link.'
                : `Drone removed from the mesh. Its coverage ring and relay links are dropped; the marker stays parked.`,
          },
          events: pushEvent(
            {
              kind: 'drone',
              tone: nextStatus === 'active' ? 'ok' : 'warn',
              text: `${drone.callsign} set to ${nextStatus.toUpperCase()} by operator.`,
            },
            prev.events,
          ),
        };
      });
    },
    [pushEvent],
  );

  const dispatch = useCallback(() => {
    setState((prev) => {
      const report = prev.reports.find((item) => item.id === prev.selectedId);
      if (!report || report.status !== 'open') return prev;
      const rec = recommendTeam(report, prev.teams);
      if (!rec.team || rec.alreadyAssigned) return prev;
      return {
        ...prev,
        reports: prev.reports.map((item) =>
          item.id === report.id
            ? { ...item, status: 'assigned', assignedTeam: rec.team.id, assignedAtSim: prev.simTime }
            : item,
        ),
        teams: prev.teams.map((team) =>
          team.id === rec.team.id ? { ...team, status: 'en_route', assignment: report.id } : team,
        ),
        note: {
          tone: 'ok',
          title: `DISPATCH APPROVED — ${rec.team.callsign ?? rec.team.id} → ${report.id}`,
          text: `${rec.team.name} marked en route to ${report.site} for ${report.people} people. Approval was an operator action; the simulator never dispatches on its own.`,
        },
        events: pushEvent(
          {
            kind: 'dispatch',
            tone: 'ok',
            text: `DISPATCH — ${rec.team.id} ${rec.team.name} tasked to ${report.id} at ${report.site} (${report.people} people, ${report.severity}). Operator approved.`,
          },
          prev.events,
        ),
      };
    });
  }, [pushEvent]);

  const fileReport = useCallback(
    (payload) => {
      const id = `RL-0${stateRef.current.reportSeq}`;
      setState((prev) => ({
        ...prev,
        reports: [
          ...prev.reports,
          {
            id,
            severity: payload.severity,
            people: payload.people,
            site: payload.site.label,
            x: payload.site.x,
            y: payload.site.y,
            seedAgeMinutes: 0,
            confidence: payload.confidence,
            source: payload.source,
            note: payload.note,
            status: 'open',
          },
        ],
        reportSeq: prev.reportSeq + 1,
        selectedId: id,
        note: {
          tone: 'warn',
          title: `REPORT FILED — ${id}`,
          text: `${payload.severity.toUpperCase()} · ${payload.people} people at ${payload.site.label}. Added to the demo score queue and reachability simulation.`,
        },
        events: pushEvent(
          {
            kind: 'report',
            tone: 'warn',
            text: `REPORT ${id} filed manually — ${payload.severity}, ${payload.people} people, ${payload.site.label}, ${payload.source}.`,
          },
          prev.events,
        ),
      }));
      return id;
    },
    [pushEvent],
  );

  return {
    ...state,
    scenarioStart: SCENARIO_START,
    gateway: GATEWAY,
    droneStates,
    graph,
    reports,
    selected,
    queue,
    recommendation,
    summary,
    status,
    actions: {
      start,
      pause,
      step,
      reset,
      setSpeed,
      selectReport,
      clearSelection,
      setNetwork,
      setDroneStatus,
      dispatch,
      fileReport,
    },
  };
}

export function formatSimLabel(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Log stamps keep their direction so seeded history reads as pre-simulation. */
export function formatLogStamp(seconds) {
  const sign = seconds < 0 ? '-' : '+';
  return `T${sign}${formatSimLabel(Math.abs(seconds))}`;
}
