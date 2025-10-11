import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}

const Card = ({ hover = false, glass = false, className = '', children, ...props }: CardProps) => {
  const baseStyles = 'rounded-2xl p-6 transition-all duration-500 backdrop-blur-sm border border-gray-700/30';
  const hoverStyles = hover ? 'hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer' : '';
  const glassStyles = glass ? 'bg-gradient-to-br from-white/10 to-white/5' : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 shadow-xl';

  return (
    <div className={`${baseStyles} ${glassStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
