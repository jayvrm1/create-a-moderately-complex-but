import { useMemo, useState } from 'react';
import { Panel, SeverityTag } from '../components/ui.jsx';
import ReportQueue from '../components/ReportQueue.jsx';
import ReportDetail from '../components/ReportDetail.jsx';
import Recommendation from '../components/Recommendation.jsx';
import { SEVERITIES, SEVERITY_META } from '../lib/simulation.js';
import { formatAge, formatPct } from '../lib/format.js';

export default function ReportsView({ app, onOpenReportDialog, onSection }) {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');

  const counts = useMemo(() => {
    const map = { all: app.reports.length };
    for (const severity of SEVERITIES) {
      map[severity] = app.reports.filter((report) => report.severity === severity).length;
    }
    return map;
  }, [app.reports]);

  const filteredQueue = useMemo(
    () =>
      app.queue.filter(({ report }) => {
        const severityOk = severityFilter === 'all' || report.severity === severityFilter;
        const statusOk = statusFilter === 'all' || report.status === statusFilter;
        return severityOk && statusOk;
      }),
    [app.queue, severityFilter, statusFilter],
  );

  const openQueue = app.queue.filter((item) => item.report.status === 'open');
  const rank = app.selected ? openQueue.findIndex((item) => item.report.id === app.selected.id) + 1 : 0;

  return (
    <>
      <div className="section-intro">
        <div>
          <span className="panel-kicker">REPORT INTAKE // FICTIONAL DATA</span>
          <h2 className="section-title">Help reports</h2>
          <p className="section-lede">
            Every report is scored with the same deterministic demo formula, then listed with its simulated network
            reachability. Selecting a report here selects the same marker on the operations map.
          </p>
        </div>
        <div className="section-actions">
          <button type="button" className="btn btn--primary" onClick={onOpenReportDialog}>
            + New report
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => onSection('teams')}>
            Response teams →
          </button>
        </div>
      </div>

      <div className="reports-grid">
        <Panel
          kicker="QUEUE // FILTERABLE"
          title="All reports"
          className="reports-queue"
          aside={<span className="queue-total">{filteredQueue.length} shown</span>}
        >
          <div className="filter-bar">
            <div className="filter-group" role="group" aria-label="Filter by severity">
              <button
                type="button"
                className={`chip-filter${severityFilter === 'all' ? ' is-active' : ''}`}
                aria-pressed={severityFilter === 'all'}
                onClick={() => setSeverityFilter('all')}
              >
                All severity · {counts.all}
              </button>
              {SEVERITIES.map((severity) => (
                <button
                  key={severity}
                  type="button"
                  className={`chip-filter chip-filter--${severity}${severityFilter === severity ? ' is-active' : ''}`}
                  aria-pressed={severityFilter === severity}
                  onClick={() => setSeverityFilter(severity)}
                >
                  {SEVERITY_META[severity].label} · {counts[severity]}
                </button>
              ))}
            </div>
            <div className="filter-group" role="group" aria-label="Filter by dispatch status">
              <button
                type="button"
                className={`chip-filter${statusFilter === 'open' ? ' is-active' : ''}`}
                aria-pressed={statusFilter === 'open'}
                onClick={() => setStatusFilter('open')}
              >
                Awaiting dispatch
              </button>
              <button
                type="button"
                className={`chip-filter${statusFilter === 'all' ? ' is-active' : ''}`}
                aria-pressed={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
              >
                Include assigned
              </button>
            </div>
          </div>

          <ReportQueue
            queue={filteredQueue}
            selectedId={app.selectedId}
            onSelect={app.selectReport}
            onFileReport={onOpenReportDialog}
          />
        </Panel>

        <div className="reports-detail">
          <ReportDetail
            report={app.selected}
            rank={rank > 0 ? rank : null}
            total={openQueue.length}
            teams={app.teams}
            onClear={app.clearSelection}
            onInspectNetwork={() => onSection('relay')}
          />
          <Recommendation
            report={app.selected}
            recommendation={app.recommendation}
            onDispatch={app.dispatch}
            teams={app.teams}
          />
        </div>
      </div>

      <Panel kicker="AUDIT // DATA QUALITY" title="Report source and location spread">
        <div className="source-grid">
          {app.reports.map((report) => (
            <div className="source-card" key={report.id}>
              <div className="source-card-head">
                <span className="source-id">{report.id}</span>
                <SeverityTag severity={report.severity} compact />
              </div>
              <p className="source-site">{report.site}</p>
              <p className="source-meta">
                {report.source} · location confidence {formatPct(report.confidence)} · {formatAge(report.ageMinutes)} old
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
