import { SEVERITIES, SEVERITY_META } from '../lib/simulation.js';

const SEV_COLOR = {
  critical: '#ff5f7a',
  high: '#ffa64d',
  moderate: '#ffd76a',
  low: '#7fd7ff',
};

export default function Legend() {
  return (
    <div className="legend" aria-label="Map legend">
      <div className="legend-group">
        <span className="legend-title">Severity</span>
        <ul className="legend-items">
          {SEVERITIES.map((severity) => (
            <li key={severity}>
              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                {severity === 'critical' && <path d="M8 1.6 15 14H1Z" fill={SEV_COLOR[severity]} />}
                {severity === 'high' && <rect x="2" y="2.6" width="12" height="11" fill={SEV_COLOR[severity]} />}
                {severity === 'moderate' && <circle cx="8" cy="8" r="6" fill={SEV_COLOR[severity]} />}
                {severity === 'low' && <rect x="4" y="4" width="8" height="8" rx="1.2" fill={SEV_COLOR[severity]} />}
              </svg>
              <span>{SEVERITY_META[severity].label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="legend-group">
        <span className="legend-title">Units</span>
        <ul className="legend-items">
          <li>
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M8 1.5 13.5 8 8 14.5 2.5 8Z" fill="none" stroke="#4be0a8" strokeWidth="1.5" />
            </svg>
            <span>Rescue team</span>
          </li>
          <li>
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M8 1.8 13.6 5v6L8 14.2 2.4 11V5Z" fill="none" stroke="#5fd4ff" strokeWidth="1.4" />
              <circle cx="8" cy="8" r="1.7" fill="#5fd4ff" />
            </svg>
            <span>Aerial relay node</span>
          </li>
          <li>
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M8 1.6 13.4 5v6L8 14.4 2.6 11V5Z" fill="none" stroke="#c9a8ff" strokeWidth="1.5" />
              <circle cx="8" cy="8" r="1.4" fill="#c9a8ff" />
            </svg>
            <span>Gateway</span>
          </li>
        </ul>
      </div>

      <div className="legend-group legend-group--wide">
        <span className="legend-title">Overlays</span>
        <ul className="legend-items">
          <li>
            <svg viewBox="0 0 22 14" width="20" height="13" aria-hidden="true">
              <circle cx="11" cy="7" r="6" fill="rgba(79,214,255,0.12)" stroke="#5fd4ff" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
            <span>Simulated coverage</span>
          </li>
          <li>
            <svg viewBox="0 0 22 14" width="20" height="13" aria-hidden="true">
              <line x1="0" y1="7" x2="22" y2="7" stroke="#6fe6ff" strokeWidth="1.4" strokeDasharray="4 3" />
            </svg>
            <span>Relay link</span>
          </li>
          <li>
            <svg viewBox="0 0 22 14" width="20" height="13" aria-hidden="true">
              <rect x="1" y="1" width="20" height="12" fill="rgba(15,69,98,0.5)" stroke="#4aa6c8" strokeWidth="1" strokeDasharray="3 2" />
            </svg>
            <span>Flood extent</span>
          </li>
          <li>
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <circle cx="8" cy="8" r="6.2" fill="none" stroke="#8fa6bb" strokeWidth="1.2" />
              <path d="M4.2 11.8 11.8 4.2" stroke="#8fa6bb" strokeWidth="1.2" />
            </svg>
            <span>No simulated path</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
