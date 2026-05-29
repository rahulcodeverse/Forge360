'use client';

import { useCallback, useState } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
}

let toastCount = 0;

const listeners: Array<(toasts: Toast[]) => void> = [];
let memoryToasts: Toast[] = [];

function dispatch(action: { type: 'ADD' | 'REMOVE'; toast?: Toast; id?: string }) {
  if (action.type === 'ADD' && action.toast) {
    memoryToasts = [action.toast, ...memoryToasts].slice(0, 5);
  } else if (action.type === 'REMOVE') {
    memoryToasts = memoryToasts.filter((t) => t.id !== action.id);
  }
  listeners.forEach((l) => l([...memoryToasts]));
}

export function toast(props: Omit<Toast, 'id'>) {
  const id = `toast-${++toastCount}`;
  dispatch({ type: 'ADD', toast: { ...props, id } });
  setTimeout(() => dispatch({ type: 'REMOVE', id }), 5000);
  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([...memoryToasts]);

  const subscribe = useCallback(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  useState(subscribe);

  return {
    toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: 'REMOVE', id }),
  };
}
