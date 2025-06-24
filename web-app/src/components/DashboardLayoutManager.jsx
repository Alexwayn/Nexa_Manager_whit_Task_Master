import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import AdvancedTimePeriodSelector from '@components/AdvancedTimePeriodSelector';

// Import react-grid-layout
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardLayoutManager = ({
  children,
  onLayoutChange,
  onTimePeriodChange,
  selectedPeriod = 'monthly',
  dateRange,
}) => {
  const { t } = useTranslation('dashboard');

  const defaultWidgets = useMemo(
    () => [
      {
        id: 'revenue-overview',
        title: t('layoutManager.revenueOverview'),
        component: 'RevenueOverview',
        enabled: true,
        resizable: true,
        minW: 2,
        minH: 2,
      },
      {
        id: 'expense-breakdown',
        title: t('layoutManager.expenseBreakdown'),
        component: 'ExpenseBreakdown',
        enabled: true,
        resizable: true,
        minW: 2,
        minH: 2,
      },
      {
        id: 'kpi-metrics',
        title: t('layoutManager.kpiMetrics'),
        component: 'KPIMetrics',
        enabled: true,
        resizable: true,
        minW: 4,
        minH: 1,
      },
      {
        id: 'cash-flow',
        title: t('layoutManager.cashFlow'),
        component: 'CashFlow',
        enabled: true,
        resizable: true,
        minW: 3,
        minH: 2,
      },
      {
        id: 'client-analytics',
        title: t('layoutManager.clientAnalytics'),
        component: 'ClientAnalytics',
        enabled: true,
        resizable: true,
        minW: 2,
        minH: 2,
      },
      {
        id: 'forecast',
        title: t('layoutManager.forecast'),
        component: 'Forecast',
        enabled: false,
        resizable: true,
        minW: 3,
        minH: 2,
      },
    ],
    [t],
  );

  const defaultLayouts = {
    lg: [
      { i: 'kpi-metrics', x: 0, y: 0, w: 12, h: 2 },
      { i: 'revenue-overview', x: 0, y: 2, w: 6, h: 4 },
      { i: 'expense-breakdown', x: 6, y: 2, w: 6, h: 4 },
      { i: 'cash-flow', x: 0, y: 6, w: 8, h: 4 },
      { i: 'client-analytics', x: 8, y: 6, w: 4, h: 4 },
      { i: 'forecast', x: 0, y: 10, w: 12, h: 4 },
    ],
    md: [
      { i: 'kpi-metrics', x: 0, y: 0, w: 10, h: 2 },
      { i: 'revenue-overview', x: 0, y: 2, w: 5, h: 4 },
      { i: 'expense-breakdown', x: 5, y: 2, w: 5, h: 4 },
      { i: 'cash-flow', x: 0, y: 6, w: 10, h: 4 },
      { i: 'client-analytics', x: 0, y: 10, w: 5, h: 4 },
      { i: 'forecast', x: 5, y: 10, w: 5, h: 4 },
    ],
    sm: [
      { i: 'kpi-metrics', x: 0, y: 0, w: 6, h: 2 },
      { i: 'revenue-overview', x: 0, y: 2, w: 6, h: 4 },
      { i: 'expense-breakdown', x: 0, y: 6, w: 6, h: 4 },
      { i: 'cash-flow', x: 0, y: 10, w: 6, h: 4 },
      { i: 'client-analytics', x: 0, y: 14, w: 6, h: 4 },
      { i: 'forecast', x: 0, y: 18, w: 6, h: 4 },
    ],
  };

  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard-layouts');
      return saved ? JSON.parse(saved) : defaultLayouts;
    } catch (error) {
      console.error('Error parsing layouts from localStorage:', error);
      return defaultLayouts;
    }
  });

  const [widgets, setWidgets] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('dashboard-widget-settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};

      // Mergia le impostazioni salvate (solo 'enabled') con i widget di default
      return defaultWidgets.map((widget) => ({
        ...widget,
        enabled: settings[widget.id] !== undefined ? settings[widget.id].enabled : widget.enabled,
      }));
    } catch (error) {
      console.error('Error applying widget settings from localStorage:', error);
      return defaultWidgets;
    }
  });

  const [showLayoutManager, setShowLayoutManager] = useState(false);

  const saveLayouts = useCallback((newLayouts) => {
    localStorage.setItem('dashboard-layouts', JSON.stringify(newLayouts));
    setLayouts(newLayouts);
  }, []);

  const saveWidgets = useCallback((newWidgets) => {
    // Salva solo ID e stato 'enabled'
    const settingsToSave = newWidgets.reduce((acc, widget) => {
      acc[widget.id] = { enabled: widget.enabled };
      return acc;
    }, {});
    localStorage.setItem('dashboard-widget-settings', JSON.stringify(settingsToSave));
    setWidgets(newWidgets);
  }, []);

  const handleLayoutChange = useCallback(
    (layout, allLayouts) => {
      saveLayouts(allLayouts);
      if (onLayoutChange) {
        onLayoutChange(layout, allLayouts);
      }
    },
    [onLayoutChange, saveLayouts],
  );

  const toggleWidget = useCallback(
    (widgetId) => {
      const newWidgets = widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget,
      );
      saveWidgets(newWidgets);
    },
    [widgets, saveWidgets],
  );

  const resetLayout = useCallback(() => {
    if (window.confirm(t('layoutManager.confirmReset'))) {
      saveLayouts(defaultLayouts);
      saveWidgets(defaultWidgets);
    }
  }, [t, saveLayouts, saveWidgets, defaultLayouts, defaultWidgets]);

  const enabledWidgets = useMemo(() => widgets.filter((widget) => widget.enabled), [widgets]);

  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('layoutManager.title')}</h1>
              <p className="text-sm text-gray-600">{t('layoutManager.subtitle')}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <AdvancedTimePeriodSelector
                selectedPeriod={selectedPeriod}
                dateRange={dateRange}
                onPeriodChange={onTimePeriodChange}
                className="w-full sm:w-auto"
              />

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowLayoutManager(!showLayoutManager)}
                  className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    showLayoutManager ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                  {t('layoutManager.layout')}
                </button>

                <button
                  onClick={resetLayout}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  {t('layoutManager.reset')}
                </button>
              </div>
            </div>
          </div>

          {showLayoutManager && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                {t('layoutManager.widgetManager')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {widget.title}
                    </span>
                    <button
                      onClick={() => toggleWidget(widget.id)}
                      className={`ml-2 p-1 rounded ${
                        widget.enabled
                          ? 'text-green-600 hover:text-green-800'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {widget.enabled ? (
                        <EyeIcon className="h-4 w-4" />
                      ) : (
                        <EyeSlashIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={breakpoints}
            cols={cols}
            rowHeight={30}
            onLayoutChange={handleLayoutChange}
            isDraggable
            isResizable
            draggableHandle=".drag-handle"
          >
            {enabledWidgets.map((widget) => (
              <div
                key={widget.id}
                data-grid={{
                  w: widget.w || 2,
                  h: widget.h || 2,
                  x: widget.x || 0,
                  y: widget.y || 0,
                  minW: widget.minW || 1,
                  minH: widget.minH || 1,
                  isResizable: widget.resizable,
                }}
                className="bg-white rounded-lg shadow-md"
              >
                {React.cloneElement(
                  React.Children.toArray(children).find(
                    (child) => child.props.id === widget.id,
                  ) || <div></div>,
                  {
                    title: widget.title,
                  },
                )}
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayoutManager;
