import { useEffect, useRef, useState } from 'react';
import NavigationRail from './components/NavigationRail.jsx';
import CommandHeader from './components/CommandHeader.jsx';
import NewReportDialog from './components/NewReportDialog.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import OpsView from './views/OpsView.jsx';
import ReportsView from './views/ReportsView.jsx';
import TeamsView from './views/TeamsView.jsx';
import RelayView from './views/RelayView.jsx';
import LogView from './views/LogView.jsx';
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
  const [resetOpen, setResetOpen] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    mainRef.current?.scrollTo?.({ top: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [section]);

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to console content
      </a>

      <NavigationRail active={section} onChange={setSection} summary={app.summary} />

      <div className="app-main">
        <CommandHeader
          now={app.now}
          status={app.status}
          sectionLabel={SECTION_LABEL[section]}
          onReset={() => setResetOpen(true)}
          onNewReport={() => setDialogOpen(true)}
        />

        <main id="main-content" className="app-content" ref={mainRef} tabIndex={-1}>
          {section === 'ops' && (
            <OpsView app={app} onOpenReportDialog={() => setDialogOpen(true)} onSection={setSection} />
          )}
          {section === 'reports' && (
            <ReportsView app={app} onOpenReportDialog={() => setDialogOpen(true)} onSection={setSection} />
          )}
          {section === 'teams' && <TeamsView app={app} onSection={setSection} />}
          {section === 'relay' && <RelayView app={app} onSection={setSection} />}
          {section === 'log' && <LogView app={app} onSection={setSection} />}
        </main>

        <footer className="app-footer">
          <span>RESCUELINK // AEGIS · EX-2261 · fictional exercise console</span>
          <span>
            Software simulation only — no phone, cellular, satellite, drone, or emergency-service connectivity. Not a
            validated triage protocol.
          </span>
        </footer>
      </div>

      <ConfirmDialog
        open={resetOpen}
        kicker="SCENARIO CONTROL"
        title="Reset this exercise?"
        body="The console returns to the starting blackout picture: seeded reports and teams restored, relay mesh off, gateway connected, assigned reports reopened, and your filed reports removed. The reset itself is added to the event log."
        confirmLabel="Reset scenario"
        onConfirm={() => {
          app.reset();
          setResetOpen(false);
        }}
        onClose={() => setResetOpen(false)}
      />

      <NewReportDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={(payload) => app.fileReport(payload)}
      />

      <div className="sr-only" role="status" aria-live="polite">
        {app.status.label}. {app.summary.reachable} of {app.summary.open} open reports reachable in the simulation.
      </div>
    </div>
  );
}
