import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_NETWORK,
  GATEWAY,
  RELAY_NODES,
  SEED_REPORTS,
  TEAMS,
} from '../data/scenario.js';
import {
  buildPriorityQueue,
  commsStatus,
  computeReachability,
  computeRelayGraph,
  recommendTeam,
  scoreReport,
} from '../lib/simulation.js';

const SEED_LOG = [
  { offsetMin: 58, kind: 'system', text: 'Exercise EX-2261 opened. Sector V-7 moved to active response.' },
  { offsetMin: 51, kind: 'network', text: 'Normal network reported unavailable across the Kaiva Basin.' },
  { offsetMin: 47, kind: 'report', text: 'RL-0402 received via field radio handoff — 3 people at Kaiva East Culvert.' },
  { offsetMin: 41, kind: 'report', text: 'RL-0419 received via relayed voice report — 14 people at Tessel Primary Shelter.' },
  { offsetMin: 33, kind: 'report', text: 'RL-0423 received via cached SMS relay — 21 people at Greyfall Transit Shed.' },
  { offsetMin: 21, kind: 'team', text: 'VOLT-02 tasked to RL-0402. Now marked en route.' },
  { offsetMin: 9, kind: 'network', text: 'Simulated relay mesh placed on standby. Gateway remains connected.' },
];

let eventSeq = 0;
const nextEventId = () => `EV-${(++eventSeq).toString().padStart(4, '0')}`;

function seedEvents(start) {
  return SEED_LOG.map((entry) => ({
    ...entry,
    id: nextEventId(),
    at: start - entry.offsetMin * 60000,
    tone: entry.kind === 'network' ? 'warn' : 'neutral',
  })).reverse();
}

function createState() {
  const start = Date.now();
  return {
    start,
    network: { ...DEFAULT_NETWORK },
    nodes: RELAY_NODES.map((node) => ({ ...node })),
    reports: SEED_REPORTS.map(({ offsetMin, ...report }) => ({
      ...report,
      receivedAt: start - offsetMin * 60000,
    })),
    teams: TEAMS.map((team) => ({ ...team })),
    events: seedEvents(start),
    selectedId: 'RL-0423',
    networkNote: {
      tone: 'warn',
      title: 'Scenario loaded — communications blackout',
      text: 'Normal network unavailable, relay mesh off. The gateway is powered but has nothing to relay. Reports are held locally until a simulated path exists.',
    },
    reportSeq: 425,
  };
}

function countReachable(reports, network, graph, nodes) {
  return reports.filter(
    (report) => report.status === 'open' && computeReachability(report, network, graph, nodes).reachable,
  ).length;
}

export function useRescueLink() {
  const [state, setState] = useState(createState);
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const graph = useMemo(
    () => computeRelayGraph(state.network, state.nodes, GATEWAY),
    [state.network, state.nodes],
  );

  const reports = useMemo(
    () =>
      state.reports.map((report) => ({
        ...report,
        ageMinutes: Math.max(0, (now - report.receivedAt) / 60000),
        reachability: computeReachability(report, state.network, graph, state.nodes),
        ranked: scoreReport(report, now),
      })),
    [state.reports, state.network, graph, state.nodes, now],
  );

  const selected = useMemo(
    () => reports.find((report) => report.id === state.selectedId) ?? null,
    [reports, state.selectedId],
  );

  const queue = useMemo(() => buildPriorityQueue(reports, now), [reports, now]);

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
      activeNodes: state.nodes.filter((node) => node.status === 'active').length,
      nodesTotal: state.nodes.length,
      relayedNodes: graph.relayedNodeCount,
    };
  }, [reports, state.teams, state.nodes, graph]);

  const status = useMemo(() => commsStatus(state.network), [state.network]);

  const pushEvent = useCallback((entry, list = stateRef.current.events) => {
    return [
      { id: nextEventId(), at: Date.now(), tone: 'neutral', ...entry },
      ...list,
    ];
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
        const nextNetwork = { ...prev.network, [key]: value };
        const nextGraph = computeRelayGraph(nextNetwork, prev.nodes, GATEWAY);
        const before = countReachable(prev.reports, prev.network, computeRelayGraph(prev.network, prev.nodes, GATEWAY), prev.nodes);
        const after = countReachable(prev.reports, nextNetwork, nextGraph, prev.nodes);
        const statusNext = commsStatus(nextNetwork);

        const labels = {
          normal: ['normal network', { available: 'marked available', unavailable: 'marked unavailable' }],
          mesh: ['simulated relay mesh', { on: 'engaged', off: 'switched off' }],
          gateway: ['simulated gateway', { connected: 'connected', unavailable: 'unavailable' }],
        };
        const label = labels[key][0];
        const verb = labels[key][1][value];

        let text;
        if (key === 'normal') {
          text =
            value === 'available'
              ? `Normal network ${verb}. All ${prev.reports.filter((r) => r.status === 'open').length} open reports now have a direct simulated path; relay coverage is shown for reference only.`
              : `Normal network ${verb}. Reachability now depends on the simulated relay mesh — ${after} of ${prev.reports.filter((r) => r.status === 'open').length} open reports reachable.`;
        } else if (key === 'mesh') {
          text =
            value === 'on'
              ? `Relay mesh ${verb}. ${nextGraph.relayedNodeCount} powered ${nextGraph.relayedNodeCount === 1 ? 'node has' : 'nodes have'} a gateway path. Reachable open reports: ${before} → ${after}.`
              : `Relay mesh ${verb}. Coverage rings go dark and reachability drops from ${before} to ${after} open reports.`;
        } else if (value === 'connected') {
          text = `Gateway ${verb}. Relay traffic can terminate again — reachable open reports: ${before} → ${after}.`;
        } else {
          text = `Gateway ${verb}. Relay nodes stay powered but have no destination, so reachability drops from ${before} to ${after} open reports.`;
        }

        const tone = statusNext.tone === 'ok' ? 'ok' : statusNext.tone === 'critical' ? 'critical' : 'warn';

        return {
          ...prev,
          network: nextNetwork,
          networkNote: { title: `Relay network · ${label} ${verb}`, text, tone },
          events: pushEvent(
            {
              kind: 'network',
              tone,
              text: `Network control — ${label} ${verb}. Reachable open reports: ${before} → ${after}.`,
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

      const reports = prev.reports.map((item) =>
        item.id === report.id
          ? { ...item, status: 'assigned', assignedTeam: rec.team.id, assignedAt: Date.now() }
          : item,
      );
      const teams = prev.teams.map((team) =>
        team.id === rec.team.id ? { ...team, status: 'en_route', assignment: report.id } : team,
      );

      return {
        ...prev,
        reports,
        teams,
        networkNote: {
          tone: 'ok',
          title: `Dispatch approved — ${rec.team.id} → ${report.id}`,
          text: `${rec.team.name} is en route to ${report.site} with capacity for ${report.people} people. Dispatch was approved by the operator; the simulation never assigns teams on its own.`,
        },
        events: pushEvent(
          {
            kind: 'dispatch',
            tone: 'ok',
            text: `DISPATCH — ${rec.team.id} ${rec.team.name} tasked to ${report.id} at ${report.site} (${report.people} people, ${report.severity}). Operator approval recorded.`,
          },
          prev.events,
        ),
      };
    });
  }, [pushEvent]);

  const fileReport = useCallback(
    (payload) => {
      const id = `RL-0${stateRef.current.reportSeq}`;
      setState((prev) => {
        const report = {
          id,
          severity: payload.severity,
          people: payload.people,
          site: payload.site.label,
          x: payload.site.x,
          y: payload.site.y,
          confidence: payload.confidence,
          source: payload.source,
          note: payload.note,
          status: 'open',
          receivedAt: Date.now(),
        };
        return {
          ...prev,
          reports: [...prev.reports, report],
          reportSeq: prev.reportSeq + 1,
          selectedId: id,
          networkNote: {
            tone: 'warn',
            title: `New report filed — ${id}`,
            text: `${payload.severity.toUpperCase()} report for ${payload.people} at ${payload.site.label}. It is now scored against the open queue and reachability is being simulated.`,
          },
          events: pushEvent(
            {
              kind: 'report',
              tone: 'warn',
              text: `Report ${id} filed manually — ${payload.severity}, ${payload.people} people, ${payload.site.label}, source: ${payload.source}, location confidence ${Math.round(payload.confidence * 100)}%.`,
            },
            prev.events,
          ),
        };
      });
      return id;
    },
    [pushEvent],
  );


  const setNodeStatus = useCallback(
    (id, nextStatus) => {
      setState((prev) => {
        const node = prev.nodes.find((item) => item.id === id);
        if (!node || node.status === nextStatus) return prev;
        const nodes = prev.nodes.map((item) =>
          item.id === id ? { ...item, status: nextStatus } : item,
        );
        const nextGraph = computeRelayGraph(prev.network, nodes, GATEWAY);
        const before = countReachable(prev.reports, prev.network, computeRelayGraph(prev.network, prev.nodes, GATEWAY), prev.nodes);
        const after = countReachable(prev.reports, prev.network, nextGraph, nodes);
        return {
          ...prev,
          nodes,
          networkNote: {
            tone: nextStatus === 'active' ? 'ok' : 'warn',
            title: `${node.label} · ${nextStatus}`,
            text: `Node status changed to ${nextStatus}. Powered nodes with a simulated gateway path: ${nextGraph.relayedNodeCount}/${nodes.length}. Reachable open reports: ${before} → ${after}.`,
          },
          events: pushEvent(
            {
              kind: 'network',
              tone: nextStatus === 'active' ? 'ok' : 'warn',
              text: `Relay node ${node.id} ${node.label} set to ${nextStatus}. Reachable open reports: ${before} → ${after}.`,
            },
            prev.events,
          ),
        };
      });
    },
    [pushEvent],
  );

  const reset = useCallback(() => {
    const fresh = createState();
    setState({
      ...fresh,
      events: [
        {
          id: nextEventId(),
          at: Date.now(),
          kind: 'system',
          tone: 'neutral',
          text: 'SCENARIO RESET — exercise restored to the starting blackout state.',
        },
        ...fresh.events,
      ],
      networkNote: {
        title: 'Scenario reset',
        text: 'Starting picture restored: normal network unavailable, relay mesh off, gateway connected, all seeded reports and teams back to their initial state.',
        tone: 'warn',
      },
    });
    setNow(Date.now());
  }, []);

  return {
    ...state,
    now,
    graph,
    reports,
    selected,
    queue,
    recommendation,
    summary,
    status,
    nodes: state.nodes,
    gateway: GATEWAY,
    selectReport,
    clearSelection,
    setNetwork,
    dispatch,
    fileReport,
    setNodeStatus,
    reset,
  };
}
