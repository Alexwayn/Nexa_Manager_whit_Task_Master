import toast from 'react-hot-toast';

/**
 * Custom hook that wraps react-hot-toast to provide a consistent API
 * similar to shadcn/ui's useToast hook
 */
export const useToast = () => {
  const showToast = ({ title, description, variant = 'default', ...options }) => {
    const message = description ? `${title}\n${description}` : title;
    
    switch (variant) {
      case 'destructive':
        return toast.error(message, {
          duration: 4000,
          style: {
            background: '#ef4444',
            color: '#fff',
          },
          ...options,
        });
      case 'success':
        return toast.success(message, {
          duration: 3000,
          ...options,
        });
      default:
        return toast(message, {
          duration: 3000,
          ...options,
        });
    }
  };

  return {
    toast: showToast,
  };
};

export default useToast;
