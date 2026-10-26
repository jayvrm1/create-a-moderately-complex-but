import { memo, useMemo } from 'react';
import { FLOOD_BOUNDARY, RIVER_PATH, STAGING } from '../data/scenario.js';
import { SEVERITY_META } from '../lib/simulation.js';
import { formatPct } from '../lib/format.js';

const SEV_COLOR = {
  critical: '#ff5f6e',
  high: '#f0a24a',
  moderate: '#e8cf72',
  low: '#8dd6ef',
};

const DRONE_COLOR = { active: '#5fe3ff', standby: '#f0b95e', offline: '#5b7185' };

function boundaryPath(points) {
  return `M${points.map(([x, y]) => `${x},${y}`).join(' L')} Z`;
}
function polyline(points) {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
}

function ReportMarker({ report, selected, onSelect }) {
  const meta = SEVERITY_META[report.severity];
  const color = SEV_COLOR[report.severity];
  const labelW = 74;
  const side = report.labelSide ?? (report.x + 13 + labelW > 992 ? 'left' : 'right');
  const lx =
    side === 'left'
      ? report.x - 13 - labelW
      : side === 'right'
        ? report.x + 13
        : report.x - labelW / 2;
  const ly = side === 'top' ? report.y - 30 : side === 'bottom' ? report.y + 13 : report.y - 8;
  const leader =
    side === 'left'
      ? { x1: report.x - 11, y1: report.y, x2: lx + labelW, y2: report.y }
      : side === 'right'
        ? { x1: report.x + 11, y1: report.y, x2: lx, y2: report.y }
        : side === 'top'
          ? { x1: report.x, y1: report.y - 10, x2: report.x, y2: ly + 17 }
          : { x1: report.x, y1: report.y + 10, x2: report.x, y2: ly };
  const reachable = report.reachability.reachable;
  const label = `${report.id}, ${meta.label} severity, ${report.people} people at ${report.site}, ${
    reachable ? `reachable via ${report.reachability.via}` : 'unreachable'
  }, score ${report.ranked.score.toFixed(1)}.`;

  return (
    <g
      className={`rpt${selected ? ' is-selected' : ''}${reachable ? '' : ' is-unreachable'} sev-${meta.tone}`}
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
    >
      <title>{label}</title>
      {selected && (
        <>
          <rect x={report.x - 13} y={report.y - 13} width="26" height="26" className="sel-bracket" />
          <path
            d={`M${report.x - 19} ${report.y}h-6M${report.x + 19} ${report.y}h6M${report.x} ${report.y - 19}v-6M${report.x} ${report.y + 19}v6`}
            className="sel-cross"
          />
        </>
      )}
      <rect x={report.x - 9} y={report.y - 9} width="18" height="18" className="rpt-hit" />
      <g className="rpt-sym">
        {report.severity === 'critical' && <path d={`M${report.x} ${report.y - 6} ${report.x + 5.6} ${report.y + 4.4}H${report.x - 5.6}Z`} fill={color} />}
        {report.severity === 'high' && <rect x={report.x - 5} y={report.y - 5} width="10" height="10" fill={color} />}
        {report.severity === 'moderate' && <circle cx={report.x} cy={report.y} r="5.2" fill={color} />}
        {report.severity === 'low' && <path d={`M${report.x} ${report.y - 5.4} ${report.x + 5.4} ${report.y} ${report.x} ${report.y + 5.4} ${report.x - 5.4} ${report.y}Z`} fill={color} />}
        {!reachable && (
          <path
            d={`M${report.x - 8} ${report.y - 8} ${report.x + 8} ${report.y + 8}M${report.x + 8} ${report.y - 8} ${report.x - 8} ${report.y + 8}`}
            className="rpt-nolink"
          />
        )}
      </g>
      <line {...leader} className="rpt-leader" />
      <g className="rpt-label">
        <rect x={lx} y={ly} width={labelW} height="17" />
        <text x={lx + 5} y={ly + 12} className="rpt-id">
          {report.id}
        </text>
        <text x={lx + labelW - 5} y={ly + 12} className="rpt-people" textAnchor="end">
          {report.people}P · {formatPct(report.confidence)}
        </text>
      </g>
    </g>
  );
}

function TeamMarker({ team, eligible }) {
  const side = team.labelSide ?? 'right';
  const tx = side === 'left' ? team.x - 12 : team.x + 12;
  const anchor = side === 'left' ? 'end' : 'start';
  return (
    <g className={`team st-${team.status}${eligible ? ' is-eligible' : ''}`}>
      <g transform={`translate(${team.x} ${team.y})`}>
        <path d="M0 -7.4 7.4 0 0 7.4-7.4 0Z" className="team-sym" />
        <circle r="1.8" className="team-core" />
      </g>
      <text x={tx} y={team.y - 1} className="team-id" textAnchor={anchor}>
        {team.id}
      </text>
      <text x={tx} y={team.y + 8} className="team-status" textAnchor={anchor}>
        {team.status === 'en_route' ? 'EN ROUTE' : team.status.toUpperCase()} · {team.capacity} CAP
      </text>
    </g>
  );
}

function DroneMarker({ drone }) {
  const color = DRONE_COLOR[drone.status] ?? DRONE_COLOR.offline;
  const active = drone.status === 'active';
  const connected = drone.connected;
  const label = `${drone.callsign} · ${drone.id}, ${drone.status.toUpperCase()}${
    active ? `, task ${drone.task}, battery ${Math.round(drone.battery)} percent` : ''
  }.`;

  return (
    <g className={`drone st-${drone.status}${drone.moving ? ' is-moving' : ''}`} aria-hidden="true">
      <title>{label}</title>

      {drone.trail.length > 1 && (
        <g className="drone-trail">
          {drone.trail.map((point, index) => {
            const next = drone.trail[index + 1] ?? { x: drone.x, y: drone.y };
            return (
              <line
                key={`${drone.id}-t${index}`}
                x1={point.x}
                y1={point.y}
                x2={next.x}
                y2={next.y}
                style={{ opacity: point.age * 0.55 }}
              />
            );
          })}
        </g>
      )}

      <g transform={`translate(${drone.x} ${drone.y}) rotate(${drone.heading})`} className="drone-body">
        {active && <circle r="11" className="drone-halo" />}
        <path d="M0 -6.4 6.4 -3.2 6.4 3.2 0 6.4-6.4 3.2-6.4-3.2Z" className="drone-hex" stroke={color} />
        {drone.moving && <path d="M0 -11.8 -2.8 -8.6H2.8Z" className="drone-heading" stroke={color} fill={color} />}
        <circle r="1.7" fill={color} />
      </g>

      <g className="drone-tag">
        {(() => {
          const dy = drone.labelDy ?? 0;
          const dir = drone.labelSide === 'left' ? -1 : 1;
          const tx = drone.x + dir * 20;
          return (
            <>
              <line
                x1={drone.x + dir * 8}
                y1={drone.y - 8}
                x2={drone.x + dir * 17}
                y2={drone.y - 15 + Math.min(0, dy)}
                className="drone-leader"
              />
              <g textAnchor={drone.labelSide === 'left' ? 'end' : 'start'}>
                <text x={tx} y={drone.y - 15 + dy} className="drone-name" style={{ fill: color }}>
                  {drone.callsign}
                </text>
                <text x={tx} y={drone.y - 6 + dy} className="drone-meta">
                  {drone.status.toUpperCase()}
                  {active ? ` · ${connected ? 'LINKED' : 'NO PATH'}` : ''}
                  {active ? ` · ${Math.round(drone.battery)}%` : ''}
                </text>
                {active && (
                  <text x={tx} y={drone.y + 3 + dy} className="drone-task">
                    {drone.task}
                  </text>
                )}
              </g>
            </>
          );
        })()}
      </g>
    </g>
  );
}

function MapView({ reports, teams, droneStates, gateway, network, graph, selectedId, onSelect, onClear, reducedMotion }) {
  const meshOn = network.mesh === 'on';
  const selected = reports.find((report) => report.id === selectedId) ?? null;
  const eligibleIds = useMemo(() => new Set(), []);

  const xTicks = useMemo(() => Array.from({ length: 19 }, (_, i) => (i + 1) * 50), []);
  const yTicks = useMemo(() => Array.from({ length: 13 }, (_, i) => (i + 1) * 50), []);
  const droneById = useMemo(
    () => new Map(droneStates.map((drone) => [drone.id, drone])),
    [droneStates],
  );

  return (
    <div className="map" onClick={onClear} role="presentation">
      <svg
        className="map-svg"
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Schematic response map of the fictional Kaiva Basin: flood extent, help reports, rescue teams, simulated relay drones with coverage arcs and relay links, and the AEGIS gateway."
      >
        <defs>
          <pattern id="gridS" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M25 0H0V25" fill="none" stroke="#6fd8ff" strokeWidth="0.5" strokeOpacity="0.05" />
          </pattern>
          <pattern id="gridL" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M100 0H0V100" fill="none" stroke="#6fd8ff" strokeWidth="0.8" strokeOpacity="0.1" />
          </pattern>
          <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="#57c8ea" strokeWidth="1" strokeOpacity="0.1" />
          </pattern>
          <radialGradient id="floodFill" cx="50%" cy="52%" r="62%">
            <stop offset="0%" stopColor="#0e3c54" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#0a2434" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#06121c" stopOpacity="0.24" />
          </radialGradient>
          <radialGradient id="coverFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5fe3ff" stopOpacity="0.075" />
            <stop offset="100%" stopColor="#5fe3ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="riverGrad" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2b7f9f" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#5fd0ee" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#2b7f9f" stopOpacity="0.16" />
          </linearGradient>
          <radialGradient id="vig" cx="50%" cy="46%" r="74%">
            <stop offset="58%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#01050a" stopOpacity="0.66" />
          </radialGradient>
          <filter id="glow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="1000" height="700" fill="#040910" />
        <rect width="1000" height="700" fill="url(#gridS)" />
        <rect width="1000" height="700" fill="url(#gridL)" />

        {/* coordinate detail */}
        <g className="coords" aria-hidden="true">
          {xTicks.map((x) => (
            <g key={`x${x}`}>
              <line x1={x} y1="0" x2={x} y2={x % 100 === 0 ? 9 : 5} />
              {x % 100 === 0 && (
                <text x={x} y="20" textAnchor="middle">
                  {String(x).padStart(4, '0')}
                </text>
              )}
            </g>
          ))}
          {yTicks.map((y) => (
            <g key={`y${y}`}>
              <line x1="0" y1={y} x2={y % 100 === 0 ? 9 : 5} y2={y} />
              {y % 100 === 0 && (
                <text x="14" y={y - 4}>
                  {String(y).padStart(4, '0')}
                </text>
              )}
            </g>
          ))}
          <text x="500" y="684" textAnchor="middle" className="coords-watermark">
            KAIVA BASIN · SCHEMATIC · NOT TO SCALE
          </text>
        </g>

        {/* flood extent */}
        <g aria-hidden="true">
          <path d={boundaryPath(FLOOD_BOUNDARY)} fill="url(#floodFill)" />
          <path d={boundaryPath(FLOOD_BOUNDARY)} fill="url(#hatch)" />
          <path d={boundaryPath(FLOOD_BOUNDARY)} className="flood-edge" />
          <path d={polyline(RIVER_PATH)} className="river" />
          <text x="96" y="352" className="flood-label">
            FLOOD EXTENT · SIMULATED
          </text>
        </g>

        {/* gateway range + coverage arcs */}
        <g aria-hidden="true">
          {network.gateway === 'connected' && meshOn && (
            <circle cx={gateway.x} cy={gateway.y} r={gateway.range} className="gw-range" />
          )}
          {droneStates.map((drone) => {
            const live = drone.status === 'active' && meshOn && network.gateway === 'connected';
            const linked = drone.connected;
            return (
              <g key={`cov-${drone.id}`} className={`cover${live ? ' is-live' : ''}${linked ? ' is-linked' : ''}`}>
                {live && drone.moving && <circle cx={drone.x} cy={drone.y} r={drone.range} fill="url(#coverFill)" />}
                <circle cx={drone.x} cy={drone.y} r={drone.range} className="cover-ring" />
                <circle cx={drone.x} cy={drone.y} r={drone.range - 12} className="cover-ring cover-ring--inner" />
                {live && !reducedMotion && (
                  <g className="cover-sweep" style={{ transformOrigin: `${drone.x}px ${drone.y}px` }}>
                    <line x1={drone.x} y1={drone.y} x2={drone.x + drone.range} y2={drone.y} className="cover-sweep-line" />
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* relay links */}
        <g aria-hidden="true">
          {graph.links.map((link, index) => {
            const from = droneById.get(link.from);
            const to = link.to === gateway.id ? gateway : droneById.get(link.to);
            if (!from || !to) return null;
            return (
              <g key={`${link.from}-${link.to}`} className={`link link--${link.kind}`}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="link-line" />
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className="link-packet"
                  style={{ animationDelay: `${index * 0.55}s` }}
                />
              </g>
            );
          })}
        </g>

        {/* report to relay links */}
        <g aria-hidden="true">
          {reports.map((report) => {
            if (!report.reachability.reachable || !report.reachability.droneId) return null;
            const drone = droneById.get(report.reachability.droneId);
            if (!drone) return null;
            return (
              <line
                key={`rl-${report.id}`}
                x1={report.x}
                y1={report.y}
                x2={drone.x}
                y2={drone.y}
                className={`report-link${report.id === selectedId ? ' is-selected' : ''}`}
              />
            );
          })}
        </g>

        {/* staging pad */}
        <g aria-hidden="true" className="staging">
          <circle cx={STAGING.x} cy={STAGING.y} r="17" className="staging-ring" />
          <path d={`M${STAGING.x - 11} ${STAGING.y}h22M${STAGING.x} ${STAGING.y - 11}v22`} className="staging-cross" />
          <text x={STAGING.x - 24} y={STAGING.y + 30} textAnchor="end" className="staging-label">
            STAGING PAD
          </text>
        </g>

        {/* gateway */}
        <g aria-hidden="true" className={`gateway${network.gateway === 'connected' ? ' is-up' : ' is-down'}`}>
          <circle cx={gateway.x} cy={gateway.y} r="26" className="gw-halo" />
          <g transform={`translate(${gateway.x} ${gateway.y})`}>
            <path d="M0 -12 10.4 -6V6L0 12-10.4 6V-6Z" className="gw-hex" />
            <path d="M0 -5.6 5 -2.8v5.6L0 5.6-5 2.8v-5.6Z" className="gw-core" />
            <path d="M-15.6 -8A19 19 0 0 0-15.6 8M15.6 -8A19 19 0 0 1 15.6 8" className="gw-wave" />
          </g>
          <text x={gateway.x - 22} y={gateway.y - 2} textAnchor="end" className="gw-name">
            {gateway.label}
          </text>
          <text x={gateway.x - 22} y={gateway.y + 8} textAnchor="end" className="gw-sub">
            {gateway.id} · {network.gateway === 'connected' ? 'CONNECTED' : 'UNAVAILABLE'}
          </text>
        </g>

        {/* teams */}
        <g>
          {teams.map((team) => (
            <TeamMarker key={team.id} team={team} eligible={eligibleIds.has(team.id)} />
          ))}
        </g>

        {/* reports */}
        <g>
          {reports.map((report) => (
            <ReportMarker
              key={report.id}
              report={report}
              selected={report.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </g>

        {/* planned routes for active drones */}
        <g aria-hidden="true" className="routes">
          {droneStates.map((drone) =>
            drone.status === 'active' && drone.legs.length ? (
              <path
                key={`route-${drone.id}`}
                d={`M${drone.start.x},${drone.start.y} ${drone.legs.map((leg) => `L${leg.to.x},${leg.to.y}`).join(' ')}`}
                className="route-line"
              />
            ) : null,
          )}
          {droneStates
            .filter((drone) => drone.status === 'active' && drone.legs.length)
            .map((drone) =>
              drone.legs.map((leg) => (
                <g key={`wp-${drone.id}-${leg.to.x}-${leg.to.y}`} className="waypoint">
                  <path d={`M${leg.to.x - 3} ${leg.to.y}h6v6h-6z`} />
                </g>
              )),
            )}
        </g>

        {/* drones */}
        <g>
          {droneStates.map((drone) => (
            <DroneMarker key={drone.id} drone={drone} />
          ))}
        </g>

        <rect width="1000" height="700" fill="url(#vig)" pointerEvents="none" />
        {!reducedMotion && <rect className="scanline" width="1000" height="90" pointerEvents="none" />}
      </svg>

      <div className="map-badge" role="note">
        <span className="map-badge-dot" aria-hidden="true" />
        SIMULATED COVERAGE — NOT RADIO PERFORMANCE
      </div>

      <div className="map-overlay map-overlay--topright">
        <span className={`layer-chip${meshOn ? ' is-on' : ''}`}>MESH {meshOn ? 'ON' : 'OFF'}</span>
        <span className={`layer-chip${network.gateway === 'connected' ? ' is-on' : ''}`}>
          GATEWAY {network.gateway === 'connected' ? 'UP' : 'DOWN'}
        </span>
        <span className={`layer-chip${network.normal === 'available' ? ' is-on' : ''}`}>
          NET {network.normal === 'available' ? 'UP' : 'OUT'}
        </span>
      </div>

      {selected && (
        <div className="map-overlay map-overlay--tracked">
          <span className="tracked-label">TRACKING</span>
          <span className="tracked-id">{selected.id}</span>
          <span className="tracked-site">{selected.site.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}

export default memo(MapView);
