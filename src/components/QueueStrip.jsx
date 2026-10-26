import { SeverityGlyph } from './ui.jsx';
import { formatAge } from '../lib/format.js';
import { urgencyBand } from '../lib/simulation.js';

export default function QueueStrip({ queue, selectedId, onSelect }) {
  return (
    <section className="queue" aria-label="Priority queue">
      <header className="queue-head">
        <h2>PRIORITY QUEUE</h2>
        <span className="queue-note">
          severity + people + waiting time · demo score, not a validated triage protocol
        </span>
      </header>
      <div className="queue-scroll">
        <ol className="queue-list">
          {queue.map(({ report, ranked }, index) => {
            const band = urgencyBand(ranked.score);
            const selected = report.id === selectedId;
            return (
              <li key={report.id}>
                <button
                  type="button"
                  className={`queue-card${selected ? ' is-selected' : ''}${report.status === 'assigned' ? ' is-assigned' : ''}`}
                  onClick={() => onSelect(report.id)}
                  aria-pressed={selected}
                  aria-label={`${report.id} at ${report.site}, ${report.severity} severity, ${report.people} people, waiting ${formatAge(report.ageMinutes)}, demo urgency ${ranked.score.toFixed(1)}, ${report.status === 'assigned' ? 'assigned' : 'awaiting dispatch'}, ${report.reachability.reachable ? 'reachable' : 'unreachable'} in the simulated network.`}
                >
                  <span className="qc-rank">{report.status === 'assigned' ? 'ASG' : String(index + 1).padStart(2, '0')}</span>
                  <span className="qc-main">
                    <span className="qc-id">
                      <SeverityGlyph severity={report.severity} size={8} />
                      {report.id}
                      <span
                        className={`qc-reach ${report.reachability.reachable ? 'is-ok' : 'is-down'}`}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="qc-site">{report.site}</span>
                  </span>
                  <span className="qc-figures">
                    <span className="qc-people">{report.people}P</span>
                    <span className="qc-age">{formatAge(report.ageMinutes)}</span>
                    <span className={`qc-score tone-${band.tone}`}>{ranked.score.toFixed(1)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
