'use client';
import { toast as sonnerToast } from 'sonner';

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  return {
    toast: (options: ToastOptions) => {
      if (options.variant === 'destructive') {
        sonnerToast.error(options.title || '', {
          description: options.description,
        });
      } else {
        sonnerToast.success(options.title || '', {
          description: options.description,
        });
      }
    },
    dismiss: sonnerToast.dismiss,
  };
}
