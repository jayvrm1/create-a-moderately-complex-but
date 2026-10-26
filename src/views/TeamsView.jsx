import { distance } from '../lib/simulation.js';
import { Panel, StatusTag, SeverityTag, EmptyState } from '../components/ui.jsx';

export default function TeamsView({ app, onSection }) {
  const eligibleIds = new Set((app.recommendation?.eligible ?? []).map((item) => item.team.id));
  const rejectedById = new Map(
    (app.recommendation?.rejected ?? []).map((item) => [item.team.id, item.reject]),
  );

  return (
    <>
      <div className="section-intro">
        <div>
          <span className="panel-kicker">RESOURCE POSTURE // SECTOR V-7</span>
          <h2 className="section-title">Response teams</h2>
          <p className="section-lede">
            Fictional teams with capacities and approximate schematic positions. The recommender only considers
            available teams whose capacity covers the selected report, then prefers the nearest. A human approves every
            dispatch.
          </p>
        </div>
        <div className="section-actions">
          <button type="button" className="btn btn--ghost" onClick={() => onSection('ops')}>
            ← Back to operations
          </button>
        </div>
      </div>

      {app.selected ? (
        <div className="selection-context">
          <span className="selection-context-label">ELIGIBILITY FOR SELECTED REPORT</span>
          <span className="selection-context-id">{app.selected.id}</span>
          <span className="selection-context-site">{app.selected.site}</span>
          <SeverityTag severity={app.selected.severity} compact />
          <span className="selection-context-people">{app.selected.people} people</span>
        </div>
      ) : (
        <div className="selection-context selection-context--empty">
          No report selected — eligibility is shown once you pick a report on the map or in the queue.
        </div>
      )}

      <div className="team-grid">
        {app.teams.map((team) => {
          const isEligible = eligibleIds.has(team.id);
          const rejected = rejectedById.get(team.id);
          const dist = app.selected ? Math.round(distance(team, app.selected)) : null;
          const isRecommended = app.recommendation?.team?.id === team.id && !app.recommendation.alreadyAssigned;
          return (
            <article
              key={team.id}
              className={`team-card${isRecommended ? ' team-card--recommended' : ''}${isEligible ? ' team-card--eligible' : ''}`}
            >
              <header className="team-card-head">
                <div>
                  <span className="team-card-id">{team.id}</span>
                  <h3 className="team-card-name">{team.name}</h3>
                  <p className="team-card-role">{team.role}</p>
                </div>
                <StatusTag status={team.status} />
              </header>

              <dl className="team-card-stats">
                <div>
                  <dt>Capacity</dt>
                  <dd>{team.capacity}</dd>
                </div>
                <div>
                  <dt>Distance to report</dt>
                  <dd>{dist != null ? `${dist} u` : '—'}</dd>
                </div>
                <div>
                  <dt>Assignment</dt>
                  <dd>{team.assignment ?? '—'}</dd>
                </div>
              </dl>

              <p className="team-card-note">{team.note}</p>

              <div className={`team-verdict verdict--${isRecommended ? 'ok' : isEligible ? 'ready' : 'blocked'}`}>
                {isRecommended
                  ? 'Recommended by the simulator — awaiting operator approval'
                  : isEligible
                    ? 'Eligible back-up for the selected report'
                    : app.selected
                      ? rejected ?? 'Not selected for this report'
                      : team.status === 'available'
                        ? 'Available — select a report to check capacity'
                        : team.status === 'en_route'
                          ? `En route to ${team.assignment}`
                          : 'Unavailable for tasking'}
              </div>

              {team.assignment && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    app.selectReport(team.assignment);
                    onSection('ops');
                  }}
                >
                  Show assigned report {team.assignment} →
                </button>
              )}
            </article>
          );
        })}
      </div>

      <Panel kicker="TASKING RULES // EXPLAINED" title="How a team is recommended">
        {app.selected ? (
          <ol className="rules-list">
            <li>
              <strong>Eligibility.</strong> Team must be marked available and have capacity of at least{' '}
              {app.selected.people} for {app.selected.id}.
            </li>
            <li>
              <strong>Nearest first.</strong> Among eligible teams, the smallest schematic distance to the report wins;
              capacity and team ID break ties deterministically.
            </li>
            <li>
              <strong>Human approval.</strong> Nothing is dispatched until the operator presses approve. The simulator
              cannot task a team by itself.
            </li>
            <li>
              <strong>Simulation limits.</strong> Distances are map units, routes and travel times are not modelled, and
              capacity is fictional.
            </li>
          </ol>
        ) : (
          <EmptyState title="Select a report to see the full rule trace" icon="dash">
            The recommender evaluates availability, capacity and distance in that order, then explains its choice in the
            operations view.
          </EmptyState>
        )}
      </Panel>
    </>
  );
}
