import { Panel } from './ui.jsx';

function Toggle({ label, hint, options, value, onChange, name }) {
  return (
    <div className="net-row">
      <div className="net-row-head">
        <span className="net-label">{label}</span>
        <span className="net-current">{options.find((option) => option.value === value)?.sub}</span>
      </div>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              className={`segmented-btn${active ? ' is-active' : ''} tone-${option.tone}`}
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              name={name}
            >
              <span className="segmented-dot" aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="net-hint">{hint}</p>
    </div>
  );
}

export default function NetworkControls({ network, setNetwork, note, summary }) {
  return (
    <Panel
      kicker="NETWORK CONTROLS // SIMULATED"
      title="Relay network state"
      className="panel--network"
      aside={<span className={`net-count tone-${summary.unreachableCritical ? 'critical' : 'ok'}`}>{summary.reachable}/{summary.open} reachable</span>}
    >
      <div className="net-controls">
        <Toggle
          name="normal-network"
          label="Normal network"
          value={network.normal}
          onChange={(value) => setNetwork('normal', value)}
          options={[
            { value: 'available', label: 'Available', sub: 'Nominal path', tone: 'ok' },
            { value: 'unavailable', label: 'Unavailable', sub: 'Outage simulated', tone: 'critical' },
          ]}
          hint="Fictional outage switch for the baseline carrier network."
        />
        <Toggle
          name="relay-mesh"
          label="Simulated relay mesh"
          value={network.mesh}
          onChange={(value) => setNetwork('mesh', value)}
          options={[
            { value: 'on', label: 'On', sub: 'Mesh engaged', tone: 'accent' },
            { value: 'off', label: 'Off', sub: 'Mesh inactive', tone: 'muted' },
          ]}
          hint="Enables modelled coverage rings for the five fictional aerial relay nodes."
        />
        <Toggle
          name="gateway"
          label="Simulated gateway"
          value={network.gateway}
          onChange={(value) => setNetwork('gateway', value)}
          options={[
            { value: 'connected', label: 'Connected', sub: 'Uplink terminating', tone: 'ok' },
            { value: 'unavailable', label: 'Unavailable', sub: 'Uplink lost', tone: 'critical' },
          ]}
          hint="Without a connected gateway, relayed reports cannot terminate."
        />
      </div>

      <div className={`net-note net-note--${note.tone ?? 'warn'}`} role="status" aria-live="polite">
        <span className="net-note-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <circle cx="8" cy="8" r="6.4" fill="none" strokeWidth="1.2" />
            <path d="M8 4.6v4.2M8 11v.6" strokeWidth="1.5" />
          </svg>
        </span>
        <div>
          <p className="net-note-title">{note.title}</p>
          <p className="net-note-text">{note.text}</p>
        </div>
      </div>
    </Panel>
  );
}
