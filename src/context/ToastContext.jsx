import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (type, message, title) => {
      const id = ++counter.current;
      setToasts((list) => [...list.slice(-4), { id, type, message, title }]);
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (msg, title = 'Success') => show('success', msg, title),
      error: (msg, title = 'Error') => show('error', msg, title),
      warning: (msg, title = 'Warning') => show('warning', msg, title),
      info: (msg, title = 'Information') => show('info', msg, title),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className={`app-toast app-toast--${t.type}`}>
              <Icon size={20} className="app-toast__icon" />
              <div className="app-toast__body">
                <strong>{t.title}</strong>
                <span>{t.message}</span>
              </div>
              <button type="button" className="icon-btn" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
