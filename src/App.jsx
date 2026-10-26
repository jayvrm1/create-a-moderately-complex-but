import { useEffect, useRef, useState } from 'react';
import NavigationRail from './components/NavigationRail.jsx';
import TopBar from './components/TopBar.jsx';
import MapView from './components/MapView.jsx';
import MapLegend from './components/MapLegend.jsx';
import QueueStrip from './components/QueueStrip.jsx';
import TransportBar from './components/TransportBar.jsx';
import RightRail from './components/RightRail.jsx';
import NewReportDialog from './components/NewReportDialog.jsx';
import { useRescueLink } from './state/useRescueLink.js';

const SECTION_LABEL = {
  ops: 'LIVE OPERATIONS',
  reports: 'REPORTS',
  teams: 'RESPONSE TEAMS',
  relay: 'RELAY NETWORK',
  log: 'EVENT LOG',
};

export default function App() {
  const app = useRescueLink();
  const [section, setSection] = useState('ops');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const railRef = useRef(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reducedMotion && app.running) app.actions.pause();
  }, [reducedMotion, app.running, app.actions]);

  const droneStates = app.droneStates.map((drone) => ({
    ...drone,
    connected: app.graph.hops[drone.id] != null,
  }));

  const selectOnMap = (id) => {
    app.actions.selectReport(id);
    setInspectorOpen(true);
    if (window.matchMedia('(max-width: 1080px)').matches) {
      requestAnimationFrame(() => {
        document.querySelector('.rightrail')?.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    }
  };

  return (
    <div className="app">
      <a className="skip-link" href="#map-stage">
        Skip to response map
      </a>

      <NavigationRail active={section} onChange={setSection} queueCount={app.summary.open} />

      <div className="console">
        <TopBar
          summary={app.summary}
          status={app.status}
          simTime={app.simTime}
          running={app.running}
          sectionLabel={SECTION_LABEL[section]}
          onNewReport={() => setDialogOpen(true)}
          onReset={app.actions.reset}
        />

        <div className="stage" id="map-stage">
          <div className={`map-wrap${inspectorOpen ? ' is-inspecting' : ''}`}>
            <MapView
              reports={app.reports}
              teams={app.teams}
              droneStates={droneStates}
              gateway={app.gateway}
              network={app.network}
              graph={app.graph}
              selectedId={app.selectedId}
              onSelect={selectOnMap}
              onClear={app.actions.clearSelection}
              reducedMotion={reducedMotion}
            />
            <MapLegend />
          </div>

          <RightRail
            section={section}
            app={{ ...app, droneStates, actions: { ...app.actions, selectReport: selectOnMap } }}
            onOpenLog={() => setSection('log')}
            open={inspectorOpen}
            onToggle={() => setInspectorOpen((value) => !value)}
          />
        </div>

        <QueueStrip
          queue={app.queue}
          selectedId={app.selectedId}
          onSelect={selectOnMap}
        />

        <TransportBar
          running={app.running}
          paused={app.started && !app.running}
          simTime={app.simTime}
          speed={app.speed}
          reducedMotion={reducedMotion}
          note={app.note}
          onStart={app.actions.start}
          onPause={app.actions.pause}
          onStep={() => app.actions.step(60)}
          onReset={app.actions.reset}
          onSpeed={app.actions.setSpeed}
          drones={app.droneStates}
        />
      </div>

      <NewReportDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={(payload) => app.actions.fileReport(payload)}
      />

      <div className="sr-only" role="status" aria-live="polite">
        {app.status.label}. {app.summary.reachable} of {app.summary.open} open reports reachable;{' '}
        {app.graph.connectedCount} relay drones linked to the simulated gateway.
      </div>
    </div>
  );
}
