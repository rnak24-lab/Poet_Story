'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'like' | 'comment' | 'reward';
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastMessage['type'], message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICONS: Record<ToastMessage['type'], string> = {
  success: '✅',
  error: '😢',
  info: '💡',
  like: '❤️',
  comment: '💬',
  reward: '🎁',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastMessage['type'], message: string, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev.slice(-2), { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[100] pointer-events-none px-4 pt-[env(safe-area-inset-top,12px)]">
        <div className="flex flex-col gap-2 mt-3">
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onDone={() => removeToast(toast.id)} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: ToastMessage; onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDone, 300);
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast.duration, onDone]);

  const bgColor = {
    success: 'bg-sage-50 border-sage-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-cream-100 border-cream-300',
    like: 'bg-pink-50 border-pink-200',
    comment: 'bg-blue-50 border-blue-200',
    reward: 'bg-amber-50 border-amber-200',
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto ${bgColor} border rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 transition-all duration-300 ${
        visible && !exiting ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <span className="text-lg flex-shrink-0">{ICONS[toast.type]}</span>
      <p className="text-sm text-ink-600 flex-1 leading-snug">{toast.message}</p>
    </div>
  );
}
