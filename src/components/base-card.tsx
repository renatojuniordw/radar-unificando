'use client';

interface Props {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
}

export function BaseCard({ title, children, variant = 'default' }: Props) {
  const variantStyles = {
    default: {},
    highlight: { borderLeft: '4px solid #ccff00' },
    success: { borderLeft: '4px solid #16a34a' },
    warning: { borderLeft: '4px solid #f59e0b' },
  };
  
  return (
    <div 
      className="card-brutalist" 
      style={{ 
        padding: 24, 
        marginBottom: 24,
        ...variantStyles[variant]
      }}
    >
      <h3 style={{ 
        fontWeight: 900, 
        textTransform: 'uppercase', 
        letterSpacing: '-0.01em', 
        fontSize: '0.9rem', 
        margin: '0 0 16px' 
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
