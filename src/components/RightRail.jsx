import { useState } from 'react';
import DroneRoster from './DroneRoster.jsx';
import ReportDetail from './ReportDetail.jsx';
import Recommendation from './Recommendation.jsx';
import NetworkControls from './NetworkControls.jsx';
import ActivityLog from './ActivityLog.jsx';
import { Empty, Panel, ReachTag, SeverityTag, StatusTag } from './ui.jsx';
import { DRONE_STATUS_LABEL, TEAM_STATUS_LABEL } from '../lib/simulation.js';
import { formatAge } from '../lib/format.js';

function ReportsSection({ app }) {
  const [onlyOpen, setOnlyOpen] = useState(true);
  const rows = app.queue.filter(({ report }) => (onlyOpen ? report.status === 'open' : true));
  return (
    <>
      <Panel
        kicker="REPORT QUEUE"
        title="All reports"
        aside={
          <button
            type="button"
            className={`mini-toggle${onlyOpen ? ' is-on' : ''}`}
            aria-pressed={onlyOpen}
            onClick={() => setOnlyOpen((value) => !value)}
          >
            {onlyOpen ? 'OPEN ONLY' : 'INCL. ASSIGNED'}
          </button>
        }
        dense
      >
        <ul className="report-list">
          {rows.map(({ report, ranked }, index) => (
            <li key={report.id}>
              <button
                type="button"
                className={`report-row${report.id === app.selectedId ? ' is-selected' : ''}`}
                onClick={() => app.actions.selectReport(report.id)}
                aria-pressed={report.id === app.selectedId}
              >
                <span className="rr-rank">{report.status === 'assigned' ? 'ASG' : String(index + 1).padStart(2, '0')}</span>
                <SeverityTag severity={report.severity} compact />
                <span className="rr-main">
                  <span className="rr-id">{report.id}</span>
                  <span className="rr-site">{report.site}</span>
                </span>
                <span className="rr-fig">
                  {report.people}P · {formatAge(report.ageMinutes)}
                </span>
                <span className={`rr-score tone-${ranked.score >= 70 ? 'critical' : ranked.score >= 45 ? 'high' : 'moderate'}`}>
                  {ranked.score.toFixed(1)}
                </span>
                <span className={`rr-reach ${report.reachability.reachable ? 'is-ok' : 'is-down'}`} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </Panel>
      <ReportDetail
        report={app.selected}
        rank={app.reports.filter((r) => r.status === 'open').findIndex((r) => r.id === app.selectedId) + 1}
        total={app.summary.open}
        teams={app.teams}
        onClear={app.actions.clearSelection}
        compact
      />
      <Recommendation
        report={app.selected}
        recommendation={app.recommendation}
        teams={app.teams}
        onDispatch={app.actions.dispatch}
      />
    </>
  );
}

function TeamsSection({ app }) {
  const eligible = new Set((app.recommendation?.eligible ?? []).map((item) => item.team.id));
  const rejected = new Map((app.recommendation?.rejected ?? []).map((item) => [item.team.id, item.reject]));
  return (
    <Panel
      kicker="RESOURCE POSTURE"
      title="Response teams"
      aside={<span className="pnl-chip">{app.summary.teamsAvailable}/{app.summary.teamsTotal} FREE</span>}
      dense
    >
      {!app.selected && (
        <p className="rail-hint">Select a report to see capacity eligibility for each team.</p>
      )}
      <ul className="team-list">
        {app.teams.map((team) => {
          const recommended = app.recommendation?.team?.id === team.id && !app.recommendation.alreadyAssigned;
          const isEligible = eligible.has(team.id);
          const dist = app.selected
            ? Math.round(Math.hypot(team.x - app.selected.x, team.y - app.selected.y))
            : null;
          return (
            <li key={team.id} className={`team-item${recommended ? ' is-recommended' : ''}${isEligible ? ' is-eligible' : ''}`}>
              <div className="team-item-head">
                <span className="team-item-id">{team.id}</span>
                <StatusTag tone={team.status === 'available' ? 'ok' : team.status === 'en_route' ? 'warn' : 'muted'}>
                  {TEAM_STATUS_LABEL[team.status]}
                </StatusTag>
              </div>
              <p className="team-item-name">
                {team.name} <span className="team-item-role">{team.role}</span>
              </p>
              <p className="team-item-stats">
                CAP {team.capacity} · {dist != null ? `${dist} u TO REPORT` : 'NO REPORT SELECTED'}
                {team.assignment ? ` · ON ${team.assignment}` : ''}
              </p>
              <p className="team-item-verdict">
                {recommended
                  ? 'RECOMMENDED — awaiting operator approval'
                  : isEligible
                    ? 'Eligible back-up'
                    : app.selected
                      ? rejected.get(team.id) ?? 'Not eligible'
                      : team.status === 'en_route'
                        ? `En route to ${team.assignment}`
                        : team.status === 'unavailable'
                          ? 'Unavailable for tasking'
                          : 'Available — pick a report to check capacity'}
              </p>
              {team.assignment && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => app.actions.selectReport(team.assignment)}
                >
                  SHOW {team.assignment} →
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="rail-foot-note">
        Eligibility: available status and capacity ≥ the report's people count; the nearest eligible team is
        recommended. Distances are schematic map units, not travel times.
      </p>
    </Panel>
  );
}

function RelaySection({ app }) {
  return (
    <>
      <NetworkControls network={app.network} setNetwork={app.actions.setNetwork} summary={app.summary} />
      <Panel
        kicker="RELAY FLEET"
        title="Drone control"
        aside={<span className="pnl-chip">{app.graph.connectedCount} LINKED</span>}
        dense
      >
        <ul className="drone-list">
          {app.droneStates.map((drone) => (
            <li key={drone.id} className={`drone-item st-${drone.status}`}>
              <div className="drone-item-head">
                <span className="drone-item-id">
                  <span className={`roster-dot st-${drone.status}`} aria-hidden="true" />
                  {drone.callsign}
                </span>
                <StatusTag tone={drone.status === 'active' ? 'ok' : drone.status === 'standby' ? 'warn' : 'muted'}>
                  {DRONE_STATUS_LABEL[drone.status]}
                </StatusTag>
              </div>
              <dl className="drone-item-stats">
                <div>
                  <dt>TASK</dt>
                  <dd>{drone.status === 'active' ? drone.task : DRONE_STATUS_LABEL[drone.status]}</dd>
                </div>
                <div>
                  <dt>LINK</dt>
                  <dd>{drone.status === 'active' ? (drone.connected ? `LINKED · ${app.graph.hops[drone.id]} HOP` : 'NO GATEWAY PATH') : 'NOT RELAYING'}</dd>
                </div>
                <div>
                  <dt>BATTERY</dt>
                  <dd>
                    {drone.status === 'active' ? `${Math.round(drone.battery)}%${drone.charging ? ' ↑' : ''}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt>RANGE</dt>
                  <dd>{drone.range} u</dd>
                </div>
              </dl>
              <div className="drone-item-actions">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => app.actions.setDroneStatus(drone.id, drone.status === 'active' ? 'standby' : 'active')}
                  disabled={drone.status === 'offline'}
                >
                  {drone.status === 'active' ? 'TAKE OFF MESH' : drone.status === 'standby' ? 'RESTORE TO MESH' : 'OFFLINE — NO POWER'}
                </button>
                <span className="drone-item-route">{drone.routeName}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="rail-foot-note">
          Routes are fixed waypoint lists flown at a fixed simulated speed, so Reset replays the same picture. Offline
          and standby drones stay parked.
        </p>
      </Panel>
    </>
  );
}

function LogSection({ app }) {
  return (
    <Panel
      kicker="ACTIVITY"
      title="Event log"
      aside={<span className="pnl-chip">{app.events.length} ENTRIES</span>}
      dense
    >
      <ActivityLog events={app.events} withFilters />
    </Panel>
  );
}

function OpsSection({ app, onOpenLog }) {
  return (
    <>
      <ReportDetail
        report={app.selected}
        rank={app.reports.filter((r) => r.status === 'open').findIndex((r) => r.id === app.selectedId) + 1}
        total={app.summary.open}
        teams={app.teams}
        onClear={app.actions.clearSelection}
        compact
      />
      <Recommendation
        report={app.selected}
        recommendation={app.recommendation}
        teams={app.teams}
        onDispatch={app.actions.dispatch}
      />
      <Panel
        kicker="ACTIVITY"
        title="Recent events"
        aside={<span className="pnl-chip">{app.graph.connectedCount} RELAYS LINKED</span>}
        dense
      >
        <ActivityLog events={app.events} limit={6} onOpenLog={onOpenLog} />
      </Panel>
      <ReachabilityAudit app={app} />
    </>
  );
}

function ReachabilityAudit({ app }) {
  return (
    <Panel kicker="SIMULATED PATHS" title="Report reachability" dense>
      <ul className="audit">
        {app.reports.map((report) => (
          <li key={report.id}>
            <button
              type="button"
              className={`audit-row${report.id === app.selectedId ? ' is-selected' : ''}`}
              onClick={() => app.actions.selectReport(report.id)}
            >
              <span className="audit-id">{report.id}</span>
              <span className="audit-site">{report.site}</span>
              <ReachTag reachability={report.reachability} compact />
            </button>
          </li>
        ))}
      </ul>
      {!app.reports.length && <Empty title="No reports" />}
    </Panel>
  );
}

export default function RightRail({ section, app, onOpenLog, open, onToggle }) {
  return (
    <aside className={`rightrail${open ? ' is-open' : ''}`} aria-label="Operations inspector">
      <button
        type="button"
        className="rightrail-toggle"
        aria-expanded={open}
        aria-controls="inspector-body"
        onClick={onToggle}
      >
        <span>{open ? 'CLOSE INSPECTOR' : 'OPEN INSPECTOR'}</span>
        <span aria-hidden="true">{open ? '▾' : '▴'}</span>
      </button>
      <div className="rightrail-drones">
        <DroneRoster drones={app.droneStates} compact />
      </div>
      <div className="rightrail-scroll" id="inspector-body">
        {section === 'ops' && <OpsSection app={app} onOpenLog={onOpenLog} />}
        {section === 'reports' && <ReportsSection app={app} />}
        {section === 'teams' && <TeamsSection app={app} />}
        {section === 'relay' && <RelaySection app={app} />}
        {section === 'log' && <LogSection app={app} />}
      </div>
    </aside>
  );
}
