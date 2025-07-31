'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<'light' | 'dark', string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ReactNode;
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'Chart';

// Placeholder components for compatibility
const ChartTooltip = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const ChartTooltipContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const ChartLegend = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const ChartLegendContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => null;

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
