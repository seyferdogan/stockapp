'use client';

import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'red' | 'blue' | 'green';
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'red',
  onConfirm,
  onCancel,
  isProcessing = false,
}: ConfirmModalProps) {
  useEscapeKey(onCancel, !isProcessing);

  const getConfirmButtonStyle = () => {
    switch (confirmColor) {
      case 'red':
        return {
          background: 'linear-gradient(135deg, var(--dusty-rose) 0%, var(--taupe) 100%)',
          color: 'var(--text-inverse)'
        };
      case 'blue':
        return {
          background: 'var(--info)',
          color: 'var(--text-inverse)'
        };
      case 'green':
        return {
          background: 'linear-gradient(135deg, var(--sage-green) 0%, var(--slate) 100%)',
          color: 'var(--text-inverse)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, var(--dusty-rose) 0%, var(--taupe) 100%)',
          color: 'var(--text-inverse)'
        };
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ 
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="rounded-2xl max-w-md w-full p-8 animate-fade-in"
        style={{
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        <h3 
          className="text-xl font-bold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
        <p 
          className="mb-6 whitespace-pre-line leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {message}
        </p>
        
        <div className="flex flex-col md:flex-row md:justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 md:flex-initial px-6 py-3 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            style={{
              background: 'var(--surface-hover)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)'
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 md:flex-initial px-6 py-3 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            style={getConfirmButtonStyle()}
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

