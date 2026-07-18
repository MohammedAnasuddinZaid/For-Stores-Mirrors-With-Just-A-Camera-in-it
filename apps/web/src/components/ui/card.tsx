import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = true, padding = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-surface rounded-xl border border-gray-100
          ${hover ? 'hover:shadow-md hover:border-gray-200 transition-all duration-200' : 'shadow-xs'}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export function CardImage({ src, alt, aspectRatio = '4/5', className = '' }: {
  src: string; alt: string; aspectRatio?: string; className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`} style={{ aspectRatio }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
    </div>
  );
}

export function CardBody({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`${className}`}>{children}</div>;
}

export function CardTitle({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={`font-semibold text-text-primary ${className}`}>{children}</h3>;
}

export function CardText({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <p className={`text-sm text-text-secondary ${className}`}>{children}</p>;
}
