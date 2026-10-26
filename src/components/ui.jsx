import { SEVERITY_META, urgencyBand } from '../lib/simulation.js';
import { formatAge, formatPct } from '../lib/format.js';

export function Panel({ title, kicker, aside, children, className = '', scroll = false, id }) {
  return (
    <section className={`panel ${className}`} id={id}>
      {(title || aside) && (
        <header className="panel-head">
          <div className="panel-head-text">
            {kicker && <span className="panel-kicker">{kicker}</span>}
            {title && <h2 className="panel-title">{title}</h2>}
          </div>
          {aside && <div className="panel-aside">{aside}</div>}
        </header>
      )}
      <div className={`panel-body${scroll ? ' panel-body--scroll' : ''}`}>{children}</div>
    </section>
  );
}

/** Severity is carried by shape + colour + text label everywhere. */
export function SeverityGlyph({ severity, size = 12 }) {
  const tone = SEVERITY_META[severity]?.tone ?? 'low';
  const half = size / 2;
  return (
    <svg
      className={`sev-glyph sev-${tone}`}
      width={size}
      height={size}
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      {severity === 'critical' && <path d="M6 0.8 11.4 10.6H0.6Z" />}
      {severity === 'high' && <path d="M1 1.4h10v9.2H1Z" />}
      {severity === 'moderate' && <circle cx="6" cy="6" r="4.8" />}
      {severity === 'low' && <rect x="2.6" y="2.6" width="6.8" height="6.8" rx="1.2" />}
      {severity === 'critical' && <circle cx="6" cy="8.7" r="0.9" className="glyph-cut" />}
      {severity === 'critical' && <rect x="5.4" y="3.8" width="1.2" height="3.4" className="glyph-cut" />}
      {severity === 'high' && <circle cx="6" cy="6" r="1.6" className="glyph-cut" />}
      <circle cx={half} cy={half} r="0" />
    </svg>
  );
}

export function SeverityTag({ severity, withText = true, compact = false }) {
  const meta = SEVERITY_META[severity];
  return (
    <span className={`sev-tag sev-tag--${meta.tone}${compact ? ' sev-tag--compact' : ''}`}>
      <SeverityGlyph severity={severity} size={compact ? 10 : 11} />
      {withText && <span>{meta.label}</span>}
    </span>
  );
}

export function ReachBadge({ reachability, compact = false }) {
  const state = reachability.reachable ? 'ok' : 'down';
  return (
    <span className={`reach-badge reach-badge--${state}${compact ? ' reach-badge--compact' : ''}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
        {reachability.reachable ? (
          <>
            <circle cx="2" cy="8" r="1.4" />
            <circle cx="8" cy="2" r="1.4" />
            <path d="M3 7 7 3" strokeWidth="1.2" fill="none" />
          </>
        ) : (
          <>
            <circle cx="2.4" cy="7.6" r="1.2" />
            <circle cx="7.6" cy="2.4" r="1.2" />
            <path d="M2.6 4.2 4.2 2.6M5.8 7.4 7.4 5.8" strokeWidth="1.2" fill="none" />
          </>
        )}
      </svg>
      <span>{reachability.reachable ? 'Reachable' : 'Unreachable'}</span>
      {!compact && <span className="reach-badge-detail">{reachability.short}</span>}
    </span>
  );
}

export function StatusTag({ status, label }) {
  const map = {
    open: { label: 'Awaiting dispatch', tone: 'warn' },
    assigned: { label: 'Assigned', tone: 'ok' },
    available: { label: 'Available', tone: 'ok' },
    en_route: { label: 'En route', tone: 'warn' },
    unavailable: { label: 'Unavailable', tone: 'muted' },
    active: { label: 'Active', tone: 'ok' },
    standby: { label: 'Standby', tone: 'warn' },
    offline: { label: 'Offline', tone: 'muted' },
  };
  const meta = map[status] ?? { label: status, tone: 'muted' };
  return <span className={`status-tag status-tag--${meta.tone}`}>{label ?? meta.label}</span>;
}

export function UrgencyMeter({ score, showBand = true }) {
  const band = urgencyBand(score);
  return (
    <div className="urgency">
      <div className="urgency-top">
        <span className={`urgency-score tone-${band.tone}`}>{score.toFixed(1)}</span>
        {showBand && <span className="urgency-band">{band.label}</span>}
      </div>
      <div className="urgency-track" role="presentation">
        <span
          className={`urgency-fill tone-${band.tone}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}

export function ConfidenceMeter({ value }) {
  const low = value < 0.6;
  return (
    <div className="confidence">
      <div className="confidence-track" role="presentation">
        <span
          className={`confidence-fill${low ? ' confidence-fill--low' : ''}`}
          style={{ width: `${formatPct(value)}` }}
        />
      </div>
      <span className={`confidence-value${low ? ' confidence-value--low' : ''}`}>
        {formatPct(value)}
        <span className="confidence-note">{low ? 'low' : 'ok'}</span>
      </span>
    </div>
  );
}

export function ScoreBreakdown({ ranked, compact = false }) {
  return (
    <dl className={`breakdown${compact ? ' breakdown--compact' : ''}`}>
      {ranked.parts.map((part) => (
        <div className="breakdown-row" key={part.key}>
          <dt>{part.label}</dt>
          <dd>
            <span className="breakdown-detail">{part.detail}</span>
            <span className="breakdown-value">+{part.value.toFixed(1)}</span>
          </dd>
        </div>
      ))}
      <div className="breakdown-row breakdown-total">
        <dt>Demo score</dt>
        <dd>
          <span className="breakdown-detail">
            Severity + people + age + low location confidence, capped at 100
          </span>
          <span className="breakdown-value">{ranked.score.toFixed(1)}</span>
        </dd>
      </div>
    </dl>
  );
}

export function AgeValue({ minutes }) {
  return <span className="age-value">{formatAge(minutes)}</span>;
}

export function EmptyState({ title, children, icon = 'dash' }) {
  return (
    <div className="empty-state">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" focusable="false">
        {icon === 'dash' && (
          <>
            <circle cx="17" cy="17" r="12.5" className="empty-ring" />
            <path d="M10 18h14" className="empty-mark" />
            <path d="M17 26v4" className="empty-mark" />
          </>
        )}
        {icon === 'alert' && (
          <>
            <path d="M17 4 31 29H3Z" className="empty-ring" />
            <path d="M17 13v8M17 24.4v1" className="empty-mark" />
          </>
        )}
      </svg>
      <p className="empty-title">{title}</p>
      <div className="empty-text">{children}</div>
    </div>
  );
}

export function SimulationStamp({ variant = 'inline' }) {
  return (
    <span className={`sim-stamp sim-stamp--${variant}`}>
      <span className="sim-dot" aria-hidden="true" />
      SIMULATION · NOT CONNECTED TO LIVE SYSTEMS
    </span>
  );
}
