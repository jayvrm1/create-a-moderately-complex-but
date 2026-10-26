import { useMemo, useState } from 'react';
import { formatLogStamp } from '../state/useRescueLink.js';

const FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'network', label: 'NET' },
  { id: 'drone', label: 'DRONE' },
  { id: 'reach', label: 'REACH' },
  { id: 'report', label: 'RPT' },
  { id: 'dispatch', label: 'DISP' },
];

const KIND = {
  network: 'NET',
  drone: 'DRN',
  reach: 'RCH',
  report: 'RPT',
  dispatch: 'DSP',
  team: 'TEA',
  system: 'SYS',
};

export default function ActivityLog({ events, limit, withFilters = false, onOpenLog }) {
  const [filter, setFilter] = useState('all');

  const visible = useMemo(() => {
    const list = filter === 'all' ? events : events.filter((event) => event.kind === filter);
    return limit ? list.slice(0, limit) : list;
  }, [events, filter, limit]);

  return (
    <div className="log">
      {withFilters && (
        <div className="log-filters" role="group" aria-label="Filter activity log">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`log-filter${filter === item.id ? ' is-active' : ''}`}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <ol className="log-list" aria-live="polite" aria-relevant="additions">
        {visible.length === 0 && <li className="log-empty">No entries for this filter yet.</li>}
        {visible.map((event) => (
          <li key={event.id} className={`log-item tone-${event.tone ?? 'neutral'}`}>
            <span className="log-time">{formatLogStamp(event.atSim)}</span>
            <span className={`log-kind kind-${event.kind}`}>{KIND[event.kind] ?? 'SYS'}</span>
            <span className="log-text">{event.text}</span>
          </li>
        ))}
      </ol>
      {onOpenLog && (
        <button type="button" className="link-btn" onClick={onOpenLog}>
          OPEN FULL LOG →
        </button>
      )}
    </div>
  );
}
