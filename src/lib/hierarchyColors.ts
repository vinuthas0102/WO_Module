export interface HierarchyColorScheme {
  background: string;
  backgroundHover: string;
  border: string;
  borderHover: string;
  text: string;
  badge: string;
  statusCompleted: string;
  statusWIP: string;
  statusNotStarted: string;
  statusClosed: string;
  accent: string;
  gradient: string;
}

export interface WorkflowHierarchyLevel {
  level: 1 | 2 | 3;
  label: string;
  description: string;
}

const level1Colors: HierarchyColorScheme = {
  background: 'bg-blue-50',
  backgroundHover: 'hover:bg-blue-100',
  border: 'border-blue-300',
  borderHover: 'hover:border-blue-400',
  text: 'text-blue-900',
  badge: 'bg-blue-200 text-blue-800',
  statusCompleted: 'bg-green-100 text-green-800 border-green-400',
  statusWIP: 'bg-amber-100 text-amber-800 border-amber-400',
  statusNotStarted: 'bg-gray-100 text-gray-800 border-gray-400',
  statusClosed: 'bg-slate-100 text-slate-800 border-slate-400',
  accent: 'bg-blue-600',
  gradient: 'bg-gradient-to-r from-blue-50 to-blue-100',
};

const level2Colors: HierarchyColorScheme = {
  background: 'bg-emerald-50',
  backgroundHover: 'hover:bg-emerald-100',
  border: 'border-emerald-300',
  borderHover: 'hover:border-emerald-400',
  text: 'text-emerald-900',
  badge: 'bg-emerald-200 text-emerald-800',
  statusCompleted: 'bg-green-50 text-green-700 border-green-300',
  statusWIP: 'bg-amber-50 text-amber-700 border-amber-300',
  statusNotStarted: 'bg-gray-50 text-gray-700 border-gray-300',
  statusClosed: 'bg-slate-50 text-slate-700 border-slate-300',
  accent: 'bg-emerald-600',
  gradient: 'bg-gradient-to-r from-emerald-50 to-emerald-100',
};

const level3Colors: HierarchyColorScheme = {
  background: 'bg-amber-50',
  backgroundHover: 'hover:bg-amber-100',
  border: 'border-amber-300',
  borderHover: 'hover:border-amber-400',
  text: 'text-amber-900',
  badge: 'bg-amber-200 text-amber-800',
  statusCompleted: 'bg-green-50 text-green-600 border-green-200',
  statusWIP: 'bg-amber-50 text-amber-600 border-amber-200',
  statusNotStarted: 'bg-gray-50 text-gray-600 border-gray-200',
  statusClosed: 'bg-slate-50 text-slate-600 border-slate-200',
  accent: 'bg-amber-600',
  gradient: 'bg-gradient-to-r from-amber-50 to-amber-100',
};

export const getHierarchyLevel = (
  level_1?: number,
  level_2?: number,
  level_3?: number
): 1 | 2 | 3 => {
  if (level_3 && level_3 > 0) return 3;
  if (level_2 && level_2 > 0) return 2;
  return 1;
};

export const getHierarchyColors = (
  level_1?: number,
  level_2?: number,
  level_3?: number
): HierarchyColorScheme => {
  const level = getHierarchyLevel(level_1, level_2, level_3);

  switch (level) {
    case 1:
      return level1Colors;
    case 2:
      return level2Colors;
    case 3:
      return level3Colors;
    default:
      return level1Colors;
  }
};

export const getStatusBadgeColor = (
  status: string,
  level_1?: number,
  level_2?: number,
  level_3?: number
): string => {
  const colors = getHierarchyColors(level_1, level_2, level_3);

  switch (status) {
    case 'COMPLETED':
      return colors.statusCompleted;
    case 'WIP':
      return colors.statusWIP;
    case 'CLOSED':
      return colors.statusClosed;
    case 'NOT_STARTED':
    default:
      return colors.statusNotStarted;
  }
};

export const getHierarchyLevelInfo = (
  level_1?: number,
  level_2?: number,
  level_3?: number
): WorkflowHierarchyLevel => {
  const level = getHierarchyLevel(level_1, level_2, level_3);

  switch (level) {
    case 1:
      return {
        level: 1,
        label: 'Main Task',
        description: 'Primary workflow step',
      };
    case 2:
      return {
        level: 2,
        label: 'Subtask',
        description: 'Secondary workflow step',
      };
    case 3:
      return {
        level: 3,
        label: 'Sub-subtask',
        description: 'Tertiary workflow step',
      };
    default:
      return {
        level: 1,
        label: 'Main Task',
        description: 'Primary workflow step',
      };
  }
};

export const getHierarchyIndentation = (
  level: 1 | 2 | 3
): string => {
  switch (level) {
    case 1:
      return 'ml-0';
    case 2:
      return 'ml-6';
    case 3:
      return 'ml-12';
    default:
      return 'ml-0';
  }
};

export const getHierarchyBorderStyle = (
  level: 1 | 2 | 3
): string => {
  switch (level) {
    case 1:
      return 'border-2';
    case 2:
      return 'border-2 border-l-4';
    case 3:
      return 'border border-l-4 border-dashed';
    default:
      return 'border-2';
  }
};

export const getHierarchyIcon = (
  level: 1 | 2 | 3
): string => {
  switch (level) {
    case 1:
      return '●';
    case 2:
      return '◆';
    case 3:
      return '▸';
    default:
      return '●';
  }
};

export const hierarchyColorLegend = [
  {
    level: 1 as const,
    color: 'bg-blue-300',
    label: 'Main Tasks',
    description: 'Primary workflow steps',
  },
  {
    level: 2 as const,
    color: 'bg-emerald-300',
    label: 'Subtasks',
    description: 'Secondary workflow steps',
  },
  {
    level: 3 as const,
    color: 'bg-amber-300',
    label: 'Sub-subtasks',
    description: 'Tertiary workflow steps',
  },
];
