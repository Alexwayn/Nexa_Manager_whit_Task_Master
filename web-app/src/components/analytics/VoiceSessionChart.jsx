import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

/**
 * Voice Session Chart Component
 * Displays session analytics including duration, commands per session, and session patterns
 */
export default function VoiceSessionChart({ data }) {
  const sessionStats = useMemo(() => {
    if (!data?.sessions || data.sessions.length === 0) {
      return {
        sessionsByDuration: [],
        commandsPerSession: [],
        sessionsOverTime: [],
        averageSessionDuration: 0,
        totalSessions: 0,
        averageCommandsPerSession: 0
      };
    }

    const sessions = data.sessions;
    
    // Calculate session durations
    const sessionDurations = sessions.map(session => {
      const duration = session.endTime ? 
        (new Date(session.endTime) - new Date(session.startTime)) / 1000 : 0;
      return { ...session, duration };
    });

    // Group sessions by duration ranges
    const durationRanges = {
      '0-30s': 0,
      '30s-1m': 0,
      '1-3m': 0,
      '3-5m': 0,
      '5-10m': 0,
      '10m+': 0
    };

    sessionDurations.forEach(session => {
      const duration = session.duration;
      if (duration <= 30) {
        durationRanges['0-30s']++;
      } else if (duration <= 60) {
        durationRanges['30s-1m']++;
      } else if (duration <= 180) {
        durationRanges['1-3m']++;
      } else if (duration <= 300) {
        durationRanges['3-5m']++;
      } else if (duration <= 600) {
        durationRanges['5-10m']++;
      } else {
        durationRanges['10m+']++;
      }
    });

    const sessionsByDuration = Object.entries(durationRanges)
      .map(([range, count]) => ({ range, count }));

    // Group by commands per session
    const commandRanges = {
      '1': 0,
      '2-3': 0,
      '4-5': 0,
      '6-10': 0,
      '11-20': 0,
      '20+': 0
    };

    sessions.forEach(session => {
      const commandCount = session.commandCount || 0;
      if (commandCount === 1) {
        commandRanges['1']++;
      } else if (commandCount <= 3) {
        commandRanges['2-3']++;
      } else if (commandCount <= 5) {
        commandRanges['4-5']++;
      } else if (commandCount <= 10) {
        commandRanges['6-10']++;
      } else if (commandCount <= 20) {
        commandRanges['11-20']++;
      } else {
        commandRanges['20+']++;
      }
    });

    const commandsPerSession = Object.entries(commandRanges)
      .map(([range, count]) => ({ range, count }));

    // Sessions over time (by day)
    const sessionsByDay = {};
    sessions.forEach(session => {
      const date = new Date(session.startTime).toLocaleDateString();
      if (!sessionsByDay[date]) {
        sessionsByDay[date] = {
          date,
          sessions: 0,
          totalDuration: 0,
          totalCommands: 0
        };
      }
      sessionsByDay[date].sessions++;
      sessionsByDay[date].totalDuration += sessionDurations.find(s => s.id === session.id)?.duration || 0;
      sessionsByDay[date].totalCommands += session.commandCount || 0;
    });

    const sessionsOverTime = Object.values(sessionsByDay)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(day => ({
        ...day,
        avgDuration: day.sessions > 0 ? day.totalDuration / day.sessions : 0,
        avgCommands: day.sessions > 0 ? day.totalCommands / day.sessions : 0
      }));

    // Calculate averages
    const totalDuration = sessionDurations.reduce((sum, session) => sum + session.duration, 0);
    const totalCommands = sessions.reduce((sum, session) => sum + (session.commandCount || 0), 0);
    
    return {
      sessionsByDuration,
      commandsPerSession,
      sessionsOverTime,
      averageSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      totalSessions: sessions.length,
      averageCommandsPerSession: sessions.length > 0 ? totalCommands / sessions.length : 0
    };
  }, [data]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (!data?.sessions || data.sessions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Analytics</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No session data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Session Duration</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {Math.round(sessionStats.averageSessionDuration)}s
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Sessions</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {sessionStats.totalSessions}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Commands/Session</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {sessionStats.averageCommandsPerSession.toFixed(1)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Session Duration Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Duration Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sessionStats.sessionsByDuration}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {sessionStats.sessionsByDuration.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Sessions']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Commands Per Session Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Commands Per Session</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionStats.commandsPerSession}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Commands', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [value, 'Sessions']}
                  labelFormatter={(label) => `Commands: ${label}`}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sessions Over Time */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Activity Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sessionStats.sessionsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                label={{ value: 'Avg Duration (s)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value, name) => [
                  name === 'sessions' ? value : `${Math.round(value)}s`,
                  name === 'sessions' ? 'Sessions' : 'Avg Duration'
                ]}
              />
              <Bar 
                yAxisId="left"
                dataKey="sessions" 
                fill="#3B82F6" 
                name="sessions"
                opacity={0.7}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgDuration" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="avgDuration"
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sessions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commands
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Agent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.sessions.slice(-10).reverse().map((session) => {
                const duration = session.endTime ? 
                  Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000) : 
                  'Active';
                
                return (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(session.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof duration === 'number' ? `${duration}s` : duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.commandCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.endTime 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {session.endTime ? 'Completed' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {session.userAgent || 'Unknown'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}