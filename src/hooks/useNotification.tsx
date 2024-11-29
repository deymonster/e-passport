// src/hooks/useNotification.tsx
import React from 'react'; // Убедитесь, что React импортирован для JSX
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export const useNotification = () => {
  const { toast } = useToast();

  const showNotification = ({ type, message, duration = 5000 }: NotificationOptions) => {
    const getIcon = () => {
      switch (type) {
        case 'success':
          return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'error':
          return <XCircle className="w-5 h-5 text-red-500" />;
        case 'info':
          return <Info className="w-5 h-5 text-blue-500" />;
        case 'warning':
          return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        default:
          return null;
      }
    };

    toast({
      duration,
      description: (
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span>{message}</span>
        </div>
      ),
    });
  };

  return { showNotification }; 
};
