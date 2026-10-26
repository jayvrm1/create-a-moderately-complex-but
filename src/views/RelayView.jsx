import { distance } from '../lib/simulation.js';
import { Panel, ReachBadge, SeverityTag, StatusTag } from '../components/ui.jsx';
import NetworkControls from '../components/NetworkControls.jsx';

export default function RelayView({ app, onSection }) {
  return (
    <>
      <div className="section-intro">
        <div>
          <span className="panel-kicker">AERIAL RELAY // SOFTWARE SIMULATION</span>
          <h2 className="section-title">Relay network</h2>
          <p className="section-lede">
            A fictional mesh of {app.nodes.length} simulated aerial relay nodes and one gateway. Nothing here is a drone
            in flight and no aircraft is controlled. Coverage rings are geometric illustrations only — they are not
            radio propagation predictions and prove nothing about real coverage.
          </p>
        </div>
        <div className="section-actions">
          <button type="button" className="btn btn--ghost" onClick={() => onSection('ops')}>
            ← Back to operations
          </button>
        </div>
      </div>

      <div className="relay-grid">
        <div className="relay-controls">
          <NetworkControls
            network={app.network}
            setNetwork={app.setNetwork}
            note={app.networkNote}
            summary={app.summary}
          />
          <Panel kicker="UPLINK // SIMULATED" title="Gateway">
            <div className="gateway-card">
              <div className="gateway-card-head">
                <span className="gateway-card-id">{app.gateway.id}</span>
                <StatusTag status={app.network.gateway === 'connected' ? 'active' : 'offline'} />
              </div>
              <p className="gateway-card-label">{app.gateway.label} · {app.gateway.sublabel}</p>
              <dl className="gateway-card-stats">
                <div>
                  <dt>Nodes with direct path</dt>
                  <dd>{app.graph.gatewayLinks}</dd>
                </div>
                <div>
                  <dt>Nodes reachable in mesh</dt>
                  <dd>
                    {app.graph.relayedNodeCount}/{app.nodes.length}
                  </dd>
                </div>
                <div>
                  <dt>Gateway radius</dt>
                  <dd>{app.gateway.range} u</dd>
                </div>
              </dl>
              <p className="gateway-card-note">
                {app.network.gateway === 'connected'
                  ? 'The simulated gateway is accepting relay traffic. It is not a real satellite or cellular uplink.'
                  : 'Gateway marked unavailable: relayed reports have nowhere to terminate, so reachability collapses even with the mesh on.'}
              </p>
            </div>
          </Panel>
        </div>

        <Panel
          kicker="MESH NODES // POWER CONTROL"
          title="Relay nodes"
          aside={<span className="queue-total">{app.summary.activeNodes} powered</span>}
        >
          <div className="node-table">
            <div className="node-table-head" aria-hidden="true">
              <span>Node</span>
              <span>Status</span>
              <span>Radius</span>
              <span>Mesh path</span>
              <span>Covered reports</span>
              <span>Control</span>
            </div>
            {app.nodes.map((node) => {
              const hops = app.graph.hops[node.id];
              const covered = app.reports.filter(
                (report) => report.status === 'open' && distance(report, node) <= node.radius,
              ).length;
              return (
                <div className="node-row" key={node.id}>
                  <div className="node-cell node-cell--id">
                    <span className="node-id">{node.id}</span>
                    <span className="node-label">{node.label}</span>
                  </div>
                  <div className="node-cell">
                    <StatusTag status={node.status} />
                  </div>
                  <div className="node-cell node-cell--num">{node.radius} u</div>
                  <div className="node-cell node-cell--num">
                    {app.network.mesh === 'off'
                      ? 'mesh off'
                      : node.status !== 'active'
                        ? '—'
                        : hops
                          ? `${hops} hop${hops === 1 ? '' : 's'}`
                          : 'no path'}
                  </div>
                  <div className="node-cell node-cell--num">{covered}</div>
                  <div className="node-cell">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => app.setNodeStatus(node.id, node.status === 'active' ? 'standby' : 'active')}
                      aria-label={`${node.status === 'active' ? 'Place' : 'Restore'} ${node.label} ${
                        node.status === 'active' ? 'on standby' : 'as powered'
                      } (simulated)`}
                    >
                      {node.status === 'active' ? 'Take standby' : 'Restore node'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="node-foot">
            Powering a node down simulates losing an aerial relay. Coverage rings, mesh links and report reachability
            recalculate immediately and the change is written to the event log.
          </p>
        </Panel>
      </div>

      <Panel
        kicker="REACHABILITY AUDIT // ALL REPORTS"
        title="Simulated path per report"
        aside={<span className="queue-total">{app.summary.reachable}/{app.summary.open} reachable</span>}
      >
        <div className="audit-list">
          {app.reports.map((report) => (
            <button
              type="button"
              key={report.id}
              className={`audit-row${report.id === app.selectedId ? ' is-selected' : ''}`}
              onClick={() => {
                app.selectReport(report.id);
                onSection('ops');
              }}
            >
              <span className="audit-id">{report.id}</span>
              <span className="audit-site">{report.site}</span>
              <SeverityTag severity={report.severity} compact />
              <ReachBadge reachability={report.reachability} />
              <span className="audit-reason">{report.reachability.reason}</span>
              <span className="audit-arrow" aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>
        {app.network.normal === 'available' && (
          <p className="node-foot">
            Normal network is marked available, so all reports show a direct simulated path and relay paths are advisory
            only.
          </p>
        )}
      </Panel>
    </>
  );
}
