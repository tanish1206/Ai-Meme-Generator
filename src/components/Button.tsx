import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50',
      secondary: 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50',
      accent: 'btn-gradient text-white shadow-lg',
      outline: 'border-2 border-purple-600 text-purple-400 hover:bg-purple-600/10'
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
