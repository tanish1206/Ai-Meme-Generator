import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}

const Card = ({ hover = false, glass = false, className = '', children, ...props }: CardProps) => {
  const baseStyles = 'rounded-2xl p-4 transition-all duration-300';
  const hoverStyles = hover ? 'card-hover cursor-pointer' : '';
  const glassStyles = glass ? 'glass-effect' : 'bg-gray-800 shadow-lg';

  return (
    <div className={`${baseStyles} ${glassStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
