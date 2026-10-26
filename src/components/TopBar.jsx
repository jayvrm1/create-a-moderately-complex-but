import { EXERCISE } from '../data/scenario.js';
import { formatSimLabel } from '../state/useRescueLink.js';

export default function TopBar({ summary, status, simTime, running, onNewReport, onReset, sectionLabel }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="topbar-kicker">
          {sectionLabel} <span className="sep" aria-hidden="true">/</span> {EXERCISE.id}
        </span>
        <h1>
          {EXERCISE.mapTitle}
          <span className="topbar-sector">{EXERCISE.sector}</span>
        </h1>
      </div>

      <dl className="topbar-counts">
        <div>
          <dt>OPEN</dt>
          <dd>{String(summary.open).padStart(2, '0')}</dd>
        </div>
        <div>
          <dt>CRITICAL</dt>
          <dd className="tone-critical">{String(summary.critical).padStart(2, '0')}</dd>
        </div>
        <div>
          <dt>REACHABLE</dt>
          <dd className={summary.reachable === 0 ? 'tone-down' : 'tone-ok'}>
            {summary.reachable}<span className="count-total">/{summary.open}</span>
          </dd>
        </div>
        <div>
          <dt>TEAMS FREE</dt>
          <dd>{summary.teamsAvailable}<span className="count-total">/{summary.teamsTotal}</span></dd>
        </div>
        <div>
          <dt>RELAYS UP</dt>
          <dd>
            {summary.connectedDrones}<span className="count-total">/{summary.dronesTotal}</span>
          </dd>
        </div>
      </dl>

      <div className="topbar-right">
        <span className={`incident-status tone-${status.tone}`}>
          <span className="pulse-dot" aria-hidden="true" />
          {status.code}
        </span>
        <span className={`sim-clock${running ? ' is-running' : ''}`}>
          <span className="sim-clock-label">SIM</span> T+{formatSimLabel(simTime)}
        </span>
        <div className="topbar-actions">
          <button type="button" className="btn btn--quiet" onClick={onReset} title="Restore the starting scenario">
            RESET
          </button>
          <button type="button" className="btn" onClick={onNewReport}>
            + REPORT
          </button>
        </div>
      </div>
    </header>
  );
}
