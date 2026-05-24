import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  className?: string;
  /** Light icon on dark hero backgrounds */
  variant?: 'default' | 'on-dark';
};

const ThemeToggle = ({ className, variant = 'default' }: ThemeToggleProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={cn('h-9 w-9', className)} aria-hidden>
        <span className="sr-only">Theme</span>
      </Button>
    );
  }

  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-9 w-9 rounded-full',
        variant === 'on-dark'
          ? 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

export default ThemeToggle;
