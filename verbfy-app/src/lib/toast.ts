// Toast implementation that integrates with the existing Toast component system
import { toast } from '../components/common/Toast';

export const toastError = (message: string) => {
  toast.error(message);
};

export const toastSuccess = (message: string) => {
  toast.success(message);
};

export const toastWarning = (message: string) => {
  toast.warning(message);
};

export const toastInfo = (message: string) => {
  toast.info(message);
}; 