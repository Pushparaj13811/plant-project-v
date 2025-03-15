import { toast as hookToast } from '@/hooks/use-toast';

export const toast = {
  success: (message: string) => {
    hookToast({
      title: "Success",
      description: message,
    });
  },
  error: (message: string) => {
    hookToast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  },
  info: (message: string) => {
    hookToast({
      title: "Info",
      description: message,
    });
  },
  warning: (message: string) => {
    hookToast({
      title: "Warning",
      description: message,
      variant: "destructive",
    });
  }
};

export default toast; 