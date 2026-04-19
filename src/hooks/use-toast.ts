'use client';

type ToastOptions = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

function emitToast({ title, description, variant }: ToastOptions): void {
  const message = [title, description].filter(Boolean).join('\n');

  if (variant === 'destructive') {
    console.error(message);
    if (typeof window !== 'undefined') {
      window.alert(message);
    }
    return;
  }

  console.info(message);
}

export function useToast() {
  return {
    toast: emitToast,
  };
}
