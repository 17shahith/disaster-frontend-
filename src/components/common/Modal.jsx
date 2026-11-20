import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ open, title, subtitle, onClose, size = 'md', children, footer, closeOnBackdrop = true }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open-lock');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open-lock');
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="app-modal-backdrop" onMouseDown={(e) => closeOnBackdrop && e.target === e.currentTarget && onClose?.()}>
      <div className={`app-modal app-modal--${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="app-modal__header">
          <div>
            <h2 className="app-modal__title">{title}</h2>
            {subtitle && <p className="app-modal__subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        <div className="app-modal__body">{children}</div>
        {footer && <div className="app-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
