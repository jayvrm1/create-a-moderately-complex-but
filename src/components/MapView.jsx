import { memo, useMemo } from 'react';
import { FLOOD_BOUNDARY, RIVER_PATH } from '../data/scenario.js';
import { SEVERITY_META } from '../lib/simulation.js';
import { formatPct } from '../lib/format.js';

const CFG = {
  critical: { color: '#ff5f7a', shape: 'diamond' },
  high: { color: '#ffa64d', shape: 'triangle' },
  moderate: { color: '#ffd76a', shape: 'circle' },
  low: { color: '#7fd7ff', shape: 'square' },
};

const TEAM_COLORS = {
  available: '#4be0a8',
  en_route: '#ffc46b',
  unavailable: '#7d8c9f',
};

function boundaryPath(points) {
  return `M${points.map(([x, y]) => `${x},${y}`).join(' L')} Z`;
}

function smoothPath(points) {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
}

function severitySymbol(severity, x, y, selected) {
  const { color, shape } = CFG[severity];
  const scale = selected ? 1.12 : 1;
  const common = {
    fill: color,
    stroke: '#050a12',
    strokeWidth: 1.6,
    filter: 'url(#markerGlow)',
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className="report-symbol">
      <circle r="13" fill="rgba(5,10,18,0.72)" stroke={color} strokeWidth="1" strokeOpacity="0.55" />
      {shape === 'diamond' && <rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" {...common} />}
      {shape === 'triangle' && <path d="M0 -8.5 8 6.5H-8Z" {...common} />}
      {shape === 'circle' && <circle r="6.6" {...common} />}
      {shape === 'square' && <rect x="-6" y="-6" width="12" height="12" rx="1.4" {...common} />}
      {severity === 'critical' && (
        <>
          <rect x="-1" y="-4.4" width="2" height="5.4" fill="#1a0610" />
          <circle cy="3.2" r="1.1" fill="#1a0610" />
        </>
      )}
    </g>
  );
}

function ReportMarker({ report, selected, dimmed, onSelect }) {
  const meta = SEVERITY_META[report.severity];
  const reachable = report.reachability.reachable;
  const chipW = 150;
  const chipH = 40;
  // keep the readout inside the schematic: flip it left near the right edge
  const flip = report.x + 16 + chipW > 992;
  const chipX = flip ? report.x - 16 - chipW : report.x + 16;
  const chipY = report.y - 20;
  const label = `${report.id}, ${meta.label} severity, ${report.people} people at ${report.site}. ${
    reachable ? 'Reachable' : 'Not reachable'
  } in the simulated network.${selected ? ' Selected.' : ''}`;

  return (
    <g
      className={`map-report sev-${meta.tone}${selected ? ' is-selected' : ''}${reachable ? '' : ' is-unreachable'}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(report.id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(report.id);
        }
      }}
      opacity={dimmed ? 0.42 : 1}
    >
      <title>
        {report.id} · {meta.label} · {report.site} · {report.people} people · {reachable ? 'reachable' : 'no simulated path'}
      </title>
      {selected && (
        <>
          <circle cx={report.x} cy={report.y} r="22" className="selection-reticle" />
          <circle cx={report.x} cy={report.y} r="29" className="selection-reticle selection-reticle--outer" />
        </>
      )}
      {(report.severity === 'critical' || selected) && (
        <circle cx={report.x} cy={report.y} r="13" fill="none" stroke={CFG[report.severity].color} className="report-pulse" />
      )}
      {reachable && report.reachability.path === 'relay' && (
        <line
          x1={report.x}
          y1={report.y}
          x2={report.reachability.nodeX ?? report.x}
          y2={report.reachability.nodeY ?? report.y}
          className="report-link"
        />
      )}
      <line
        x1={report.x + (flip ? -12 : 12)}
        y1={report.y}
        x2={flip ? chipX + chipW : chipX}
        y2={chipY + chipH / 2}
        className="chip-leader"
      />
      {severitySymbol(report.severity, report.x, report.y, selected)}
      <g className="report-chip">
        <rect x={chipX} y={chipY} width={chipW} height={chipH} rx="4" />
        <text x={chipX + 13} y={chipY + 17} className="chip-id">
          {report.id}
        </text>
        <text x={chipX + 13} y={chipY + 31} className={`chip-sev sev-${meta.tone}`}>
          {meta.label.toUpperCase()} · {report.people}P
        </text>
        <g transform={`translate(${chipX + chipW - 48} ${chipY + 13})`}>
          {reachable ? (
            <>
              <circle r="4.4" className="chip-link-dot" />
              <circle r="1.7" fill="#040a12" />
            </>
          ) : (
            <>
              <circle r="4.4" className="chip-nolink-dot" />
              <path d="M-1.9 -1.9 1.9 1.9M1.9 -1.9-1.9 1.9" stroke="#040a12" strokeWidth="1.1" />
            </>
          )}
        </g>
        <text x={chipX + chipW - 10} y={chipY + 31} className="chip-conf" textAnchor="end">
          {formatPct(report.confidence)}
        </text>
        <text x={chipX + chipW - 10} y={chipY + 16} className="chip-conf chip-conf--label" textAnchor="end">
          CONF
        </text>
      </g>
    </g>
  );
}

function TeamMarker({ team, report }) {
  const color = TEAM_COLORS[team.status] ?? TEAM_COLORS.unavailable;
  const statusLabel =
    team.status === 'en_route' ? `En route to ${team.assignment}` : team.status === 'available' ? 'Available' : 'Unavailable';
  const actionable = report && team.status === 'available' && team.capacity >= report.people;
  return (
    <g className={`map-team status-${team.status}${actionable ? ' is-candidate' : ''}`}>
      {actionable && <circle cx={team.x} cy={team.y} r="17" className="team-candidate-ring" />}
      <g transform={`translate(${team.x} ${team.y})`}>
        <path d="M0 -11 9 0 0 11-9 0Z" fill="rgba(6,12,20,0.9)" stroke={color} strokeWidth="1.6" />
        <circle r="3.1" fill={color} />
      </g>
      <g className="team-chip" textAnchor="end">
        <text x={team.x - 18} y={team.y - 2} className="team-id">
          {team.id}
        </text>
        <text x={team.x - 18} y={team.y + 11} className="team-status" style={{ fill: color }}>
          {statusLabel.toUpperCase()} · {team.capacity} CAP
        </text>
      </g>
    </g>
  );
}

function MapView({ reports, teams, nodes, gateway, network, graph, selectedId, onSelect, onClear }) {
  const meshOn = network.mesh === 'on';
  const selected = reports.find((report) => report.id === selectedId) ?? null;

  const enriched = useMemo(() => {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    return reports.map((report) => {
      const node = report.reachability.nodeId ? nodeById.get(report.reachability.nodeId) : null;
      return {
        ...report,
        reachability: { ...report.reachability, nodeX: node?.x, nodeY: node?.y },
      };
    });
  }, [reports, nodes]);

  const gridTicks = useMemo(() => {
    const ticks = [];
    for (let x = 100; x < 1000; x += 100) ticks.push(x);
    return ticks;
  }, []);

  return (
    <div className="map-canvas">
      <div className="map-overlays map-overlays--top">
        <span className="map-badge map-badge--sim">
          <span className="sim-dot" aria-hidden="true" />
          SIMULATED COVERAGE — NOT RADIO PERFORMANCE
        </span>
      </div>

      <svg
        className="map-svg"
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Schematic map of the fictional Kaiva Basin response area, showing flood extent, simulated drone relay coverage rings, relay nodes, gateway, rescue teams and help report markers."
      >
        <defs>
          <pattern id="gridFine" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M25 0H0V25" fill="none" stroke="#6fd8ff" strokeWidth="0.5" strokeOpacity="0.055" />
          </pattern>
          <pattern id="gridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M100 0H0V100" fill="none" stroke="#6fd8ff" strokeWidth="0.9" strokeOpacity="0.1" />
          </pattern>
          <pattern id="floodHatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="16" stroke="#5fd4ff" strokeWidth="1" strokeOpacity="0.11" />
          </pattern>
          <radialGradient id="floodFill" cx="50%" cy="52%" r="62%">
            <stop offset="0%" stopColor="#0f4562" stopOpacity="0.62" />
            <stop offset="68%" stopColor="#0a2b40" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#07141f" stopOpacity="0.28" />
          </radialGradient>
          <radialGradient id="coverageFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4fd6ff" stopOpacity="0.1" />
            <stop offset="72%" stopColor="#4fd6ff" stopOpacity="0.045" />
            <stop offset="100%" stopColor="#4fd6ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="riverStroke" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2d8ab8" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#69dcff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#2d8ab8" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7fe9ff" stopOpacity="0" />
            <stop offset="60%" stopColor="#7fe9ff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#7fe9ff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="45%" r="72%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#01050b" stopOpacity="0.72" />
          </radialGradient>
          <filter id="markerGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* base + grid */}
        <rect width="1000" height="700" fill="#040910" onClick={onClear} />
        <rect width="1000" height="700" fill="url(#gridFine)" pointerEvents="none" />
        <rect width="1000" height="700" fill="url(#gridMajor)" pointerEvents="none" />

        {/* technical markings */}
        <g className="map-marks" aria-hidden="true">
          {gridTicks.map((x) => (
            <g key={`x${x}`}>
              <line x1={x} y1="0" x2={x} y2="8" />
              <line x1={x} y1="692" x2={x} y2="700" />
            </g>
          ))}
          {[100, 200, 300, 400, 500, 600].map((y) => (
            <g key={`y${y}`}>
              <line x1="0" y1={y} x2="8" y2={y} />
              <line x1="992" y1={y} x2="1000" y2={y} />
              <text x="16" y={y - 5}>N{String(y).padStart(4, '0')}</text>
            </g>
          ))}
          <circle cx="497" cy="352" r="250" className="map-orbit" />
          <circle cx="497" cy="352" r="330" className="map-orbit map-orbit--dashed" />
          <path d="M497 60V96M497 608v36M190 352h-36M840 352h36" className="map-crosshair" />
          <text x="500" y="366" className="map-watermark">KAIVA BASIN</text>
        </g>

        {/* flood extent */}
        <g aria-hidden="true">
          <path d={boundaryPath(FLOOD_BOUNDARY)} fill="url(#floodFill)" />
          <path d={boundaryPath(FLOOD_BOUNDARY)} fill="url(#floodHatch)" />
          <path d={boundaryPath(FLOOD_BOUNDARY)} className="flood-boundary" />
          <path d={smoothPath(RIVER_PATH)} className="river" />
          <text x="232" y="414" className="flood-label">FLOOD EXTENT · SIMULATED</text>
          <text x="612" y="562" className="river-label">KAIVA SPILL CHANNEL</text>
        </g>

        {/* coverage rings */}
        <g aria-hidden="true">
          {nodes.map((node) => {
            const active = node.status === 'active';
            const live = active && meshOn;
            return (
              <g key={node.id} className={`coverage ${live ? 'coverage--live' : active ? 'coverage--idle' : 'coverage--dead'}`}>
                {live && <circle cx={node.x} cy={node.y} r={node.radius} fill="url(#coverageFill)" />}
                <circle cx={node.x} cy={node.y} r={node.radius} className="coverage-ring" />
                <circle cx={node.x} cy={node.y} r={node.radius - 9} className="coverage-ring coverage-ring--inner" />
                {live && <circle cx={node.x} cy={node.y} r={node.radius} className="coverage-sweep" />}
              </g>
            );
          })}
        </g>

        {/* mesh links */}
        <g aria-hidden="true">
          {graph.links.map((link, index) => {
            const from = link.from === gateway.id ? gateway : nodes.find((node) => node.id === link.from);
            const to = link.to === gateway.id ? gateway : nodes.find((node) => node.id === link.to);
            if (!from || !to) return null;
            return (
              <g key={`${link.from}-${link.to}`} className="mesh-link">
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="mesh-link-line" />
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className="mesh-link-packet"
                  style={{ animationDelay: `${index * 0.7}s` }}
                />
              </g>
            );
          })}
          {!meshOn && (
            <g>
              {nodes
                .filter((node) => node.status === 'active')
                .map((node) => (
                  <line
                    key={`ghost-${node.id}`}
                    x1={node.x}
                    y1={node.y}
                    x2={gateway.x}
                    y2={gateway.y}
                    className="mesh-link-ghost"
                  />
                ))}
            </g>
          )}
        </g>

        {/* gateway */}
        <g aria-hidden="true" className={`gateway ${network.gateway === 'connected' ? 'is-up' : 'is-down'}`}>
          <circle cx={gateway.x} cy={gateway.y} r="34" className="gateway-halo" />
          <g transform={`translate(${gateway.x} ${gateway.y})`}>
            <path d="M0 -15 13 -7.5V7.5L0 15-13 7.5V-7.5Z" className="gateway-hex" />
            <path d="M0 -8 7 -4v8L0 8-7 4v-8Z" className="gateway-core" />
            <path d="M-19 -12A24 24 0 0 0-19 12M19 -12A24 24 0 0 1 19 12" className="gateway-wave" />
          </g>
          <g textAnchor="end">
            <text x={gateway.x - 40} y={gateway.y + 2} className="gateway-name">AEGIS-GW-01</text>
            <text x={gateway.x - 40} y={gateway.y + 15} className="gateway-sub">
              GATEWAY · {network.gateway === 'connected' ? 'CONNECTED' : 'UNAVAILABLE'}
            </text>
          </g>
        </g>

        {/* relay nodes */}
        <g>
          {nodes.map((node) => {
            const hops = graph.hops[node.id];
            const linkLabel = !meshOn
              ? 'MESH OFF'
              : node.status !== 'active'
                ? 'NO POWER'
                : hops
                  ? `${hops} HOP${hops === 1 ? '' : 'S'}`
                  : 'NO PATH';
            return (
              <g key={node.id} className={`relay-node status-${node.status}`} aria-hidden="true">
                <g transform={`translate(${node.x} ${node.y})`}>
                  <path d="M0 -11 9.5 -5.5V5.5L0 11-9.5 5.5V-5.5Z" className="node-hex" />
                  <circle r="2.6" className="node-core" />
                </g>
                <text x={node.x} y={node.y - 18} textAnchor="middle" className="node-name">
                  {node.label}
                </text>
                <text x={node.x} y={node.y + 26} textAnchor="middle" className="node-state">
                  {node.status.toUpperCase()} · {linkLabel}
                </text>
              </g>
            );
          })}
        </g>

        {/* teams */}
        <g>
          {teams.map((team) => (
            <TeamMarker key={team.id} team={team} report={selected} />
          ))}
        </g>

        {/* reports */}
        <g>
          {enriched.map((report) => (
            <ReportMarker
              key={report.id}
              report={report}
              selected={report.id === selectedId}
              dimmed={Boolean(selectedId) && report.id !== selectedId && report.status === 'assigned'}
              onSelect={onSelect}
            />
          ))}
        </g>

        {/* edge readouts */}
        <g className="map-readout" aria-hidden="true">
          <g transform="translate(26 636)">
            <path d="M0 0V-26M0 -26 -5 -15M0 -26 5 -15" />
            <text x="14" y="-18">N</text>
            <text x="14" y="-5" className="map-readout-sub">SCHEMATIC</text>
          </g>
          <g transform="translate(830 660)">
            <line x1="0" y1="0" x2="140" y2="0" />
            <line x1="0" y1="-4" x2="0" y2="4" />
            <line x1="70" y1="-3" x2="70" y2="3" />
            <line x1="140" y1="-4" x2="140" y2="4" />
            <text x="0" y="-9">0</text>
            <text x="140" y="-9" textAnchor="end">140 UNITS</text>
            <text x="70" y="14" textAnchor="middle" className="map-readout-sub">NOT TO SCALE</text>
          </g>
        </g>

        <rect width="1000" height="700" fill="url(#vignette)" pointerEvents="none" />
        <rect className="map-scan" width="1000" height="120" fill="url(#scanGrad)" pointerEvents="none" />
        <rect width="1000" height="700" fill="none" className="map-frame" pointerEvents="none" />
      </svg>

      <div className="map-statusbar">
        <span className="map-caption">
          {network.normal === 'available'
            ? 'Normal network available · relay overlay is reference only'
            : meshOn
              ? `Relay overlay live · ${graph.relayedNodeCount}/${nodes.length} nodes with gateway path`
              : 'Relay overlay inactive · no simulated coverage'}
        </span>
        <span className="map-statusbar-tags">
          <span className={`map-badge map-badge--${meshOn ? 'on' : 'off'}`}>MESH {meshOn ? 'ON' : 'OFF'}</span>
          <span className={`map-badge map-badge--${network.gateway === 'connected' ? 'on' : 'off'}`}>
            GATEWAY {network.gateway === 'connected' ? 'UP' : 'DOWN'}
          </span>
        </span>
        <span className="map-caption map-caption--strong">
          {selected ? `TRACKING ${selected.id} · ${selected.site.toUpperCase()}` : 'NO REPORT TRACKED · CLICK A MARKER'}
        </span>
      </div>
    </div>
  );
}

export default memo(MapView);
