import { BadgeCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  size?: 'sm' | 'md';
  className?: string;
};

const VerifiedCitizenBadge = ({ size = 'sm', className = '' }: Props) => {
  const iconCls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex shrink-0 text-sky-600 dark:text-sky-400 ${className}`}
          aria-label="Phone verified"
        >
          <BadgeCheck className={iconCls} strokeWidth={2.5} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        Phone verified — trusted reporter
      </TooltipContent>
    </Tooltip>
  );
};

export default VerifiedCitizenBadge;
