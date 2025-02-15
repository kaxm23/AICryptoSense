import React from 'react';
import { ArrowUpRight, ArrowDownRight, LineChart, BarChart } from 'lucide-react';

interface MetricData {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  chart: 'line' | 'bar';
}

interface MetricsGridProps {
  metricsData: MetricData[];
}

const MetricsGrid = React.memo(({ metricsData }: MetricsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {metricsData.map((metric, index) => (
        <div key={index} className="bg-gray-800/50 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs">{metric.title}</p>
              <p className="text-lg font-bold mt-0.5 sm:mt-1">{metric.value}</p>
            </div>
            <metric.icon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-1.5 flex items-center">
            {metric.positive ? (
              <ArrowUpRight className="h-3 w-3 text-green-400 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-400 mr-1" />
            )}
            <span className={`text-xs ${metric.positive ? 'text-green-400' : 'text-red-400'}`}>
              {metric.change}
            </span>
          </div>
          <div className="mt-2 h-10 sm:h-12 bg-gray-700/50 rounded-lg">
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              {metric.chart === 'line' ? <LineChart className="h-4 w-4" /> : <BarChart className="h-4 w-4" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

MetricsGrid.displayName = 'MetricsGrid';
export default MetricsGrid;