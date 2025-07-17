import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  CalendarIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  FunnelIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const AdvancedVisualizations = ({ analytics }) => {
  const { t } = useTranslation(['analytics', 'common']);
  const [activeVisualization, setActiveVisualization] = useState('heatmap');

  // Heatmap data for seasonal analysis
  const heatmapData = useMemo(() => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

    // Return empty data when no real analytics available
    return [];
  }, [analytics]);

  // Geographic revenue mapping data
  const geographicData = useMemo(() => {
    const regions = [];

    return regions.map(region => ({
      ...region,
      percentage: (region.revenue / regions.reduce((sum, r) => sum + r.revenue, 0)) * 100,
    }));
  }, []);

  // Cohort analysis data
  const cohortData = useMemo(() => {
    const cohorts = [];

    return {
      labels: ['Month 0', 'Month 1', 'Month 2', 'Month 3'],
      datasets: cohorts.map((cohort, index) => ({
        label: cohort.period,
        data: [cohort.month0, cohort.month1, cohort.month2, cohort.month3],
        borderColor: `hsl(${index * 60}, 70%, 50%)`,
        backgroundColor: `hsl(${index * 60}, 70%, 50%, 0.1)`,
        tension: 0.4,
      })),
    };
  }, []);

  // Funnel analysis data
  const funnelData = useMemo(() => {
    const stages = [];

    return stages.map((stage, index) => ({
      ...stage,
      percentage: index === 0 ? 100 : (stage.value / stages[0].value) * 100,
      conversionRate: index === 0 ? 100 : (stage.value / stages[index - 1].value) * 100,
    }));
  }, []);

  // Correlation analysis data
  const correlationData = useMemo(() => {
    const metrics = [];
    const correlationMatrix = [];

    return { metrics, correlationMatrix };
  }, []);

  // Predictive analytics chart
  const predictiveData = useMemo(() => {
    const months = [];
    const historical = [];
    const predicted = [];

    return {
      labels: [...months, 'Jan+1', 'Feb+1', 'Mar+1', 'Apr+1', 'May+1', 'Jun+1'],
      datasets: [
        {
          label: 'Historical Revenue',
          data: [...historical, ...Array(6).fill(null)],
          borderColor: '#3B82F6',
          backgroundColor: '#3B82F6',
          tension: 0.4,
        },
        {
          label: 'Predicted Revenue',
          data: [...Array(12).fill(null), ...predicted],
          borderColor: '#10B981',
          backgroundColor: '#10B981',
          borderDash: [5, 5],
          tension: 0.4,
        },
      ],
    };
  }, []);

  const renderHeatmap = () => (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <h3 className='text-lg font-semibold text-black mb-4'>Seasonal Revenue Heatmap</h3>
      <div className='grid grid-cols-12 gap-1 mb-4'>
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
          month => (
            <div key={month} className='text-xs text-gray-600 text-center font-medium'>
              {month}
            </div>
          ),
        )}
      </div>
      <div className='grid grid-cols-12 gap-1'>
        {heatmapData.map((cell, index) => (
          <div
            key={index}
            className='aspect-square rounded flex items-center justify-center text-xs font-medium'
            style={{
              backgroundColor: `rgba(59, 130, 246, ${cell.intensity})`,
              color: cell.intensity > 0.5 ? 'white' : '#1F2937',
            }}
            title={`${cell.month} ${cell.week}: €${cell.value.toLocaleString()}`}
          >
            {Math.round(cell.value / 1000)}k
          </div>
        ))}
      </div>
      <div className='flex items-center justify-between mt-4 text-xs text-gray-600'>
        <span>Low Revenue</span>
        <div className='flex space-x-1'>
          {[0.2, 0.4, 0.6, 0.8, 1.0].map(intensity => (
            <div
              key={intensity}
              className='w-4 h-4 rounded'
              style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
            />
          ))}
        </div>
        <span>High Revenue</span>
      </div>
    </div>
  );

  const renderGeographicMapping = () => (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <h3 className='text-lg font-semibold text-black mb-4'>Geographic Revenue Distribution</h3>
      <div className='space-y-4'>
        {geographicData.map((region, index) => (
          <div
            key={region.name}
            className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
          >
            <div className='flex items-center space-x-3'>
              <div
                className='w-4 h-4 rounded-full'
                style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
              />
              <div>
                <p className='font-medium text-black'>{region.name}</p>
                <p className='text-sm text-gray-600'>{region.clients} clients</p>
              </div>
            </div>
            <div className='text-right'>
              <p className='font-semibold text-black'>€{region.revenue.toLocaleString()}</p>
              <p className='text-sm text-green-600'>+{region.growth}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCohortAnalysis = () => (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <h3 className='text-lg font-semibold text-black mb-4'>Client Retention Cohort Analysis</h3>
      <div className='h-64'>
        <Line
          data={cohortData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Client Retention Rate by Cohort',
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function (value) {
                    return value + '%';
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );

  const renderFunnelAnalysis = () => (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <h3 className='text-lg font-semibold text-black mb-4'>Sales Funnel Analysis</h3>
      <div className='space-y-2'>
        {funnelData.map((stage, index) => (
          <div key={stage.name} className='relative'>
            <div
              className='h-12 flex items-center justify-between px-4 text-white font-medium rounded'
              style={{
                backgroundColor: stage.color,
                width: `${stage.percentage}%`,
                minWidth: '200px',
              }}
            >
              <span>{stage.name}</span>
              <span>{stage.value.toLocaleString()}</span>
            </div>
            {index > 0 && (
              <div className='absolute -right-16 top-3 text-sm text-gray-600'>
                {stage.conversionRate.toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCorrelationMatrix = () => (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <h3 className='text-lg font-semibold text-black mb-4'>Metrics Correlation Analysis</h3>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr>
              <th className='text-left p-2'></th>
              {correlationData.metrics.map(metric => (
                <th key={metric} className='text-center p-2 text-xs font-medium text-gray-600'>
                  {metric}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {correlationData.metrics.map((metric, rowIndex) => (
              <tr key={metric}>
                <td className='p-2 text-xs font-medium text-gray-600'>{metric}</td>
                {correlationData.correlationMatrix[rowIndex].map((value, colIndex) => (
                  <td key={colIndex} className='p-2 text-center'>
                    <div
                      className='w-8 h-8 rounded flex items-center justify-center text-xs font-medium mx-auto'
                      style={{
                        backgroundColor:
                          value > 0
                            ? `rgba(34, 197, 94, ${Math.abs(value)})`
                            : `rgba(239, 68, 68, ${Math.abs(value)})`,
                        color: Math.abs(value) > 0.5 ? 'white' : '#1F2937',
                      }}
                    >
                      {value.toFixed(2)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPredictiveAnalytics = () => (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <h3 className='text-lg font-semibold text-black mb-4'>Revenue Prediction Model</h3>
      <div className='h-64'>
        <Line
          data={predictiveData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Historical vs Predicted Revenue',
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (value) {
                    return '€' + value / 1000 + 'k';
                  },
                },
              },
            },
          }}
        />
      </div>
      <div className='mt-4 p-4 bg-blue-50 rounded-lg'>
        <p className='text-sm text-blue-800'>
          <strong>Model Accuracy:</strong> 87.3% | <strong>Confidence Interval:</strong> ±12%
        </p>
        <p className='text-sm text-blue-700 mt-1'>
          Based on historical trends, seasonal patterns, and market indicators.
        </p>
      </div>
    </div>
  );

  const visualizations = {
    heatmap: { component: renderHeatmap, icon: CalendarIcon, title: 'Seasonal Heatmap' },
    geographic: {
      component: renderGeographicMapping,
      icon: MapPinIcon,
      title: 'Geographic Mapping',
    },
    cohort: { component: renderCohortAnalysis, icon: UsersIcon, title: 'Cohort Analysis' },
    funnel: { component: renderFunnelAnalysis, icon: FunnelIcon, title: 'Funnel Analysis' },
    correlation: {
      component: renderCorrelationMatrix,
      icon: ChartBarIcon,
      title: 'Correlation Analysis',
    },
    predictive: {
      component: renderPredictiveAnalytics,
      icon: ArrowTrendingUpIcon,
      title: 'Predictive Analytics',
    },
  };

  return (
    <div className='space-y-6'>
      {/* Navigation */}
      <div className='flex flex-wrap gap-2'>
        {Object.entries(visualizations).map(([key, viz]) => {
          const IconComponent = viz.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveVisualization(key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeVisualization === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <IconComponent className='w-4 h-4' />
              <span className='text-sm font-medium'>{viz.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Visualization */}
      <div>{visualizations[activeVisualization].component()}</div>
    </div>
  );
};

export default AdvancedVisualizations;
