import { Flame, Droplets, TreePine, Zap, Shield, Trash2, AlertTriangle, type LucideIcon } from 'lucide-react';
import type { IssueCategory } from '@/types';

const map: Record<IssueCategory, LucideIcon> = {
  roads: Flame,
  water: Droplets,
  parks: TreePine,
  electricity: Zap,
  sanitation: Trash2,
  public_safety: Shield,
};

export function getCategoryIcon(category: string): LucideIcon {
  return map[category as IssueCategory] ?? AlertTriangle;
}
