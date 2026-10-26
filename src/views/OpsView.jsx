import Indicators from '../components/Indicators.jsx';
import MapView from '../components/MapView.jsx';
import Legend from '../components/Legend.jsx';
import NetworkControls from '../components/NetworkControls.jsx';
import ReportDetail from '../components/ReportDetail.jsx';
import ReportQueue from '../components/ReportQueue.jsx';
import Recommendation from '../components/Recommendation.jsx';
import EventLog from '../components/EventLog.jsx';
import { Panel } from '../components/ui.jsx';

export default function OpsView({ app, onOpenReportDialog, onSection }) {
  const openQueue = app.queue.filter((item) => item.report.status === 'open');
  const rank = app.selected ? openQueue.findIndex((item) => item.report.id === app.selected.id) + 1 : 0;

  return (
    <>
      <Indicators summary={app.summary} />

      <div className="ops-grid">
        <section className="panel ops-map" aria-labelledby="map-title">
          <header className="panel-head">
            <div className="panel-head-text">
              <span className="panel-kicker">SECTOR MAP // SCHEMATIC RENDER</span>
              <h2 className="panel-title" id="map-title">
                Response area · Kaiva Basin
              </h2>
            </div>
            <div className="panel-aside">
              <span className="map-count">{app.reports.filter((item) => item.status === 'open').length} reports plotted</span>
              <span className="map-count map-count--teams">{app.teams.length} teams</span>
            </div>
          </header>
          <div className="panel-body panel-body--map">
            <MapView
              reports={app.reports}
              teams={app.teams}
              nodes={app.nodes}
              gateway={app.gateway}
              network={app.network}
              graph={app.graph}
              selectedId={app.selectedId}
              onSelect={app.selectReport}
              onClear={app.clearSelection}
            />
            <Legend />
          </div>
        </section>

        <div className="ops-side">
          <NetworkControls
            network={app.network}
            setNetwork={app.setNetwork}
            note={app.networkNote}
            summary={app.summary}
          />

          <Panel
            kicker="AUDIT TRAIL // LIVE"
            title="Event log"
            className="panel--log"
            aside={<span className="log-count">{app.events.length} entries</span>}
          >
            <EventLog events={app.events} limit={7} live />
            <button type="button" className="link-btn log-open" onClick={() => onSection('log')}>
              Open full event log →
            </button>
          </Panel>
        </div>

        <Panel
          kicker="TRIAGE // DEMO SCORE"
          title="Priority queue"
          className="ops-queue"
          aside={<span className="queue-total">{app.summary.open} awaiting dispatch</span>}
        >
          <ReportQueue
            queue={app.queue}
            selectedId={app.selectedId}
            onSelect={app.selectReport}
            onFileReport={onOpenReportDialog}
            compact
          />
        </Panel>

        <div className="ops-detail">
          <ReportDetail
            report={app.selected}
            rank={rank > 0 ? rank : null}
            total={openQueue.length}
            teams={app.teams}
            onClear={app.clearSelection}
            onInspectNetwork={() => onSection('relay')}
          />
        </div>

        <div className="ops-rec">
          <Recommendation
            report={app.selected}
            recommendation={app.recommendation}
            onDispatch={app.dispatch}
            teams={app.teams}
          />
        </div>
      </div>
    </>
  );
}
