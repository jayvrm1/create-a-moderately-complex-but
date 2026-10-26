import { Panel } from '../components/ui.jsx';
import EventLog from '../components/EventLog.jsx';

export default function LogView({ app, onSection }) {
  const counts = app.events.reduce(
    (acc, event) => {
      acc[event.kind] = (acc[event.kind] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <>
      <div className="section-intro">
        <div>
          <span className="panel-kicker">EXERCISE RECORD // {app.events.length} ENTRIES</span>
          <h2 className="section-title">Event log</h2>
          <p className="section-lede">
            A timestamped record of simulated network changes, report intake, reachability shifts and dispatch
            decisions. New events are prepended the moment they happen.
          </p>
        </div>
        <div className="section-actions">
          <button type="button" className="btn btn--ghost" onClick={() => onSection('ops')}>
            ← Back to operations
          </button>
        </div>
      </div>

      <div className="log-stat-row">
        {[
          ['Network', counts.network ?? 0],
          ['Reports', counts.report ?? 0],
          ['Dispatch', counts.dispatch ?? 0],
          ['Teams', counts.team ?? 0],
          ['System', counts.system ?? 0],
        ].map(([label, value]) => (
          <div className="log-stat" key={label}>
            <span className="log-stat-label">{label}</span>
            <span className="log-stat-value">{String(value).padStart(2, '0')}</span>
          </div>
        ))}
      </div>

      <Panel kicker="CHRONOLOGY // NEWEST FIRST" title="Full record">
        <EventLog events={app.events} withFilters live />
      </Panel>

      <p className="log-disclaimer">
        Exercise EX-2261 is fictional. Log entries are generated locally in this browser session and are not retained
        after a reload. This console is a UI prototype, not a dispatch or records system.
      </p>
    </>
  );
}
