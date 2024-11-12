// components/ui/button.d.ts
import { ButtonHTMLAttributes, RefAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

declare const Button: React.ForwardRefExoticComponent<
  ButtonProps & RefAttributes<HTMLButtonElement>
>;

export { Button };