import React from 'react';
import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Cargando...',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="loading-spinner-container">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};
