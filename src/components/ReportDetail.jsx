import { ConfidenceBar, Empty, Panel, ReachTag, ScoreMeter, SeverityTag, StatusTag } from './ui.jsx';
import { formatAge, formatDateTime, formatPct } from '../lib/format.js';
import { SEVERITY_META, urgencyBand } from '../lib/simulation.js';

export default function ReportDetail({ report, rank, total, teams, onClear, compact = false }) {
  if (!report) {
    return (
      <Panel kicker="SELECTED REPORT" title="No report selected">
        <Empty title="Nothing selected">
          Pick a report symbol on the map or a row in the priority queue to inspect details, simulated reachability and
          the priority explanation.
        </Empty>
      </Panel>
    );
  }

  const band = urgencyBand(report.ranked.score);
  const assignedTeam = teams.find((team) => team.id === report.assignedTeam);
  const contributors = [...report.ranked.parts].sort((a, b) => b.value - a.value);

  return (
    <Panel
      kicker="SELECTED REPORT"
      title={`${report.id} · ${report.site}`}
      aside={rank ? <span className="pnl-chip">QUEUE #{rank}/{total}</span> : <span className="pnl-chip">ASSIGNED</span>}
      dense={compact}
    >
      <div className="detail-tags">
        <SeverityTag severity={report.severity} />
        <StatusTag tone={report.status === 'open' ? 'warn' : 'ok'}>
          {report.status === 'open' ? 'AWAITING DISPATCH' : 'ASSIGNED'}
        </StatusTag>
        <ReachTag reachability={report.reachability} />
      </div>

      <dl className="detail-grid">
        <div>
          <dt>People</dt>
          <dd>{report.people}</dd>
        </div>
        <div>
          <dt>Waiting</dt>
          <dd>{formatAge(report.ageMinutes)}</dd>
        </div>
        <div>
          <dt>Received</dt>
          <dd>{formatDateTime(report.receivedAt)}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{report.source}</dd>
        </div>
        <div className="detail-grid-wide">
          <dt>Location confidence</dt>
          <dd>
            <ConfidenceBar value={report.confidence} />
            <span className="detail-note-text">
              {formatPct(report.confidence)} — reference only in this demo score
            </span>
          </dd>
        </div>
        <div className="detail-grid-wide">
          <dt>Simulated reachability</dt>
          <dd className="detail-reach">{report.reachability.reason}</dd>
        </div>
      </dl>

      <div className={`priority tone-${band.tone}`}>
        <div className="priority-head">
          <span className={`priority-band tone-${band.tone}`}>{band.label}</span>
          <ScoreMeter score={report.ranked.score} />
        </div>
        <p className="priority-why">
          <span className="priority-label">WHY THIS PRIORITY</span>
          {SEVERITY_META[report.severity].label} severity, {report.people} {report.people === 1 ? 'person' : 'people'} and{' '}
          {formatAge(report.ageMinutes)} waiting. Largest contributors:{' '}
          {contributors
            .slice(0, 2)
            .map((part) => `${part.label.toLowerCase()} (+${part.value.toFixed(1)})`)
            .join(', ')}
          .
        </p>
        <dl className="priority-parts">
          {report.ranked.parts.map((part) => (
            <div key={part.key}>
              <dt>{part.label}</dt>
              <dd>
                <span className="parts-detail">{part.detail}</span>
                <span className="parts-value">+{part.value.toFixed(1)}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="priority-disclaimer">
          Demo score: severity + people + waiting time, capped at 100. Not a validated emergency triage protocol.
        </p>
      </div>

      <p className="detail-field-note">
        <span>FIELD NOTE</span>
        {report.note}
      </p>

      {report.status === 'assigned' && (
        <p className="detail-assigned">
          Assigned to <strong>{assignedTeam ? `${assignedTeam.name} (${assignedTeam.id})` : report.assignedTeam}</strong>.
          Team marked en route.
        </p>
      )}

      <button type="button" className="btn btn--quiet btn--sm" onClick={onClear}>
        CLEAR SELECTION
      </button>
    </Panel>
  );
}
