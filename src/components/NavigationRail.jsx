const SECTIONS = [
  { id: 'ops', label: 'Live Operations', short: 'OPS', icon: 'target' },
  { id: 'reports', label: 'Reports', short: 'RPT', icon: 'list' },
  { id: 'teams', label: 'Response Teams', short: 'TEAM', icon: 'crest' },
  { id: 'relay', label: 'Relay Network', short: 'RELAY', icon: 'mesh' },
  { id: 'log', label: 'Event Log', short: 'LOG', icon: 'log' },
];

function Icon({ name }) {
  return (
    <svg className="rail-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      {name === 'target' && (
        <>
          <circle cx="10" cy="10" r="7.4" />
          <circle cx="10" cy="10" r="3.2" />
          <path d="M10 10 16 4.4" />
          <circle cx="10" cy="10" r="0.9" className="rail-icon-fill" />
        </>
      )}
      {name === 'list' && (
        <>
          <path d="M3 5h14M3 10h14M3 15h9" />
          <circle cx="16.6" cy="15" r="1.2" className="rail-icon-fill" />
        </>
      )}
      {name === 'crest' && (
        <>
          <path d="M10 2.4 17 6.6v6.8L10 17.6 3 13.4V6.6Z" />
          <path d="M10 6.6 13.4 10 10 13.4 6.6 10Z" />
        </>
      )}
      {name === 'mesh' && (
        <>
          <path d="M10 2.6 16.4 6.3v7.4L10 17.4 3.6 13.7V6.3Z" />
          <path d="M10 2.6v7.4m0 0 6.4-3.7M10 10 3.6 6.3" />
          <circle cx="10" cy="10" r="1.1" className="rail-icon-fill" />
        </>
      )}
      {name === 'log' && (
        <>
          <path d="M4 3h12v14H4z" />
          <path d="M7 7h6M7 10.4h6M7 13.8h3.6" />
        </>
      )}
    </svg>
  );
}

export default function NavigationRail({ active, onChange, queueCount }) {
  return (
    <nav className="rail" aria-label="Console sections">
      <div className="rail-mark" title="RescueLink // Aegis">
        <svg viewBox="0 0 32 32" width="26" height="26" role="img" aria-label="RescueLink emblem">
          <circle cx="16" cy="16" r="13.4" className="mark-orbit" />
          <path d="M16 5 26.4 23H5.6Z" className="mark-tri" />
          <path d="M16 13.2 20.2 21h-8.4Z" className="mark-core" />
          <circle cx="16" cy="16" r="1.5" className="mark-dot" />
        </svg>
        <span className="rail-wordmark">RESCUELINK</span>
      </div>

      <ul className="rail-list">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              className={`rail-btn${active === section.id ? ' is-active' : ''}`}
              aria-current={active === section.id ? 'page' : undefined}
              onClick={() => onChange(section.id)}
              title={section.label}
            >
              <Icon name={section.icon} />
              <span className="rail-btn-label">{section.short}</span>
              <span className="rail-btn-name">{section.label}</span>
              {section.id === 'reports' && queueCount > 0 && (
                <span className="rail-badge" aria-label={`${queueCount} open reports`}>
                  {queueCount}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="rail-foot">
        <span className="rail-foot-mark" aria-hidden="true">EX-2261</span>
        <span className="rail-foot-sim">SIM</span>
      </div>
    </nav>
  );
}
