import { SEVERITY_META, urgencyBand } from '../lib/simulation.js';
import { formatPct } from '../lib/format.js';

/** Severity uses shape + colour + text everywhere (never colour alone). */
export function SeverityGlyph({ severity, size = 10 }) {
  const tone = SEVERITY_META[severity]?.tone ?? 'low';
  return (
    <svg className={`glyph sev-fill-${tone}`} width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      {severity === 'critical' && <path d="M6 1 11.3 10.4H0.7Z" />}
      {severity === 'high' && <rect x="1.4" y="1.4" width="9.2" height="9.2" />}
      {severity === 'moderate' && <circle cx="6" cy="6" r="4.6" />}
      {severity === 'low' && <path d="M6 1.2 10.8 6 6 10.8 1.2 6Z" />}
    </svg>
  );
}

export function SeverityTag({ severity, compact = false }) {
  const meta = SEVERITY_META[severity];
  return (
    <span className={`tag sev-tag sev-tag--${meta.tone}${compact ? ' tag--compact' : ''}`}>
      <SeverityGlyph severity={severity} size={compact ? 8 : 9} />
      <span>{meta.label.toUpperCase()}</span>
    </span>
  );
}

export function StatusTag({ tone = 'muted', children }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}

export function ReachTag({ reachability, compact = false }) {
  const ok = reachability.reachable;
  return (
    <span className={`tag ${ok ? 'tag--ok' : 'tag--muted'}${compact ? ' tag--compact' : ''}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
        {ok ? <path d="M1 6.6 6.6 1M1 3.4 3.4 1M4.6 7 7 4.6" stroke="currentColor" strokeWidth="1" fill="none" /> : <path d="M1 1l6 6M7 1 1 7" stroke="currentColor" strokeWidth="1" fill="none" />}
      </svg>
      {ok ? (compact ? 'REACHABLE' : `REACHABLE · ${reachability.via}`) : 'UNREACHABLE'}
    </span>
  );
}

export function ScoreMeter({ score, withBand = false }) {
  const band = urgencyBand(score);
  return (
    <span className="score-meter">
      <span className="score-track" aria-hidden="true">
        <span className={`score-fill tone-${band.tone}`} style={{ width: `${Math.min(100, score)}%` }} />
      </span>
      <span className={`score-value tone-${band.tone}`}>{score.toFixed(1)}</span>
      {withBand && <span className="score-band">{band.label}</span>}
    </span>
  );
}

export function ConfidenceBar({ value }) {
  const low = value < 0.6;
  return (
    <span className="conf">
      <span className="conf-track" aria-hidden="true">
        <span className={`conf-fill${low ? ' conf-fill--low' : ''}`} style={{ width: formatPct(value) }} />
      </span>
      <span className={`conf-value${low ? ' conf-value--low' : ''}`}>{formatPct(value)}</span>
    </span>
  );
}

export function Panel({ kicker, title, aside, children, className = '', dense = false }) {
  return (
    <section className={`pnl ${className}`}>
      {(kicker || title) && (
        <header className="pnl-head">
          <div>
            {kicker && <span className="pnl-kicker">{kicker}</span>}
            {title && <h2 className="pnl-title">{title}</h2>}
          </div>
          {aside && <div className="pnl-aside">{aside}</div>}
        </header>
      )}
      <div className={`pnl-body${dense ? ' pnl-body--dense' : ''}`}>{children}</div>
    </section>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" className="empty-ring" />
        <path d="M7 12h10" className="empty-mark" />
      </svg>
      <p className="empty-title">{title}</p>
      {children && <p className="empty-text">{children}</p>}
    </div>
  );
}

export function SimStamp({ compact = false }) {
  return (
    <span className={`sim-stamp${compact ? ' sim-stamp--compact' : ''}`}>
      <span className="sim-dot" aria-hidden="true" />
      SIMULATION · NOT CONNECTED TO LIVE SYSTEMS
    </span>
  );
}
