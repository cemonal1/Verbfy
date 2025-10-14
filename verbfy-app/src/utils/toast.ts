import { toast } from '@/components/common/Toast';

export const toastSuccess = (message: string, duration?: number) => {
  toast.success(message, duration);
};

export const toastError = (message: string, duration?: number) => {
  toast.error(message, duration);
};

export const toastWarning = (message: string, duration?: number) => {
  toast.warning(message, duration);
};

export const toastInfo = (message: string, duration?: number) => {
  toast.info(message, duration);
};

export { toast };