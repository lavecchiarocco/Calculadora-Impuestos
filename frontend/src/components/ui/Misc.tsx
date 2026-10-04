import { useState, type HTMLAttributes, type ReactNode, Children, cloneElement, isValidElement } from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export const Skeleton = ({ className, variant = 'text', width, height, ...props }: SkeletonProps) => {
  const variantStyles = {
    text: 'skeleton-text',
    card: 'skeleton-card',
    circular: 'skeleton rounded-full',
    rectangular: 'skeleton rounded-radius-md',
  };

  return (
    <div
      className={clsx('skeleton', variantStyles[variant], className)}
      style={{ width, height }}
      {...props}
    />
  );
};

export interface TabsProps {
  tabs: { id: string; label: string }[];
  defaultTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, defaultTab, onChange, className }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className={clsx('tabs', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-trigger`}
          className={clsx('tab', { 'tab-active': activeTab === tab.id })}
          onClick={() => {
            setActiveTab(tab.id);
            onChange(tab.id);
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export interface TooltipProps {
  content: ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const [visible, setVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-surface-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-surface-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-surface-900',
  };

  const child = Children.only(children);

  if (!isValidElement(child)) {
    return <>{child}</>;
  }

  return (
    <div className="relative inline-block" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)} onFocus={() => setVisible(true)} onBlur={() => setVisible(false)}>
      {cloneElement(child as React.ReactElement<any>, {
        'aria-describedby': visible ? 'tooltip-content' : undefined,
      })}
      {visible && (
        <div
          id="tooltip-content"
          role="tooltip"
          className={clsx(
            'absolute z-[600] w-max max-w-xs rounded-radius-md bg-surface-900 px-3 py-2 text-caption text-surface-50 shadow-lg',
            positionStyles[position]
          )}
        >
          {content}
          <div className={clsx('absolute', arrowStyles[position])} />
        </div>
      )}
    </div>
  );
};