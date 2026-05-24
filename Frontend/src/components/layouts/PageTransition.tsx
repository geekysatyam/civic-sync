import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const { key } = useLocation();
  return (
    <div key={key} className="animate-in fade-in-0 duration-200">
      {children}
    </div>
  );
}
