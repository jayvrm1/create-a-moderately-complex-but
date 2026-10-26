import { SimulationStamp } from './ui.jsx';

const SECTIONS = [
  { id: 'ops', label: 'Live Operations', short: 'OPS', icon: 'radar' },
  { id: 'reports', label: 'Reports', short: 'RPT', icon: 'list' },
  { id: 'teams', label: 'Response Teams', short: 'TEAM', icon: 'crest' },
  { id: 'relay', label: 'Relay Network', short: 'NET', icon: 'mesh' },
  { id: 'log', label: 'Event Log', short: 'LOG', icon: 'log' },
];

function NavIcon({ name }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {name === 'radar' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4.4" />
          <path d="M12 12 19 6.4" />
          <circle cx="12" cy="12" r="1.2" className="nav-icon-fill" />
        </>
      )}
      {name === 'list' && (
        <>
          <path d="M4 6h16M4 12h16M4 18h10" />
          <circle cx="20" cy="18" r="1.4" className="nav-icon-fill" />
        </>
      )}
      {name === 'crest' && (
        <>
          <path d="M12 3 20 8v7.5L12 21 4 15.5V8Z" />
          <path d="M12 8.2 15.6 12 12 15.8 8.4 12Z" />
        </>
      )}
      {name === 'mesh' && (
        <>
          <path d="M12 3.6 19.2 8v8L12 20.4 4.8 16V8Z" />
          <path d="M12 3.6V12m0 0 7.2-4m-7.2 4L4.8 8" />
          <circle cx="12" cy="12" r="1.3" className="nav-icon-fill" />
        </>
      )}
      {name === 'log' && (
        <>
          <path d="M5 4h14v16H5z" />
          <path d="M8.5 9h7M8.5 13h7M8.5 17h4" />
        </>
      )}
    </svg>
  );
}

export default function NavigationRail({ active, onChange, summary }) {
  return (
    <nav className="rail" aria-label="Primary">
      <div className="rail-emblem">
        <svg viewBox="0 0 48 48" width="38" height="38" role="img" aria-label="RescueLink emblem">
          <circle cx="24" cy="24" r="20" className="emblem-orbit" />
          <circle cx="24" cy="24" r="15" className="emblem-ring" />
          <path d="M24 7 38.5 32H9.5Z" className="emblem-tri" />
          <path d="M24 19.5 30.4 30.5H17.6Z" className="emblem-core" />
          <circle cx="24" cy="24" r="2.2" className="emblem-dot" />
          <circle cx="43" cy="16" r="1.7" className="emblem-sat" />
        </svg>
        <span className="rail-emblem-text">
          <strong>RESCUELINK</strong>
          <span>// AEGIS</span>
        </span>
      </div>

      <ul className="rail-links">
        {SECTIONS.map((section, index) => (
          <li key={section.id}>
            <button
              type="button"
              className={`rail-link${active === section.id ? ' is-active' : ''}`}
              aria-current={active === section.id ? 'page' : undefined}
              onClick={() => onChange(section.id)}
            >
              <span className="rail-index">{String(index + 1).padStart(2, '0')}</span>
              <NavIcon name={section.icon} />
              <span className="rail-label">
                <span className="rail-label-full">{section.label}</span>
                <span className="rail-label-short">{section.short}</span>
              </span>
              <span className="rail-link-status" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className="rail-foot">
        <div className="rail-vitals">
          <span className="rail-vital-label">OPEN</span>
          <span className="rail-vital-value">{String(summary.open).padStart(2, '0')}</span>
          <span className="rail-vital-label">REACH</span>
          <span className="rail-vital-value rail-vital-value--accent">
            {summary.reachable}/{summary.open}
          </span>
        </div>
        <SimulationStamp variant="rail" />
        <span className="rail-build">AEGIS · BUILD 0.9 · EX-2261</span>
      </div>
    </nav>
  );
}
