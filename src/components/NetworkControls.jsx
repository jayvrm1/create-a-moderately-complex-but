import { Panel } from './ui.jsx';

function Seg({ label, hint, options, value, onChange, name }) {
  return (
    <div className="seg-row">
      <div className="seg-head">
        <span className="seg-label">{label}</span>
        <span className="seg-current">{options.find((option) => option.value === value)?.note}</span>
      </div>
      <div className="seg" role="group" aria-label={label}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              name={name}
              className={`seg-btn${active ? ` is-active tone-${option.tone}` : ''}`}
              aria-pressed={active}
              onClick={() => onChange(option.value)}
            >
              <span className="seg-dot" aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="seg-hint">{hint}</p>}
    </div>
  );
}

export default function NetworkControls({ network, setNetwork, summary }) {
  return (
    <Panel
      kicker="NETWORK CONTROLS"
      title="Link simulation"
      aside={<span className={`pnl-chip ${summary.reachable ? 'is-ok' : 'is-warn'}`}>{summary.reachable}/{summary.open} REACHABLE</span>}
    >
      <Seg
        name="normal-network"
        label="Normal network"
        value={network.normal}
        onChange={(value) => setNetwork('normal', value)}
        options={[
          { value: 'available', label: 'AVAILABLE', tone: 'ok', note: 'DIRECT PATH' },
          { value: 'unavailable', label: 'UNAVAILABLE', tone: 'critical', note: 'OUTAGE' },
        ]}
      />
      <Seg
        name="relay-mesh"
        label="Relay mesh"
        value={network.mesh}
        onChange={(value) => setNetwork('mesh', value)}
        options={[
          { value: 'on', label: 'ON', tone: 'accent', note: 'MESH ACTIVE' },
          { value: 'off', label: 'OFF', tone: 'muted', note: 'MESH DARK' },
        ]}
      />
      <Seg
        name="gateway"
        label="Gateway"
        value={network.gateway}
        onChange={(value) => setNetwork('gateway', value)}
        options={[
          { value: 'connected', label: 'CONNECTED', tone: 'ok', note: 'UPLINK UP' },
          { value: 'unavailable', label: 'UNAVAILABLE', tone: 'critical', note: 'UPLINK DOWN' },
        ]}
      />
      <p className="seg-foot">
        Switching any control recalculates drone links and report reachability immediately and writes an entry to the
        activity log.
      </p>
    </Panel>
  );
}
