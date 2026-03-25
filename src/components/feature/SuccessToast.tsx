import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function SuccessToast({ message, isVisible, onClose }: SuccessToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="backdrop-blur-xl bg-gradient-to-r from-violet-500/90 to-purple-600/90 rounded-2xl px-6 py-4 border border-white/20 shadow-2xl shadow-violet-500/30 flex items-center space-x-3">
        <div className="w-6 h-6 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <p className="text-white font-medium text-sm">{message}</p>
      </div>
    </div>
  );
}
