import type { ComponentType } from 'react';

export type IconDisplayType = 'dropdown_menu' | 'carousel' | 'grid' | 'horizontal_toolbar' | 'floating_action' | 'vertical_sidebar';

export type IconSize = 'small' | 'medium' | 'large';

export type DisplayMode = 'card' | 'table' | 'list';

export interface UserDisplayPreferences {
  id: string;
  userId: string;
  iconDisplayType: IconDisplayType;
  iconSize: IconSize;
  showLabels: boolean;
  groupByCategory: boolean;
  animationEnabled: boolean;
  woDetailsDisplayType?: DisplayMode;
  mbookDisplayType?: DisplayMode;
  billsDisplayType?: DisplayMode;
  workflowDisplayType?: DisplayMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionCategory {
  id: string;
  label: string;
  order: number;
  color?: string;
}

export interface ActionIconDefinition {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  category?: string;
  requiredPermissions?: string[];
  color?: string;
  disabled?: boolean;
  tooltip?: string;
  shortcut?: string;
  subActions?: ActionIconDefinition[];
}

export interface IconDisplayConfig {
  actions: ActionIconDefinition[];
  categories?: ActionCategory[];
  preferences?: UserDisplayPreferences;
  triggerButtonClassName?: string;
  triggerButtonLabel?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  maxVisibleActions?: number;
}

export interface ActionRegistryEntry {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  category: string;
  requiredRoles?: ('EMPLOYEE' | 'DO' | 'EO' | 'VENDOR' | 'FINANCE')[];
  color?: string;
  tooltip?: string;
}
