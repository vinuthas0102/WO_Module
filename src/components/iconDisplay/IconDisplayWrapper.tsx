import React from 'react';
import { IconDisplayConfig } from '../../types';
import DropdownMenuDisplay from './DropdownMenuDisplay';
import CarouselDisplay from './CarouselDisplay';
import GridDisplay from './GridDisplay';
import HorizontalToolbarDisplay from './HorizontalToolbarDisplay';
import FloatingActionDisplay from './FloatingActionDisplay';
import VerticalSidebarDisplay from './VerticalSidebarDisplay';
import { UserPreferencesService } from '../../services/userPreferencesService';

interface IconDisplayWrapperProps extends IconDisplayConfig {
  loading?: boolean;
}

const IconDisplayWrapper: React.FC<IconDisplayWrapperProps> = ({
  actions,
  categories,
  preferences,
  triggerButtonClassName,
  position = 'top-right',
  maxVisibleActions,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="inline-block">
        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!actions || actions.length === 0) {
    return null;
  }

  const displayPrefs = preferences ?? UserPreferencesService.getDefaultPreferences();

  const validActions = actions.filter(action => {
    if (!action || !action.icon || typeof action.action !== 'function') {
      console.warn('Invalid action detected:', action);
      return false;
    }
    return true;
  });

  if (validActions.length === 0) {
    console.warn('No valid actions to display');
    return null;
  }

  const visibleActions = maxVisibleActions
    ? validActions.slice(0, maxVisibleActions)
    : validActions;

  const commonProps = {
    actions: visibleActions,
    iconSize: displayPrefs.iconSize,
    showLabels: displayPrefs.showLabels,
    groupByCategory: displayPrefs.groupByCategory,
    animationEnabled: displayPrefs.animationEnabled
  };

  switch (displayPrefs.iconDisplayType) {
    case 'carousel':
      return (
        <CarouselDisplay
          {...commonProps}
          triggerButtonClassName={triggerButtonClassName}
        />
      );

    case 'grid':
      return (
        <GridDisplay
          {...commonProps}
          triggerButtonClassName={triggerButtonClassName}
        />
      );

    case 'horizontal_toolbar':
      return <HorizontalToolbarDisplay {...commonProps} />;

    case 'floating_action':
      return <FloatingActionDisplay {...commonProps} />;

    case 'vertical_sidebar':
      return (
        <VerticalSidebarDisplay
          {...commonProps}
          triggerButtonClassName={triggerButtonClassName}
        />
      );

    case 'dropdown_menu':
    default:
      return (
        <DropdownMenuDisplay
          {...commonProps}
          triggerButtonClassName={triggerButtonClassName}
        />
      );
  }
};

export default IconDisplayWrapper;
