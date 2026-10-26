import { useMemo, useState } from 'react';
import { formatClock, formatDateTime } from '../lib/format.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'network', label: 'Network' },
  { id: 'report', label: 'Reports' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'team', label: 'Teams' },
];

const KIND_LABEL = {
  network: 'NETWORK',
  report: 'REPORT',
  dispatch: 'DISPATCH',
  team: 'TEAM',
  system: 'SYSTEM',
};

export default function EventLog({ events, limit, withFilters = false, live = false }) {
  const [filter, setFilter] = useState('all');

  const visible = useMemo(() => {
    const filtered = filter === 'all' ? events : events.filter((event) => event.kind === filter);
    return limit ? filtered.slice(0, limit) : filtered;
  }, [events, filter, limit]);

  return (
    <div className="eventlog">
      {withFilters && (
        <div className="log-filters" role="group" aria-label="Filter event log">
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

      <ol className="log-list" aria-live={live ? 'polite' : 'off'} aria-relevant="additions">
        {visible.length === 0 && <li className="log-empty">No events match this filter yet.</li>}
        {visible.map((event) => (
          <li className={`log-item log-item--${event.tone ?? 'neutral'}`} key={event.id}>
            <span className="log-time" title={formatDateTime(event.at)}>
              {formatClock(event.at)}
            </span>
            <span className={`log-kind log-kind--${event.kind}`}>{KIND_LABEL[event.kind] ?? 'SYSTEM'}</span>
            <p className="log-text">{event.text}</p>
          </li>
        ))}
      </ol>
      {limit && events.length > limit && (
        <p className="log-more">+{events.length - limit} earlier events — open Event Log for the full record.</p>
      )}
    </div>
  );
}
