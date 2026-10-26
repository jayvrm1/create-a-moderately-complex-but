import { SPEEDS, routeDuration } from '../lib/simulation.js';
import { formatSimLabel } from '../state/useRescueLink.js';

function PlayIcon({ paused }) {
  return (
    <svg width="10" height="11" viewBox="0 0 10 11" aria-hidden="true">
      {paused ? <path d="M1.5 1 9 5.5 1.5 10Z" fill="currentColor" stroke="none" /> : <path d="M2.2 1v9M7.8 1v9" stroke="currentColor" strokeWidth="1.8" />}
    </svg>
  );
}

export default function TransportBar({
  running,
  paused,
  simTime,
  speed,
  reducedMotion,
  note,
  onStart,
  onPause,
  onStep,
  onReset,
  onSpeed,
  drones,
}) {
  const horizon = Math.max(180, Math.ceil(Math.max(...drones.map(routeDuration)) / 60) * 60);
  const pct = Math.min(100, (simTime / horizon) * 100);
  const ticks = [];
  for (let s = 60; s < horizon; s += 60) ticks.push(s);

  return (
    <footer className="transport">
      <div className="transport-controls">
        <button
          type="button"
          className={`btn btn--transport${running ? ' is-on' : ''}`}
          onClick={running ? onPause : onStart}
          aria-pressed={running}
        >
          <PlayIcon paused={!running} />
          {running ? 'PAUSE' : 'START'}
        </button>
        <button type="button" className="btn btn--transport" onClick={onStep}>
          STEP +1 MIN
        </button>
        <button type="button" className="btn btn--transport btn--quiet" onClick={onReset}>
          RESET
        </button>
        <div className="speed-group" role="group" aria-label="Simulation speed">
          <span className="speed-label">SPEED</span>
          {SPEEDS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`speed-btn${speed === option.factor ? ' is-active' : ''}`}
              aria-pressed={speed === option.factor}
              onClick={() => onSpeed(option.factor)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className={`transport-state ${running ? 'is-running' : paused ? 'is-paused' : 'is-ready'}`}>
          {running ? 'RUNNING' : paused ? 'PAUSED' : 'READY'}
        </span>
      </div>

      <div className="timeline">
        <span className="timeline-time">T+{formatSimLabel(simTime)}</span>
        <div className="timeline-track" role="img" aria-label={`Simulation elapsed ${formatSimLabel(simTime)} of ${formatSimLabel(horizon)}`}>
          <span className="timeline-fill" style={{ width: `${pct}%` }} />
          {ticks.map((tick) => (
            <span key={tick} className="timeline-tick" style={{ left: `${(tick / horizon) * 100}%` }} />
          ))}
        </div>
        <span className="timeline-time timeline-time--dim">{formatSimLabel(horizon)}</span>
      </div>

      <p className={`transport-note note--${note.tone ?? 'warn'}`} role="status" aria-live="polite">
        <span className="transport-note-title">{note.title}</span>
        <span className="transport-note-text">{note.text}</span>
        {reducedMotion && (
          <span className="transport-note-rm">REDUCED MOTION ON · drones advance only when you press STEP</span>
        )}
      </p>
    </footer>
  );
}
