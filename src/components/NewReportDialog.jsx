import { useEffect, useRef, useState } from 'react';
import { REPORT_SITES, REPORT_SOURCES } from '../data/scenario.js';
import { SEVERITIES, SEVERITY_META } from '../lib/simulation.js';

export default function NewReportDialog({ open, onClose, onSubmit }) {
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);
  const [form, setForm] = useState({
    siteIndex: 0,
    severity: 'high',
    people: 6,
    source: REPORT_SOURCES[0],
    confidence: 0.65,
    note: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    firstFieldRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    const people = Number(form.people);
    if (!Number.isFinite(people) || people < 1 || people > 60) {
      setError('People count must be between 1 and 60 in this exercise.');
      return;
    }
    setError('');
    onSubmit({
      site: REPORT_SITES[form.siteIndex],
      severity: form.severity,
      people,
      source: form.source,
      confidence: Number(form.confidence),
      note: form.note.trim() || 'No field note supplied. Simulated report filed from the console.',
    });
    setForm((prev) => ({ ...prev, note: '', people: 4 }));
    onClose();
  };

  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-report-title"
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dialog-head">
          <div>
            <span className="dialog-kicker">INJECT FICTIONAL DATA</span>
            <h2 id="new-report-title">New help report</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close new report dialog">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M3 3l10 10M13 3 3 13" fill="none" strokeWidth="1.5" />
            </svg>
          </button>
        </header>

        <form className="dialog-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="report-site">Report location</label>
            <select
              id="report-site"
              ref={firstFieldRef}
              value={form.siteIndex}
              onChange={(event) => setForm({ ...form, siteIndex: Number(event.target.value) })}
            >
              {REPORT_SITES.map((site, index) => (
                <option key={site.label} value={index}>
                  {site.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="report-severity">Severity</label>
              <select
                id="report-severity"
                value={form.severity}
                onChange={(event) => setForm({ ...form, severity: event.target.value })}
              >
                {SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {SEVERITY_META[severity].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="report-people">People needing help</label>
              <input
                id="report-people"
                type="number"
                min="1"
                max="60"
                value={form.people}
                onChange={(event) => setForm({ ...form, people: event.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="report-source">Report source</label>
            <select
              id="report-source"
              value={form.source}
              onChange={(event) => setForm({ ...form, source: event.target.value })}
            >
              {REPORT_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="report-confidence">
              Location confidence <span className="field-value">{Math.round(form.confidence * 100)}%</span>
            </label>
            <input
              id="report-confidence"
              type="range"
              min="30"
              max="95"
              step="1"
              value={Math.round(form.confidence * 100)}
              onChange={(event) => setForm({ ...form, confidence: Number(event.target.value) / 100 })}
            />
            <p className="field-hint">Lower confidence adds to the demo priority score for verification.</p>
          </div>

          <div className="field">
            <label htmlFor="report-note">Field note (optional)</label>
            <textarea
              id="report-note"
              rows="2"
              maxLength="160"
              placeholder="Short fictional detail, e.g. water rising at the rear stairwell"
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
          </div>

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}

          <p className="dialog-note">
            This injects a fictional report into the browser session only. Nothing is sent anywhere, and no real
            emergency channel is contacted.
          </p>

          <div className="dialog-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              File simulated report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
