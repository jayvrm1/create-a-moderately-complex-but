const SEV = [
  ['critical', '#ff5f6e', 'Critical'],
  ['high', '#f0a24a', 'High'],
  ['moderate', '#e8cf72', 'Moderate'],
  ['low', '#8dd6ef', 'Low'],
];

export default function MapLegend() {
  return (
    <div className="legend" aria-label="Map legend">
      <div className="legend-row">
        {SEV.map(([key, color, label]) => (
          <span className="legend-item" key={key}>
            <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
              {key === 'critical' && <path d="M5 0.6 9.4 8.8H0.6Z" fill={color} />}
              {key === 'high' && <rect x="1" y="1" width="8" height="8" fill={color} />}
              {key === 'moderate' && <circle cx="5" cy="5" r="4" fill={color} />}
              {key === 'low' && <path d="M5 0.8 9.2 5 5 9.2 0.8 5Z" fill={color} />}
            </svg>
            {label}
          </span>
        ))}
      </div>
      <div className="legend-row">
        <span className="legend-item">
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M6 1.2 10.2 3.6v4.8L6 10.8 1.8 8.4V3.6Z" fill="none" stroke="#5fe3ff" strokeWidth="1.1" />
          </svg>
          Relay drone
        </span>
        <span className="legend-item">
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M6 1.4 10.6 6 6 10.6 1.4 6Z" fill="none" stroke="#69e6b4" strokeWidth="1.1" />
          </svg>
          Rescue team
        </span>
        <span className="legend-item">
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M6 1.2 10.4 3.7v4.6L6 10.8 1.6 8.3V3.7Z" fill="none" stroke="#b79bff" strokeWidth="1.1" />
          </svg>
          Gateway
        </span>
      </div>
      <div className="legend-row legend-row--lines">
        <span className="legend-item">
          <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden="true">
            <circle cx="9" cy="4" r="3.2" fill="none" stroke="#5fe3ff" strokeWidth="1" strokeDasharray="1.6 1.8" strokeOpacity="0.85" />
          </svg>
          Coverage arc
        </span>
        <span className="legend-item">
          <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden="true">
            <line x1="0" y1="4" x2="18" y2="4" stroke="#5fe3ff" strokeWidth="1.1" strokeDasharray="3 2" />
          </svg>
          Relay link
        </span>
        <span className="legend-item">
          <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden="true">
            <line x1="0" y1="4" x2="18" y2="4" stroke="#4a91ad" strokeWidth="1.1" strokeDasharray="4 2" />
          </svg>
          Flood edge
        </span>
        <span className="legend-item">
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2 2l6 6M8 2 2 8" stroke="#8aa4b8" strokeWidth="1.2" />
          </svg>
          No link
        </span>
      </div>
    </div>
  );
}
