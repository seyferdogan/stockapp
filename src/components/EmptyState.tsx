'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = '📦',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div 
      className="rounded-2xl p-16 text-center"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="text-7xl mb-6 opacity-80">{icon}</div>
      <h3 
        className="text-2xl font-bold mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <p 
        className="mb-8 max-w-md mx-auto leading-relaxed"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-8 py-3 font-semibold rounded-xl transition-all hover:shadow-md"
          style={{
            background: 'linear-gradient(135deg, var(--sage-green) 0%, var(--slate) 100%)',
            color: 'var(--text-inverse)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

