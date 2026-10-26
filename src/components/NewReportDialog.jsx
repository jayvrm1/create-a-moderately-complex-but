import { useEffect, useRef, useState } from 'react';
import { REPORT_SITES, REPORT_SOURCES } from '../data/scenario.js';
import { SEVERITIES, SEVERITY_META } from '../lib/simulation.js';

export default function NewReportDialog({ open, onClose, onSubmit }) {
  const cardRef = useRef(null);
  const firstRef = useRef(null);
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
    firstRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !cardRef.current) return;
      const focusables = cardRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
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
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-report-title"
        ref={cardRef}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <span className="modal-kicker">INJECT FICTIONAL DATA</span>
            <h2 id="new-report-title">New help report</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close new report dialog">
            <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
              <path d="M2 2l10 10M12 2 2 12" fill="none" strokeWidth="1.4" />
            </svg>
          </button>
        </header>

        <form className="modal-form" onSubmit={submit}>
          <label className="field">
            <span>Report location</span>
            <select
              ref={firstRef}
              value={form.siteIndex}
              onChange={(event) => setForm({ ...form, siteIndex: Number(event.target.value) })}
            >
              {REPORT_SITES.map((site, index) => (
                <option key={site.label} value={index}>
                  {site.label}
                </option>
              ))}
            </select>
          </label>

          <div className="field-row">
            <label className="field">
              <span>Severity</span>
              <select
                value={form.severity}
                onChange={(event) => setForm({ ...form, severity: event.target.value })}
              >
                {SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {SEVERITY_META[severity].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>People needing help</span>
              <input
                type="number"
                min="1"
                max="60"
                value={form.people}
                onChange={(event) => setForm({ ...form, people: event.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span>Report source</span>
            <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
              {REPORT_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>
              Location confidence <b>{Math.round(form.confidence * 100)}%</b>
            </span>
            <input
              type="range"
              min="30"
              max="95"
              step="1"
              value={Math.round(form.confidence * 100)}
              onChange={(event) => setForm({ ...form, confidence: Number(event.target.value) / 100 })}
            />
          </label>

          <label className="field">
            <span>Field note (optional)</span>
            <textarea
              rows="2"
              maxLength="160"
              placeholder="Short fictional detail, e.g. water rising at the rear stairwell"
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
          </label>

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}

          <p className="modal-note">
            Adds a fictional report to this browser session only. Nothing is transmitted and no real emergency channel
            is contacted.
          </p>

          <div className="modal-actions">
            <button type="button" className="btn btn--quiet" onClick={onClose}>
              CANCEL
            </button>
            <button type="submit" className="btn btn--primary">
              FILE REPORT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
