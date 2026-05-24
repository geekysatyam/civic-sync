import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    {children}
  </NextThemesProvider>
);

export default ThemeProvider;
