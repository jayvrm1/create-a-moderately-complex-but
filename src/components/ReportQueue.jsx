import { EmptyState, SeverityTag, StatusTag } from './ui.jsx';
import { formatAge, formatPeople } from '../lib/format.js';
import { urgencyBand } from '../lib/simulation.js';

export default function ReportQueue({ queue, selectedId, onSelect, onFileReport, compact = false, title = 'Priority queue' }) {
  const openCount = queue.filter((item) => item.report.status === 'open').length;

  return (
    <div className={`queue${compact ? ' queue--compact' : ''}`}>
      <div className="queue-scroll">
        <div className="queue-head" aria-hidden="true">
          <span>#</span>
          <span>Report / location</span>
          <span>Severity</span>
          <span>People</span>
          <span>Age</span>
          <span>Urgency</span>
          <span>Status</span>
        </div>
        {queue.length === 0 ? (
          <EmptyState title="No reports in this exercise" icon="dash">
            File a fictional help report to populate the queue.
          </EmptyState>
        ) : (
          <ul className="queue-list">
            {queue.map((item, index) => {
              const { report, ranked } = item;
              const band = urgencyBand(ranked.score);
              const selected = report.id === selectedId;
              return (
                <li key={report.id}>
                  <button
                    type="button"
                    className={`queue-row${selected ? ' is-selected' : ''}${report.status === 'assigned' ? ' is-assigned' : ''}`}
                    aria-pressed={selected}
                    onClick={() => onSelect(report.id)}
                    aria-label={`${report.id} at ${report.site}, ${report.severity} severity, ${formatPeople(
                      report.people,
                    )}, ${formatAge(report.ageMinutes)} old, demo urgency ${ranked.score.toFixed(1)} of 100, ${
                      report.status === 'assigned' ? 'assigned' : 'awaiting dispatch'
                    }, ${report.reachability.reachable ? 'reachable' : 'not reachable'} in the simulated network.`}
                  >
                    <span className={`queue-rank${report.status === 'assigned' ? ' queue-rank--assigned' : ''}`}>
                      {report.status === 'assigned' ? 'ASG' : String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="queue-main">
                      <span className="queue-id">
                        {report.id}
                        <span className={`queue-reach-dot ${report.reachability.reachable ? 'is-ok' : 'is-down'}`} aria-hidden="true" />
                      </span>
                      <span className="queue-site">{report.site}</span>
                    </span>
                    <span className="queue-sev">
                      <SeverityTag severity={report.severity} compact />
                    </span>
                    <span className="queue-people">{report.people}</span>
                    <span className="queue-age">{formatAge(report.ageMinutes)}</span>
                    <span className="queue-urgency">
                      <span className={`queue-score tone-${band.tone}`}>{ranked.score.toFixed(1)}</span>
                      <span className="queue-track" aria-hidden="true">
                        <span className={`queue-fill tone-${band.tone}`} style={{ width: `${Math.min(100, ranked.score)}%` }} />
                      </span>
                    </span>
                    <span className="queue-status">
                      <StatusTag status={report.status} label={report.status === 'open' ? 'Open' : 'Assigned'} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="queue-foot">
        <p>
          Ranked by demo score — severity, people, age, low location confidence. Not a validated triage protocol.
        </p>
        <div className="queue-foot-actions">
          <span className="queue-count">{openCount} open</span>
          <button type="button" className="link-btn" onClick={onFileReport}>
            + File fictional report
          </button>
        </div>
      </div>
    </div>
  );
}
