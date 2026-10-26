import { useState } from 'react';
import { EmptyState, Panel, SeverityTag, StatusTag } from './ui.jsx';
import { TEAM_STATUS_LABEL } from '../lib/simulation.js';

function TeamCard({ team, distance, highlight = false, note }) {
  return (
    <div className={`rec-team${highlight ? ' rec-team--primary' : ''}`}>
      <div className="rec-team-head">
        <span className="rec-team-id">{team.id}</span>
        <StatusTag status={team.status} />
      </div>
      <p className="rec-team-name">{team.name}</p>
      <p className="rec-team-role">{team.role}</p>
      <dl className="rec-team-stats">
        <div>
          <dt>Capacity</dt>
          <dd>{team.capacity}</dd>
        </div>
        <div>
          <dt>Map distance</dt>
          <dd>{distance} u</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{TEAM_STATUS_LABEL[team.status]}</dd>
        </div>
      </dl>
      {note && <p className="rec-team-note">{note}</p>}
    </div>
  );
}

export default function Recommendation({ report, recommendation, onDispatch, teams }) {
  const [showAll, setShowAll] = useState(false);

  if (!report) {
    return (
      <Panel kicker="RESPONSE / HUMAN IN THE LOOP" title="Recommended response">
        <EmptyState title="No report selected" icon="dash">
          Select a report marker on the map or a row in the priority queue. The simulator will suggest an available
          team with sufficient capacity — a human always approves the dispatch.
        </EmptyState>
      </Panel>
    );
  }

  const assignedTeam = report.assignedTeam ? teams.find((team) => team.id === report.assignedTeam) : null;
  const canDispatch = Boolean(recommendation?.team) && !recommendation.alreadyAssigned && report.status === 'open';

  return (
    <Panel
      kicker="RESPONSE / HUMAN IN THE LOOP"
      title="Recommended response"
      aside={<span className="rec-ref">FOR {report.id}</span>}
    >
      <div className="rec-target">
        <div className="rec-target-main">
          <SeverityTag severity={report.severity} />
          <span className="rec-target-site">{report.site}</span>
        </div>
        <span className="rec-target-meta">
          {report.people} {report.people === 1 ? 'person' : 'people'} · {report.reachability.reachable ? 'reachable' : 'no path'}
        </span>
      </div>

      {!report.reachability.reachable && report.status === 'open' && (
        <p className="rec-caution">
          <span className="rec-caution-label">NO SIMULATED PATH</span>
          This report has no simulated route to the console yet. Dispatching is still recorded locally, but in a real
          outage you would confirm details by another means — here it is exercise data only.
        </p>
      )}

      {report.status === 'assigned' ? (
        <>
          <div className="rec-assigned">
            <span className="rec-assigned-label">DISPATCH RECORDED</span>
            <p>
              {assignedTeam ? `${assignedTeam.name} (${assignedTeam.id})` : report.assignedTeam} is marked en route to
              this report.
            </p>
            <p className="rec-assigned-note">
              This report no longer appears as awaiting dispatch. Reset the scenario to replay the decision.
            </p>
          </div>
          <button type="button" className="btn btn--dispatch" disabled>
            Dispatch already approved
          </button>
        </>
      ) : recommendation?.team ? (
        <>
          <TeamCard
            team={recommendation.team}
            distance={recommendation.candidate.distance}
            highlight
            note={recommendation.team.note}
          />
          <p className="rec-reason">
            <span className="rec-reason-label">WHY THIS TEAM</span>
            {recommendation.reason}
          </p>

          {recommendation.eligible.length > 1 && (
            <div className="rec-alts">
              <button
                type="button"
                className="link-btn"
                aria-expanded={showAll}
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll ? 'Hide' : 'Show'} {recommendation.eligible.length - 1} other eligible{' '}
                {recommendation.eligible.length - 1 === 1 ? 'team' : 'teams'}
              </button>
              {showAll && (
                <ul className="rec-alt-list">
                  {recommendation.eligible.slice(1).map((item) => (
                    <li key={item.team.id}>
                      <span className="rec-alt-id">{item.team.id}</span>
                      <span>{item.team.name}</span>
                      <span className="rec-alt-dist">{item.distance} u · cap {item.team.capacity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn btn--dispatch"
            onClick={onDispatch}
            disabled={!canDispatch}
            aria-describedby="dispatch-note"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M2 8h10M9 4l4 4-4 4" fill="none" strokeWidth="1.6" />
            </svg>
            Approve dispatch · {recommendation.team.id}
          </button>
        </>
      ) : (
        <>
          <div className="rec-blocked" role="status">
            <p className="rec-blocked-title">No eligible team</p>
            <p>{recommendation?.reason}</p>
          </div>
          <ul className="rec-reject-list">
            {recommendation?.rejected.map((item) => (
              <li key={item.team.id}>
                <span className="rec-alt-id">{item.team.id}</span>
                <span>{item.team.name}</span>
                <span className="rec-alt-dist">{item.reject}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--dispatch" disabled>
            Dispatch unavailable
          </button>
        </>
      )}

      <p className="rec-foot" id="dispatch-note">
        Dispatch is always an operator decision. This simulator ranks and suggests only; it never assigns a team on its
        own. Availability and travel estimates are fictional.
      </p>
    </Panel>
  );
}
