const TILES = [
  {
    key: 'open',
    label: 'Open reports',
    hint: 'Awaiting a dispatch decision',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </>
    ),
  },
  {
    key: 'critical',
    label: 'Critical reports',
    hint: 'Severity: critical',
    tone: 'critical',
    icon: (
      <>
        <path d="M12 3 22 20H2Z" />
        <path d="M12 9.5v5.2M12 17.4v.8" />
      </>
    ),
  },
  {
    key: 'reachable',
    label: 'Reports reachable',
    hint: 'Simulated path to the console',
    tone: 'accent',
    icon: (
      <>
        <circle cx="6" cy="18" r="2.4" />
        <circle cx="18" cy="6" r="2.4" />
        <path d="M7.6 16.2 16.4 7.8" />
        <path d="M3 8a6 6 0 0 1 4-4M21 16a6 6 0 0 1-4 4" strokeDasharray="2 2.4" />
      </>
    ),
  },
  {
    key: 'teams',
    label: 'Teams available',
    hint: 'Eligible for tasking',
    tone: 'ok',
    icon: (
      <>
        <path d="M12 3 19.5 7.5v9L12 21 4.5 16.5v-9Z" />
        <path d="M12 8.4 15.4 12 12 15.6 8.6 12Z" />
      </>
    ),
  },
  {
    key: 'nodes',
    label: 'Active relay nodes',
    hint: 'Simulated aerial relays',
    tone: 'violet',
    icon: (
      <>
        <path d="M12 3.5 19 7.6v8.2L12 20.5 5 15.8V7.6Z" />
        <circle cx="12" cy="12" r="2.2" />
        <path d="M12 3.5V9.8M12 14.2v6.3M5 7.6l4.7 3M14.3 13.4 19 16.4" />
      </>
    ),
  },
];

export default function Indicators({ summary }) {
  const values = {
    open: { value: summary.open, sub: `${summary.open - summary.critical} non-critical` },
    critical: {
      value: summary.critical,
      sub: summary.critical === 1 ? '1 needs immediate review' : 'Prioritise against capacity',
    },
    reachable: {
      value: `${summary.reachable}/${summary.open}`,
      customSub:
        summary.unreachableCritical > 0
          ? `${summary.unreachableCritical} critical report${summary.unreachableCritical === 1 ? '' : 's'} unreachable`
          : 'All open reports have a path',
    },
    teams: {
      value: `${summary.teamsAvailable}/${summary.teamsTotal}`,
      customSub: summary.teamsAvailable === 0 ? 'No team free for tasking' : 'Free for tasking',
    },
    nodes: {
      value: `${summary.activeNodes}/${summary.nodesTotal}`,
      sub: summary.relayedNodes > 0 ? `${summary.relayedNodes} with gateway path` : 'No gateway path',
    },
  };

  return (
    <section className="indicators" aria-label="Operational indicators">
      {TILES.map((tile) => {
        const item = values[tile.key];
        return (
          <article className={`indicator indicator--${tile.tone ?? 'neutral'}`} key={tile.key}>
            <div className="indicator-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">{tile.icon}</svg>
            </div>
            <div className="indicator-text">
              <span className="indicator-label">{tile.label}</span>
              <span className="indicator-value">{item.value}</span>
              <span className="indicator-sub">{item.customSub ?? item.sub}</span>
            </div>
            <span className="indicator-corner" aria-hidden="true" />
          </article>
        );
      })}
    </section>
  );
}
