import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * Voice Command Chart Component
 * Displays command usage patterns over time
 */
export default function VoiceCommandChart({ data }) {
  const chartData = useMemo(() => {
    if (!data?.commands || data.commands.length === 0) {
      return [];
    }

    // Group commands by hour for the last 24 hours or by day for longer periods
    const commands = data.commands;
    const now = new Date();
    const timeGroups = {};

    // Determine grouping strategy based on data range
    const oldestCommand = new Date(commands[0]?.timestamp);
    const timeDiff = now - oldestCommand;
    const isRecentData = timeDiff <= 24 * 60 * 60 * 1000; // Less than 24 hours

    commands.forEach(command => {
      const date = new Date(command.timestamp);
      let groupKey;

      if (isRecentData) {
        // Group by hour for recent data
        groupKey = `${date.getHours()}:00`;
      } else {
        // Group by day for older data
        groupKey = date.toLocaleDateString();
      }

      if (!timeGroups[groupKey]) {
        timeGroups[groupKey] = {
          time: groupKey,
          commands: 0,
          successful: 0,
          failed: 0
        };
      }

      timeGroups[groupKey].commands++;
      if (command.success !== false) {
        timeGroups[groupKey].successful++;
      } else {
        timeGroups[groupKey].failed++;
      }
    });

    // Convert to array and sort by time
    return Object.values(timeGroups).sort((a, b) => {
      if (isRecentData) {
        // Sort by hour
        const hourA = parseInt(a.time.split(':')[0]);
        const hourB = parseInt(b.time.split(':')[0]);
        return hourA - hourB;
      } else {
        // Sort by date
        return new Date(a.time) - new Date(b.time);
      }
    });
  }, [data]);

  const commandsByAction = useMemo(() => {
    if (!data?.commands || data.commands.length === 0) {
      return [];
    }

    const actionCounts = {};
    data.commands.forEach(command => {
      const action = command.action || 'unknown';
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 actions
  }, [data]);

  if (!data?.commands || data.commands.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Command Usage Over Time</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No command data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Commands Over Time */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Command Usage Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value, name) => [value, name === 'commands' ? 'Total Commands' : name]}
              />
              <Line 
                type="monotone" 
                dataKey="commands" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="successful" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="failed" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Total Commands</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Successful</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Failed</span>
          </div>
        </div>
      </div>

      {/* Commands by Action Type */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Commands by Action Type</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={commandsByAction} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="action" 
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                formatter={(value) => [value, 'Commands']}
                labelFormatter={(label) => `Action: ${label}`}
              />
              <Bar 
                dataKey="count" 
                fill="#3B82F6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}