import { EXERCISE } from '../data/scenario.js';
import { formatClock } from '../lib/format.js';

export default function CommandHeader({ now, status, onReset, onNewReport, sectionLabel }) {
  return (
    <header className="command-header">
      <div className="header-main">
        <div className="header-eyebrow">
          <span className="header-section">{sectionLabel}</span>
          <span className="header-divider" aria-hidden="true" />
          <span>{EXERCISE.exerciseId} · COMMAND CONSOLE</span>
        </div>
        <h1 className="header-title">{EXERCISE.name}</h1>
        <p className="header-sub">
          <span>{EXERCISE.sector}</span>
          <span className="header-dot" aria-hidden="true" />
          <span>{EXERCISE.grid}</span>
        </p>
      </div>

      <div className="header-metrics">
        <div className="header-metric">
          <span className="header-metric-label">LOCAL TIME</span>
          <span className="header-metric-value header-clock" aria-label={`Local time ${formatClock(now)}`}>
            {formatClock(now)}
          </span>
        </div>
        <div className="header-metric">
          <span className="header-metric-label">INCIDENT STATUS</span>
          <span className={`header-status header-status--${status.tone}`}>
            <span className="pulse-dot" aria-hidden="true" />
            {status.code}
          </span>
        </div>
      </div>

      <div className="header-actions">
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
            <path d="M13 8a5 5 0 1 1-1.7-3.8M13 2v3.2H9.8" fill="none" strokeWidth="1.4" />
          </svg>
          Reset Scenario
        </button>
        <button type="button" className="btn btn--primary" onClick={onNewReport}>
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
            <path d="M8 2v12M2 8h12" fill="none" strokeWidth="1.6" />
          </svg>
          New Report
        </button>
      </div>

      <div className="header-sim-warning" role="note">
        <span className="header-sim-icon" aria-hidden="true">
          <svg viewBox="0 0 18 18" width="15" height="15">
            <path d="M9 1.6 17 16H1Z" fill="none" strokeWidth="1.3" />
            <path d="M9 6.6v4.6M9 13.2v.6" strokeWidth="1.5" />
          </svg>
        </span>
        <span>
          <strong>SIMULATION / NOT CONNECTED TO LIVE SYSTEMS.</strong> Fictional exercise data only — no phone,
          cellular, satellite, drone or emergency-service connection. Not a validated triage protocol.
        </span>
      </div>
    </header>
  );
}
