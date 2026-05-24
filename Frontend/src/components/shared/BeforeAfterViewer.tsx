import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  beforeLabel?: string;
  afterLabel?: string;
  hasAfter: boolean;
  beforeUrl?: string;
  afterUrl?: string;
}

const BeforeAfterViewer = ({
  beforeLabel = 'Before',
  afterLabel = 'After',
  hasAfter,
  beforeUrl,
  afterUrl,
}: Props) => {
  const [showAfter, setShowAfter] = useState(false);

  const isValidUrl = (src?: string) =>
    !!src && src !== '/placeholder.svg' && (src.startsWith('http') || src.startsWith('data:'));

  const showImg = showAfter && hasAfter && isValidUrl(afterUrl);
  const imgSrc = showImg ? afterUrl : (isValidUrl(beforeUrl) ? beforeUrl : undefined);

  return (
    <div className="relative rounded-xl overflow-hidden bg-muted border">
      <div
        className={`h-56 flex items-center justify-center transition-all duration-500 ${
          showAfter && hasAfter ? 'bg-gradient-to-br from-success/20 to-success/5' : 'bg-gradient-to-br from-muted to-muted-foreground/5'
        }`}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={showImg ? afterLabel : beforeLabel}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">
            {showAfter && hasAfter ? `✓ ${afterLabel}` : beforeLabel}
          </span>
        )}
      </div>

      {hasAfter && (
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => setShowAfter(!showAfter)}
          className="absolute top-3 right-3 gap-1.5 rounded-full shadow-md"
        >
          {showAfter ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showAfter ? 'Before' : 'After'}
        </Button>
      )}
    </div>
  );
};

export default BeforeAfterViewer;
