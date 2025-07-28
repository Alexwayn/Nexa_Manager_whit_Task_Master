import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

/**
 * Voice Failure Chart Component
 * Displays recognition failure patterns and error types
 */
export default function VoiceFailureChart({ data }) {
  const failuresByType = useMemo(() => {
    if (!data?.failures || data.failures.length === 0) {
      return [];
    }

    const typeCounts = {};
    data.failures.forEach(failure => {
      const type = failure.errorType || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const failuresOverTime = useMemo(() => {
    if (!data?.failures || data.failures.length === 0) {
      return [];
    }

    // Group failures by hour for the last 24 hours or by day for longer periods
    const failures = data.failures;
    const now = new Date();
    const timeGroups = {};

    // Determine grouping strategy based on data range
    const oldestFailure = new Date(failures[0]?.timestamp);
    const timeDiff = now - oldestFailure;
    const isRecentData = timeDiff <= 24 * 60 * 60 * 1000; // Less than 24 hours

    failures.forEach(failure => {
      const date = new Date(failure.timestamp);
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
          failures: 0,
          lowConfidence: 0,
          networkError: 0,
          noSpeech: 0,
          other: 0
        };
      }

      timeGroups[groupKey].failures++;
      
      // Categorize failure types
      const errorType = failure.errorType || 'other';
      if (errorType.includes('confidence') || failure.confidence < 0.5) {
        timeGroups[groupKey].lowConfidence++;
      } else if (errorType.includes('network') || errorType.includes('connection')) {
        timeGroups[groupKey].networkError++;
      } else if (errorType.includes('no-speech') || errorType.includes('silence')) {
        timeGroups[groupKey].noSpeech++;
      } else {
        timeGroups[groupKey].other++;
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

  const confidenceDistribution = useMemo(() => {
    if (!data?.failures || data.failures.length === 0) {
      return [];
    }

    const confidenceRanges = {
      '0.0-0.2': 0,
      '0.2-0.4': 0,
      '0.4-0.6': 0,
      '0.6-0.8': 0,
      '0.8-1.0': 0
    };

    data.failures.forEach(failure => {
      const confidence = failure.confidence || 0;
      if (confidence < 0.2) {
        confidenceRanges['0.0-0.2']++;
      } else if (confidence < 0.4) {
        confidenceRanges['0.2-0.4']++;
      } else if (confidence < 0.6) {
        confidenceRanges['0.4-0.6']++;
      } else if (confidence < 0.8) {
        confidenceRanges['0.6-0.8']++;
      } else {
        confidenceRanges['0.8-1.0']++;
      }
    });

    return Object.entries(confidenceRanges)
      .map(([range, count]) => ({ range, count }))
      .filter(item => item.count > 0);
  }, [data]);

  // Colors for pie chart
  const COLORS = ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'];

  if (!data?.failures || data.failures.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recognition Failures Analysis</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No failure data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Failure Types Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Failure Types Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={failuresByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {failuresByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Failures']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Score Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confidence Score Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Confidence Range', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [value, 'Failures']}
                  labelFormatter={(label) => `Confidence: ${label}`}
                />
                <Bar 
                  dataKey="count" 
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Failures Over Time */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Failures Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={failuresOverTime}>
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
              />
              <Bar 
                dataKey="lowConfidence" 
                stackId="a" 
                fill="#EF4444" 
                name="Low Confidence"
              />
              <Bar 
                dataKey="networkError" 
                stackId="a" 
                fill="#F97316" 
                name="Network Error"
              />
              <Bar 
                dataKey="noSpeech" 
                stackId="a" 
                fill="#EAB308" 
                name="No Speech"
              />
              <Bar 
                dataKey="other" 
                stackId="a" 
                fill="#6B7280" 
                name="Other"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Low Confidence</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Network Error</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-gray-600">No Speech</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Other</span>
          </div>
        </div>
      </div>

      {/* Failure Details Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Failures</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recognized Text
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error Message
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.failures.slice(-10).reverse().map((failure) => (
                <tr key={failure.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(failure.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {failure.errorType || 'unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {failure.recognizedText || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {failure.confidence ? `${(failure.confidence * 100).toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {failure.errorMessage || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}