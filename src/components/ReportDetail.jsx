import {
  AgeValue,
  ConfidenceMeter,
  EmptyState,
  Panel,
  ReachBadge,
  ScoreBreakdown,
  SeverityTag,
  StatusTag,
  UrgencyMeter,
} from './ui.jsx';
import { formatAge, formatDateTime, formatPeople, formatPct } from '../lib/format.js';
import { SEVERITY_META, urgencyBand } from '../lib/simulation.js';

export default function ReportDetail({ report, rank, total, onClear, onInspectNetwork, teams }) {
  if (!report) {
    return (
      <Panel kicker="SELECTED REPORT // DETAIL" title="Report detail">
        <EmptyState title="No report selected" icon="dash">
          Choose a marker on the schematic map or a row in the priority queue to inspect its details, reachability and
          priority reasoning.
        </EmptyState>
      </Panel>
    );
  }

  const band = urgencyBand(report.ranked.score);
  const assignedTeam = teams.find((team) => team.id === report.assignedTeam);
  const topFactors = [...report.ranked.parts].sort((a, b) => b.value - a.value).slice(0, 2);

  return (
    <Panel
      kicker="SELECTED REPORT // DETAIL"
      title="Report detail"
      aside={<span className="detail-rank">{rank ? `QUEUE #${rank} OF ${total}` : 'ASSIGNED'}</span>}
    >
      <div className="detail-head">
        <div>
          <p className="detail-id">{report.id}</p>
          <p className="detail-site">{report.site}</p>
        </div>
        <div className="detail-head-tags">
          <SeverityTag severity={report.severity} />
          <StatusTag status={report.status} />
        </div>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>People</dt>
          <dd>{formatPeople(report.people)}</dd>
        </div>
        <div>
          <dt>Received</dt>
          <dd>
            {formatDateTime(report.receivedAt)}
            <span className="detail-sub"> · {formatAge(report.ageMinutes)} ago</span>
          </dd>
        </div>
        <div>
          <dt>Report source</dt>
          <dd>{report.source}</dd>
        </div>
        <div>
          <dt>Location confidence</dt>
          <dd>
            <ConfidenceMeter value={report.confidence} />
          </dd>
        </div>
        <div className="detail-grid-wide">
          <dt>Simulated reachability</dt>
          <dd>
            <ReachBadge reachability={report.reachability} />
            <p className="detail-reach-reason">{report.reachability.reason}</p>
            <button type="button" className="link-btn" onClick={onInspectNetwork}>
              Inspect relay network →
            </button>
          </dd>
        </div>
      </dl>

      <div className={`detail-priority tone-${band.tone}`}>
        <div className="detail-priority-head">
          <span className={`priority-chip tone-${band.tone}`}>{band.label}</span>
          <UrgencyMeter score={report.ranked.score} showBand={false} />
        </div>
        <p className="detail-priority-text">
          <span className="detail-priority-label">WHY PRIORITISED</span>
          {SEVERITY_META[report.severity].label} severity ({report.people} {report.people === 1 ? 'person' : 'people'}),{' '}
          {formatAge(report.ageMinutes)} old
          {report.confidence < 0.6
            ? `, and location confidence of only ${formatPct(report.confidence)} pushing it up for verification.`
            : `, with reliable location confidence of ${formatPct(report.confidence)}.`}{' '}
          Strongest contributors: {topFactors.map((part) => part.label.toLowerCase()).join(' and ')}.
        </p>
      </div>

      <details className="detail-breakdown">
        <summary>Show demo score breakdown</summary>
        <ScoreBreakdown ranked={report.ranked} />
        <p className="detail-disclaimer">
          Demo priority score only — not a validated emergency triage protocol. It combines severity, people count,
          report age and low location confidence.
        </p>
      </details>

      <div className="detail-note">
        <span className="detail-note-label">FIELD NOTE</span>
        <p>{report.note}</p>
      </div>

      {report.status === 'assigned' && (
        <p className="detail-assigned">
          Assigned to <strong>{assignedTeam ? `${assignedTeam.name} (${assignedTeam.id})` : report.assignedTeam}</strong>
          {report.assignedAt ? ` at ${formatDateTime(report.assignedAt)}` : ''}. Team is marked en route.
        </p>
      )}

      <div className="detail-actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClear}>
          Clear selection
        </button>
        <span className="detail-age-inline">
          Age <AgeValue minutes={report.ageMinutes} /> · updates live
        </span>
      </div>
    </Panel>
  );
}
