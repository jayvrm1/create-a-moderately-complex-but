/**
 * RESCUELINK — simulation engine.
 *
 * Pure, framework-free logic. Everything is deterministic: drone position,
 * battery and report reachability are functions of the elapsed simulated time,
 * so Reset always replays exactly the same scenario.
 *
 * Nothing here models real flight, radio propagation, satellite or cellular
 * service. Distances are schematic map units on a 1000 x 700 grid.
 */

export const SEVERITIES = ['critical', 'high', 'moderate', 'low'];

export const SEVERITY_META = {
  critical: { label: 'Critical', order: 0, weight: 46, tone: 'critical', glyph: 'triangle' },
  high: { label: 'High', order: 1, weight: 30, tone: 'high', glyph: 'square' },
  moderate: { label: 'Moderate', order: 2, weight: 16, tone: 'moderate', glyph: 'circle' },
  low: { label: 'Low', order: 3, weight: 7, tone: 'low', glyph: 'diamond' },
};

export const TEAM_STATUS_LABEL = {
  available: 'AVAILABLE',
  en_route: 'EN ROUTE',
  unavailable: 'UNAVAILABLE',
};

export const DRONE_STATUS_LABEL = {
  active: 'ACTIVE',
  standby: 'STANDBY',
  offline: 'OFFLINE',
};

export const SPEEDS = [
  { id: '0.5', label: '0.5×', factor: 0.5 },
  { id: '1', label: '1×', factor: 1 },
  { id: '2', label: '2×', factor: 2 },
  { id: '4', label: '4×', factor: 4 },
];

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/* ------------------------------------------------------------------ */
/* Drone motion                                                        */
/* ------------------------------------------------------------------ */

function legLengths(drone) {
  const points = [drone.start, ...drone.legs.map((leg) => leg.to)];
  const lengths = [];
  for (let i = 1; i < points.length; i += 1) {
    lengths.push(distance(points[i - 1], points[i]));
  }
  return { points, lengths };
}

/** Total time in simulated seconds to fly the whole route once. */
export function routeDuration(drone) {
  if (!drone.legs.length || !drone.speed) return 0;
  const { lengths } = legLengths(drone);
  return lengths.reduce((sum, len) => sum + len, 0) / drone.speed;
}

/**
 * Drone state at simulated time t (seconds since scenario start).
 * Returns position, heading, current task, whether it is moving, and
 * how far along the route it is.
 */
export function droneStateAt(drone, t) {
  const { points, lengths } = legLengths(drone);
  const duration = routeDuration(drone);
  const simT = Math.max(0, t);

  if (!drone.legs.length || !drone.speed) {
    return {
      x: drone.start.x,
      y: drone.start.y,
      heading: 0,
      task: drone.status === 'active' ? drone.standbyTask ?? 'HOLDING · STAGING' : drone.routeName,
      moving: false,
      progress: 0,
      duration,
      legIndex: -1,
      atStaging: false,
      travelled: 0,
    };
  }

  const flown = Math.min(simT * drone.speed, lengths.reduce((sum, len) => sum + len, 0));
  let remaining = flown;
  let legIndex = 0;
  for (let i = 0; i < lengths.length; i += 1) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      legIndex = i;
      break;
    }
    remaining -= lengths[i];
  }

  const holding = simT >= duration;
  const from = points[legIndex];
  const to = points[legIndex + 1];
  const ratio = holding ? 1 : clamp(remaining / lengths[legIndex], 0, 1);
  const x = from.x + (to.x - from.x) * ratio;
  const y = from.y + (to.y - from.y) * ratio;
  const heading = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const lastPoint = points[points.length - 1];
  const atStaging = Boolean(drone.recoverAtStaging) && holding && distance(lastPoint, drone.start) > 0 && Boolean(drone.legs.some((leg) => leg.task.includes('RTB')));

  return {
    x,
    y,
    heading,
    task: holding ? drone.holdTask ?? drone.legs[legIndex].task : drone.legs[legIndex].task,
    moving: !holding,
    progress: duration === 0 ? 1 : clamp(simT / duration, 0, 1),
    duration,
    legIndex,
    atStaging,
    travelled: flown,
  };
}

/** Short fading trail: recent positions sampled from the deterministic route. */
export function droneTrail(drone, t, samples = 7, spacing = 0.75) {
  const state = droneStateAt(drone, t);
  if (!state.moving) return [];
  const trail = [];
  for (let i = samples; i >= 1; i -= 1) {
    const past = Math.max(0, t - i * spacing);
    if (past <= 0) continue;
    const point = droneStateAt(drone, past);
    trail.push({ x: point.x, y: point.y, age: i / samples });
  }
  return trail;
}

/** Deterministic battery: drains while moving, recovers while parked at staging. */
export function droneBattery(drone, t) {
  if (drone.status !== 'active') return { level: drone.batteryStart, charging: false };
  const duration = routeDuration(drone);
  const movingSeconds = Math.min(Math.max(0, t), duration);
  const parkedSeconds = Math.max(0, t - duration);
  let level = drone.batteryStart - movingSeconds * drone.drain;
  if (drone.recoverAtStaging) level += parkedSeconds * 0.06;
  return {
    level: clamp(level, 0, 100),
    charging: drone.recoverAtStaging && parkedSeconds > 0,
  };
}

/* ------------------------------------------------------------------ */
/* Relay mesh graph                                                    */
/* ------------------------------------------------------------------ */

/**
 * Build the live simulated relay topology from current drone positions.
 * A drone relays when it is active (and, if the scenario models it, reachable).
 * Mesh must be on, the gateway must be connected, and a drone is connected
 * when inside gateway range or chained through another connected drone.
 */
export function buildRelayGraph({ network, droneStates, drones, gateway }) {
  const meshOn = network.mesh === 'on';
  const gatewayUp = network.gateway === 'connected';
  const hops = {};
  const links = [];
  const active = droneStates.filter((state) => state.status === 'active');

  for (const state of active) hops[state.id] = null;

  if (!meshOn || !gatewayUp) {
    return { meshOn, gatewayUp, hops, links, connectedCount: 0, active };
  }

  const queue = [];
  for (const state of active) {
    if (distance(state, gateway) <= gateway.range) {
      hops[state.id] = 1;
      queue.push(state);
      links.push({ from: state.id, to: gateway.id, kind: 'gateway' });
    }
  }

  while (queue.length) {
    const current = queue.shift();
    for (const state of active) {
      if (hops[state.id] != null) continue;
      if (distance(current, state) <= Math.min(current.linkRange, state.linkRange)) {
        hops[state.id] = hops[current.id] + 1;
        queue.push(state);
        links.push({ from: state.id, to: current.id, kind: 'drone' });
      }
    }
  }

  return {
    meshOn,
    gatewayUp,
    hops,
    links,
    connectedCount: active.filter((state) => hops[state.id] != null).length,
    active,
  };
}

/* ------------------------------------------------------------------ */
/* Report reachability                                                 */
/* ------------------------------------------------------------------ */

export function reportReachability(report, network, graph, droneStates) {
  if (network.normal === 'available') {
    return {
      reachable: true,
      via: 'NORMAL NETWORK',
      droneId: null,
      droneCallsign: null,
      hops: null,
      reason: 'Normal network is marked available — direct simulated path.',
    };
  }

  if (network.mesh === 'off') {
    return {
      reachable: false,
      via: 'NO PATH',
      droneId: null,
      droneCallsign: null,
      hops: null,
      reason: 'Normal network unavailable and the relay mesh is switched off. Report is held locally.',
    };
  }

  if (network.gateway === 'unavailable') {
    return {
      reachable: false,
      via: 'GATEWAY DOWN',
      droneId: null,
      droneCallsign: null,
      hops: null,
      reason: 'Relay mesh is on but the simulated gateway is unavailable, so nothing can terminate.',
    };
  }

  let best = null;
  for (const state of graph.active) {
    const d = distance(state, report);
    if (d > state.range) continue;
    const hopCount = graph.hops[state.id];
    if (hopCount == null) continue;
    if (!best || d < best.distance || (d === best.distance && hopCount < best.hops)) {
      best = { state, distance: d, hops: hopCount };
    }
  }

  if (best) {
    return {
      reachable: true,
      via: `RELAY · ${best.state.callsign}`,
      droneId: best.state.id,
      droneCallsign: best.state.callsign,
      hops: best.hops,
      distance: Math.round(best.distance),
      reason: `Inside simulated coverage of ${best.state.callsign} (${Math.round(best.distance)} units), ${best.hops} mesh ${best.hops === 1 ? 'hop' : 'hops'} from the gateway.`,
    };
  }

  const nearest = [...graph.active]
    .map((state) => ({ state, d: distance(state, report) }))
    .sort((a, b) => a.d - b.d)
    .pop();
  const gap = nearest ? Math.max(0, Math.round(nearest.d - nearest.state.range)) : null;

  return {
    reachable: false,
    via: 'NO PATH',
    droneId: null,
    droneCallsign: null,
    hops: null,
    gap,
    reason: nearest
      ? `Outside every simulated coverage ring. Nearest relay ${nearest.state.callsign} is ${gap} units short of reaching this position.`
      : 'No active relays in the mesh.',
  };
}

/* ------------------------------------------------------------------ */
/* Priority score                                                      */
/* ------------------------------------------------------------------ */

/** Deterministic demo score (0-100): severity + people + waiting time. */
export function scoreReport(report, ageMinutes) {
  const severityPoints = SEVERITY_META[report.severity]?.weight ?? 0;
  const peoplePoints = Math.min(report.people, 24) * 1.6;
  const agePoints = Math.min(Math.max(0, ageMinutes), 90) * 0.22;
  const total = severityPoints + peoplePoints + agePoints;

  return {
    score: Number(Math.min(100, total).toFixed(1)),
    parts: [
      {
        key: 'severity',
        label: 'Severity',
        value: Number(severityPoints.toFixed(1)),
        detail: `${SEVERITY_META[report.severity].label} → ${severityPoints} pts`,
      },
      {
        key: 'people',
        label: 'People',
        value: Number(peoplePoints.toFixed(1)),
        detail: `${report.people} ${report.people === 1 ? 'person' : 'people'} × 1.6 (cap 24)`,
      },
      {
        key: 'age',
        label: 'Waiting time',
        value: Number(agePoints.toFixed(1)),
        detail: `${Math.floor(ageMinutes)} min × 0.22 (cap 90 min)`,
      },
    ],
  };
}

export function urgencyBand(score) {
  if (score >= 70) return { label: 'CRITICAL PRIORITY', tone: 'critical' };
  if (score >= 45) return { label: 'ELEVATED PRIORITY', tone: 'high' };
  if (score >= 25) return { label: 'ROUTINE PRIORITY', tone: 'moderate' };
  return { label: 'LOW PRIORITY', tone: 'low' };
}

/** Open reports first, then demo score desc, then severity, people, id. */
export function sortQueue(entries) {
  return [...entries].sort((a, b) => {
    if (a.report.status !== b.report.status) return a.report.status === 'open' ? -1 : 1;
    if (b.ranked.score !== a.ranked.score) return b.ranked.score - a.ranked.score;
    const sev = SEVERITY_META[a.report.severity].order - SEVERITY_META[b.report.severity].order;
    if (sev !== 0) return sev;
    if (b.report.people !== a.report.people) return b.report.people - a.report.people;
    return a.report.id.localeCompare(b.report.id);
  });
}

/* ------------------------------------------------------------------ */
/* Team recommendation                                                 */
/* ------------------------------------------------------------------ */

export function recommendTeam(report, teams) {
  if (!report) return { team: null, candidate: null, rejected: [], eligible: [], reason: 'No report selected.' };

  const evaluated = teams.map((team) => {
    const d = distance(team, report);
    let reject = null;
    if (team.status === 'en_route') reject = `already tasked to ${team.assignment}`;
    else if (team.status === 'unavailable') reject = 'marked unavailable';
    else if (team.capacity < report.people) reject = `capacity ${team.capacity} < ${report.people} people`;
    return { team, distance: Math.round(d), reject };
  });

  const eligible = evaluated
    .filter((item) => !item.reject)
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        b.team.capacity - a.team.capacity ||
        a.team.id.localeCompare(b.team.id),
    );

  const best = eligible[0] ?? null;
  const alreadyAssigned = evaluated.find(
    (item) => item.team.status === 'en_route' && item.team.assignment === report.id,
  );

  if (alreadyAssigned) {
    return {
      team: alreadyAssigned.team,
      candidate: alreadyAssigned,
      eligible: [],
      rejected: evaluated.filter((item) => item.team.id !== alreadyAssigned.team.id),
      alreadyAssigned: true,
      reason: `${alreadyAssigned.team.name} is already en route to this report.`,
    };
  }

  if (!best) {
    return {
      team: null,
      candidate: null,
      eligible: [],
      rejected: evaluated,
      reason:
        evaluated.length === 0
          ? 'No response teams exist in this scenario.'
          : 'No available team has capacity for this many people. Every team is listed with the reason it was ruled out.',
    };
  }

  const slack = best.team.capacity - report.people;
  const others = eligible.length - 1;
  return {
    team: best.team,
    candidate: best,
    eligible,
    rejected: evaluated.filter((item) => item.reject),
    reason: `${best.team.name} is the nearest available team with capacity for ${report.people} — ${best.distance} map units away, ${best.team.capacity} seats (${slack} spare)${
      others > 0 ? `, closer than ${others} other eligible ${others === 1 ? 'team' : 'teams'}` : ''
    }.`,
  };
}

/* ------------------------------------------------------------------ */
/* Network status                                                      */
/* ------------------------------------------------------------------ */

export function commsStatus(network) {
  if (network.normal === 'available') {
    return {
      code: 'NOMINAL',
      label: 'Network restored',
      tone: 'ok',
      detail: 'Normal network marked available in this simulation; relay paths are shown for reference.',
    };
  }
  if (network.mesh === 'on' && network.gateway === 'connected') {
    return {
      code: 'RELAY ONLY',
      label: 'Degraded · relay only',
      tone: 'warn',
      detail: 'Normal network down. Simulated relay mesh is carrying reachable reports to the gateway.',
    };
  }
  if (network.mesh === 'on') {
    return {
      code: 'PARTIAL',
      label: 'Mesh up · gateway down',
      tone: 'warn',
      detail: 'Relays can see each other, but no gateway path exists, so reports stay local.',
    };
  }
  return {
    code: 'BLACKOUT',
    label: 'Communications blackout',
    tone: 'critical',
    detail: 'No normal network and no relay mesh. Reports cannot leave the field.',
  };
}
