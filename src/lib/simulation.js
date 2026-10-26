/**
 * RESCUELINK // AEGIS — simulation logic
 *
 * Pure, framework-free functions. Everything here models a fictional exercise:
 * no real radio, cellular, satellite or aircraft behaviour is represented.
 */

export const SEVERITIES = ['critical', 'high', 'moderate', 'low'];

export const SEVERITY_META = {
  critical: { label: 'Critical', order: 0, weight: 46, tone: 'critical' },
  high: { label: 'High', order: 1, weight: 30, tone: 'high' },
  moderate: { label: 'Moderate', order: 2, weight: 16, tone: 'moderate' },
  low: { label: 'Low', order: 3, weight: 7, tone: 'low' },
};

export const TEAM_STATUS_LABEL = {
  available: 'Available',
  en_route: 'En route',
  unavailable: 'Unavailable',
};

/**
 * Map distance in the schematic's 1000 x 700 coordinate space.
 * Treated as "map units" only — never presented as real terrain distance.
 */
export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/* ------------------------------------------------------------------ */
/* Priority score                                                      */
/* ------------------------------------------------------------------ */

/**
 * Deterministic demo priority score (0-100). Not a validated triage tool.
 * severity weight + people count + report age + low location confidence.
 */
export function scoreReport(report, now = Date.now()) {
  const severityPoints = SEVERITY_META[report.severity]?.weight ?? 0;
  const peoplePoints = Math.min(report.people, 24) * 1.6;
  const ageMinutes = Math.max(0, (now - report.receivedAt) / 60000);
  const agePoints = Math.min(ageMinutes, 90) * 0.22;
  const confidencePoints =
    report.confidence < 0.6 ? Number(((0.6 - report.confidence) * 40).toFixed(2)) : 0;

  const total = severityPoints + peoplePoints + agePoints + confidencePoints;

  return {
    score: Number(Math.min(100, total).toFixed(1)),
    ageMinutes,
    parts: [
      {
        key: 'severity',
        label: 'Severity',
        value: Number(severityPoints.toFixed(1)),
        detail: `${SEVERITY_META[report.severity]?.label ?? report.severity} → ${severityPoints} pts`,
      },
      {
        key: 'people',
        label: 'People',
        value: Number(peoplePoints.toFixed(1)),
        detail: `${report.people} ${report.people === 1 ? 'person' : 'people'} × 1.6 pts (cap 24)`,
      },
      {
        key: 'age',
        label: 'Report age',
        value: Number(agePoints.toFixed(1)),
        detail: `${Math.floor(ageMinutes)} min × 0.22 pts (cap 90 min)`,
      },
      {
        key: 'confidence',
        label: 'Location confidence',
        value: confidencePoints,
        detail:
          report.confidence < 0.6
            ? `${Math.round(report.confidence * 100)}% is below 60% → ${confidencePoints} pts`
            : `${Math.round(report.confidence * 100)}% is 60% or above → 0 pts`,
      },
    ],
  };
}

/** Urgency band used only as a readable label for the demo score. */
export function urgencyBand(score) {
  if (score >= 70) return { label: 'Critical priority', tone: 'critical' };
  if (score >= 45) return { label: 'Elevated priority', tone: 'high' };
  if (score >= 25) return { label: 'Routine priority', tone: 'moderate' };
  return { label: 'Low priority', tone: 'low' };
}

/**
 * Open reports first, ordered by score (desc), then severity / people / id.
 * Assigned reports are kept visible after the open queue.
 */
export function buildPriorityQueue(reports, now = Date.now()) {
  return reports
    .map((report) => ({ report, ranked: scoreReport(report, now) }))
    .sort((a, b) => {
      if (a.report.status !== b.report.status) return a.report.status === 'open' ? -1 : 1;
      if (b.ranked.score !== a.ranked.score) return b.ranked.score - a.ranked.score;
      const sev = SEVERITY_META[a.report.severity].order - SEVERITY_META[b.report.severity].order;
      if (sev !== 0) return sev;
      if (b.report.people !== a.report.people) return b.report.people - a.report.people;
      return a.report.id.localeCompare(b.report.id);
    });
}

/* ------------------------------------------------------------------ */
/* Relay mesh / reachability                                           */
/* ------------------------------------------------------------------ */

/**
 * Build the simulated relay graph.
 * - a node relays only when powered ("active")
 * - mesh must be on for any node-to-node or node-to-gateway link
 * - a node can reach the gateway if it is within `gateway.range` of it,
 *   or if it is chained through other reachable nodes within link range.
 */
export function computeRelayGraph(network, nodes, gateway) {
  const meshOn = network.mesh === 'on';
  const gatewayUp = network.gateway === 'connected';

  const activeNodes = nodes.filter((node) => node.status === 'active');
  const hops = Object.fromEntries(nodes.map((node) => [node.id, null]));
  const links = [];

  if (!meshOn) {
    return { meshOn, gatewayUp, activeNodes, hops, links, relayedNodeCount: 0, gatewayLinks: 0 };
  }

  // Nodes directly in gateway range (only if gateway is connected).
  const queue = [];
  if (gatewayUp) {
    for (const node of activeNodes) {
      if (distance(node, gateway) <= gateway.range) {
        hops[node.id] = 1;
        queue.push(node);
        links.push({ from: node.id, to: gateway.id, hop: 1 });
      }
    }
  }

  // Chain outward across active nodes within link range.
  while (queue.length) {
    const current = queue.shift();
    for (const node of activeNodes) {
      if (hops[node.id] != null) continue;
      if (distance(current, node) <= node.linkRange) {
        hops[node.id] = hops[current.id] + 1;
        queue.push(node);
        links.push({ from: node.id, to: current.id, hop: hops[node.id] });
      }
    }
  }

  return {
    meshOn,
    gatewayUp,
    activeNodes,
    hops,
    links,
    relayedNodeCount: activeNodes.filter((node) => hops[node.id] != null).length,
    gatewayLinks: activeNodes.filter((node) => hops[node.id] === 1).length,
  };
}

/**
 * Simulated reachability for a single report.
 * Normal network, when available, is treated as an independent path.
 */
export function computeReachability(report, network, graph, nodes) {
  if (network.normal === 'available') {
    return {
      reachable: true,
      path: 'normal',
      nodeId: null,
      nodeLabel: null,
      hops: null,
      reason: 'Normal network marked available — direct path (simulated).',
      short: 'Normal network',
    };
  }

  if (network.mesh === 'off') {
    return {
      reachable: false,
      path: 'none',
      nodeId: null,
      nodeLabel: null,
      hops: null,
      reason: 'Normal network unavailable and relay mesh is off. Report is stored locally only.',
      short: 'No path',
    };
  }

  if (network.gateway === 'unavailable') {
    return {
      reachable: false,
      path: 'none',
      nodeId: null,
      nodeLabel: null,
      hops: null,
      reason: 'Relay mesh is on but the simulated gateway is unavailable, so no relay reaches the operations console.',
      short: 'Gateway down',
    };
  }

  let best = null;
  for (const node of nodes) {
    if (node.status !== 'active') continue;
    const d = distance(node, report);
    if (d > node.radius) continue;
    const hopCount = graph.hops[node.id];
    if (hopCount == null) continue;
    if (!best || d < best.distance || (d === best.distance && hopCount < best.hops)) {
      best = { node, distance: d, hops: hopCount };
    }
  }

  if (best) {
    return {
      reachable: true,
      path: 'relay',
      nodeId: best.node.id,
      nodeLabel: best.node.label,
      hops: best.hops,
      distance: Math.round(best.distance),
      reason: `Inside simulated coverage of ${best.node.label} (${Math.round(best.distance)} map units), ${best.hops} mesh ${best.hops === 1 ? 'hop' : 'hops'} from the gateway.`,
      short: `${best.node.label} · ${best.hops} hop${best.hops === 1 ? '' : 's'}`,
    };
  }

  // Explain the near-miss so the operator understands the gap.
  const nearest = nodes
    .map((node) => ({ node, d: distance(node, report) }))
    .sort((a, b) => a.d - b.d)[0];

  const reasons = [];
  if (nearest) {
    if (nearest.node.status !== 'active') {
      reasons.push(`nearest node ${nearest.node.label} is ${nearest.node.status}`);
    } else if (nearest.d > nearest.node.radius) {
      reasons.push(
        `nearest node ${nearest.node.label} is ${Math.round(nearest.d)} map units away, outside its ${nearest.node.radius}-unit simulated radius`,
      );
    }
    if (graph.hops[nearest.node.id] == null && nearest.node.status === 'active') {
      reasons.push(`${nearest.node.label} has no simulated mesh path to the gateway`);
    }
  }
  return {
    reachable: false,
    path: 'none',
    nodeId: null,
    nodeLabel: null,
    hops: null,
    reason: `No simulated relay path. ${reasons.length ? `Cause: ${reasons.join('; ')}.` : ''}`.trim(),
    short: 'Out of coverage',
  };
}

/* ------------------------------------------------------------------ */
/* Team recommendation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Recommend an available team with enough capacity, preferring the nearest.
 * Always returns a full audit of why each team was or was not eligible.
 */
export function recommendTeam(report, teams) {
  if (!report) return { team: null, candidate: null, rejected: [], reason: 'Select a report to see a recommendation.' };

  const evaluated = teams.map((team) => {
    const d = distance(team, report);
    let reject = null;
    if (team.status === 'en_route') reject = `already tasked to ${team.assignment ?? 'another report'}`;
    else if (team.status === 'unavailable') reject = 'marked unavailable';
    else if (team.capacity < report.people) reject = `capacity ${team.capacity} < ${report.people} people`;
    return { team, distance: Math.round(d), reject };
  });

  const eligible = evaluated
    .filter((item) => !item.reject)
    .sort((a, b) => a.distance - b.distance || b.team.capacity - a.team.capacity || a.team.id.localeCompare(b.team.id));

  const best = eligible[0] ?? null;

  if (!best) {
    const encumbered = evaluated.find((item) => item.team.status === 'en_route' && item.team.assignment === report.id);
    if (encumbered) {
      return {
        team: encumbered.team,
        candidate: encumbered,
        rejected: evaluated.filter((item) => item.team.id !== encumbered.team.id),
        eligible: [],
        reason: `${encumbered.team.name} is already en route to this report.`,
        alreadyAssigned: true,
      };
    }
    return {
      team: null,
      candidate: null,
      eligible: [],
      rejected: evaluated,
      reason:
        evaluated.length === 0
          ? 'No response teams exist in this scenario.'
          : 'No available team has the capacity for this many people. Available teams are listed below with the reason each was ruled out.',
    };
  }

  const capacitySlack = best.team.capacity - report.people;
  return {
    team: best.team,
    candidate: best,
    eligible,
    rejected: evaluated.filter((item) => item.reject),
    reason: `${best.team.name} is the nearest available team with sufficient capacity — ${best.distance} map units from the report, ${best.team.capacity} seats for ${report.people} ${report.people === 1 ? 'person' : 'people'} (${capacitySlack} spare)${eligible.length > 1 ? `, and closer than ${eligible.length - 1} other eligible ${eligible.length - 1 === 1 ? 'team' : 'teams'}` : ''}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Networking helpers                                                  */
/* ------------------------------------------------------------------ */

export function commsStatus(network) {
  if (network.normal === 'available') {
    return {
      label: 'Communications restored',
      code: 'NOMINAL',
      tone: 'ok',
      detail: 'Normal network is marked available in this simulation. Relay paths are still shown for reference.',
    };
  }
  if (network.mesh === 'on' && network.gateway === 'connected') {
    return {
      label: 'Degraded · relay only',
      code: 'RELAY ONLY',
      tone: 'warn',
      detail: 'Normal network is down. Simulated relay mesh is carrying reachable reports to the gateway.',
    };
  }
  if (network.mesh === 'on') {
    return {
      label: 'Relay mesh up · gateway down',
      code: 'PARTIAL',
      tone: 'warn',
      detail: 'Relay nodes are simulated as powered, but no gateway path exists, so reports stay local.',
    };
  }
  return {
    label: 'Communications blackout',
    code: 'BLACKOUT',
    tone: 'critical',
    detail: 'Normal network is unavailable and the simulated relay mesh is off. Reports cannot leave the field.',
  };
}
