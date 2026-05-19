import { BaseColumn } from "./BaseColumn";

export interface BadgeColumn extends BaseColumn {
  type: 'badge';
  badgeMap: Record<string, 'success' | 'warning' | 'danger'>;
}