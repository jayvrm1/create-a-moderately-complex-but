import { Empty, Panel, StatusTag } from './ui.jsx';
import { TEAM_STATUS_LABEL } from '../lib/simulation.js';

export default function Recommendation({ report, recommendation, teams, onDispatch }) {
  if (!report) {
    return (
      <Panel kicker="RECOMMENDED RESPONSE" title="Awaiting selection">
        <Empty title="No report selected">
          Select a report to see the nearest available team that can carry its people count. A human always approves
          the dispatch.
        </Empty>
      </Panel>
    );
  }

  const assignedTeam = report.assignedTeam ? teams.find((team) => team.id === report.assignedTeam) : null;
  const canDispatch = report.status === 'open' && Boolean(recommendation?.team) && !recommendation.alreadyAssigned;

  return (
    <Panel kicker="RECOMMENDED RESPONSE" title="Team tasking" aside={<span className="pnl-chip">FOR {report.id}</span>}>
      {report.status === 'assigned' ? (
        <div className="rec-assigned">
          <span className="rec-assigned-label">DISPATCH RECORDED</span>
          <p>
            {assignedTeam ? `${assignedTeam.name} (${assignedTeam.id})` : report.assignedTeam} is marked en route to{' '}
            {report.site}. Reset the scenario to replay the decision.
          </p>
          <button type="button" className="btn btn--dispatch" disabled>
            DISPATCH ALREADY APPROVED
          </button>
        </div>
      ) : recommendation?.team ? (
        <>
          <div className="rec-team">
            <div className="rec-team-head">
              <span className="rec-team-id">{recommendation.team.id}</span>
              <StatusTag tone="ok">{TEAM_STATUS_LABEL[recommendation.team.status]}</StatusTag>
            </div>
            <p className="rec-team-name">{recommendation.team.name}</p>
            <p className="rec-team-role">{recommendation.team.role}</p>
            <dl className="rec-team-stats">
              <div>
                <dt>CAPACITY</dt>
                <dd>{recommendation.team.capacity}</dd>
              </div>
              <div>
                <dt>DISTANCE</dt>
                <dd>{recommendation.candidate.distance} u</dd>
              </div>
              <div>
                <dt>PEOPLE</dt>
                <dd>{report.people}</dd>
              </div>
            </dl>
            <p className="rec-team-note">{recommendation.team.note}</p>
          </div>

          <p className="rec-reason">
            <span className="rec-label">WHY THIS TEAM</span>
            {recommendation.reason}
          </p>

          {recommendation.rejected.length > 0 && (
            <ul className="rec-rejected">
              {recommendation.rejected.map((item) => (
                <li key={item.team.id}>
                  <span className="rec-rejected-id">{item.team.id}</span>
                  <span>{item.team.name}</span>
                  <span className="rec-rejected-why">{item.reject}</span>
                </li>
              ))}
            </ul>
          )}

          <button type="button" className="btn btn--dispatch" onClick={onDispatch} disabled={!canDispatch}>
            APPROVE DISPATCH · {recommendation.team.id}
          </button>
        </>
      ) : (
        <>
          <div className="rec-blocked">
            <span className="rec-blocked-title">NO ELIGIBLE TEAM</span>
            <p>{recommendation?.reason}</p>
          </div>
          <ul className="rec-rejected">
            {recommendation?.rejected.map((item) => (
              <li key={item.team.id}>
                <span className="rec-rejected-id">{item.team.id}</span>
                <span>{item.team.name}</span>
                <span className="rec-rejected-why">{item.reject}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--dispatch" disabled>
            DISPATCH UNAVAILABLE
          </button>
        </>
      )}

      <p className="rec-foot">
        Dispatch requires an operator action. The simulator ranks and suggests only — it never tasks a team on its own.
        Distances are map units; no routes or travel times are modelled.
      </p>
    </Panel>
  );
}
