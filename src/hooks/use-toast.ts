import { toast as sonnerToast } from 'sonner';

type ToastFunction = (message: string, options?: Record<string, unknown>) => void;

export const toast = {
  success: (message: string, options?: Record<string, unknown>) => sonnerToast.success(message, options),
  error: (message: string, options?: Record<string, unknown>) => sonnerToast.error(message, options),
  info: (message: string, options?: Record<string, unknown>) => sonnerToast.info(message, options),
  warning: (message: string, options?: Record<string, unknown>) => sonnerToast.warning(message, options),
} as const;

export const useToast = () => {
  return { 
    toast: (message: string, options?: Record<string, unknown>) => sonnerToast(message, options),
    ...toast 
  };
};
