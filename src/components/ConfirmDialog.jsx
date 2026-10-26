import { useEffect, useRef } from 'react';

export default function ConfirmDialog({ open, title, kicker, body, confirmLabel, cancelLabel = 'Cancel', onConfirm, onClose }) {
  const cardRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    confirmRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !cardRef.current) return;
      const focusables = cardRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
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

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="dialog dialog--confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        ref={cardRef}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dialog-head">
          <div>
            <span className="dialog-kicker">{kicker}</span>
            <h2 id="confirm-title">{title}</h2>
          </div>
        </header>
        <div className="confirm-body">
          <p id="confirm-body">{body}</p>
          <div className="dialog-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              {cancelLabel}
            </button>
            <button type="button" className="btn btn--primary" onClick={onConfirm} ref={confirmRef}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
