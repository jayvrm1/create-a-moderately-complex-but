export function formatClock(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatAge(minutes) {
  const total = Math.max(0, Math.floor(minutes));
  if (total < 60) return `${total}m`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatPeople(count) {
  return `${count} ${count === 1 ? 'person' : 'people'}`;
}

export function formatPct(value) {
  return `${Math.round(value * 100)}%`;
}
