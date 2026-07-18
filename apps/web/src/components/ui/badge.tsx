type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  brand: 'bg-brand-100 text-brand-700',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ variant = 'default', size = 'md', children, className = '' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    DRAFT: { variant: 'default', label: 'Draft' },
    PROCESSING: { variant: 'warning', label: 'Processing' },
    READY: { variant: 'info', label: 'Ready' },
    PUBLISHED: { variant: 'success', label: 'Published' },
    ARCHIVED: { variant: 'error', label: 'Archived' },
    FAILED: { variant: 'error', label: 'Failed' },
  };
  const config = map[status] || { variant: 'default' as BadgeVariant, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function TryOnBadge({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <Badge variant="brand" size="sm">
      TRY ON
    </Badge>
  );
}
