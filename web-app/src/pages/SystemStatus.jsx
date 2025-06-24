import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  Zap,
  Database,
  Globe,
} from 'lucide-react';

const SystemStatus = () => {
  const { t, i18n } = useTranslation('systemStatus');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const services = [
    {
      name: t('services.apiCore.name'),
      status: 'operational',
      uptime: '99.98%',
      responseTime: '45ms',
      description: t('services.apiCore.description'),
      icon: <Zap className="h-6 w-6" />,
    },
    {
      name: t('services.database.name'),
      status: 'operational',
      uptime: '99.99%',
      responseTime: '12ms',
      description: t('services.database.description'),
      icon: <Database className="h-6 w-6" />,
    },
    {
      name: t('services.webApp.name'),
      status: 'operational',
      uptime: '99.97%',
      responseTime: '120ms',
      description: t('services.webApp.description'),
      icon: <Globe className="h-6 w-6" />,
    },
    {
      name: t('services.emailService.name'),
      status: 'operational',
      uptime: '99.95%',
      responseTime: '230ms',
      description: t('services.emailService.description'),
      icon: <Activity className="h-6 w-6" />,
    },
    {
      name: t('services.paymentGateway.name'),
      status: 'maintenance',
      uptime: '99.92%',
      responseTime: '180ms',
      description: t('services.paymentGateway.description'),
      icon: <CheckCircle className="h-6 w-6" />,
    },
    {
      name: t('services.fileStorage.name'),
      status: 'operational',
      uptime: '99.96%',
      responseTime: '85ms',
      description: t('services.fileStorage.description'),
      icon: <Database className="h-6 w-6" />,
    },
  ];

  const incidents = [
    {
      id: 1,
      title: t('incidents.plannedMaintenance'),
      status: 'in-progress',
      severity: 'low',
      startTime: '2024-01-20 02:00 UTC',
      description: t('incidents.plannedMaintenance'),
      updates: [
        {
          time: '2024-01-20 02:00 UTC',
          message: t('incidents.maintenanceStart'),
        },
      ],
    },
    {
      id: 2,
      title: t('incidents.apiSlowdown'),
      status: 'resolved',
      severity: 'medium',
      startTime: '2024-01-19 14:30 UTC',
      endTime: '2024-01-19 15:45 UTC',
      description: t('incidents.apiSlowdown'),
      updates: [
        {
          time: '2024-01-19 15:45 UTC',
          message: t('incidents.issueResolved'),
        },
        {
          time: '2024-01-19 15:00 UTC',
          message: t('incidents.causeIdentified'),
        },
        {
          time: '2024-01-19 14:30 UTC',
          message: t('incidents.slowdownReported'),
        },
      ],
    },
  ];

  const metrics = [
    { name: t('metrics.globalUptime'), value: '99.97%', trend: '+0.02%', color: 'text-green-600' },
    { name: t('metrics.avgResponseTime'), value: '112ms', trend: '-8ms', color: 'text-green-600' },
    { name: t('metrics.requestsPerMinute'), value: '1,247', trend: '+156', color: 'text-blue-600' },
    { name: t('metrics.activeUsers'), value: '2,341', trend: '+89', color: 'text-purple-600' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100';
      case 'degraded':
        return 'text-orange-600 bg-orange-100';
      case 'outage':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'operational':
        return t('services.status.operational');
      case 'maintenance':
        return t('services.status.maintenance');
      case 'degraded':
        return t('services.status.degraded');
      case 'outage':
        return t('services.status.outage');
      default:
        return t('services.status.unknown');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const overallStatus = services.every((s) => s.status === 'operational')
    ? 'operational'
    : services.some((s) => s.status === 'outage')
      ? 'outage'
      : 'degraded';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
            <p className="text-xl text-gray-600 mb-8">{t('header.subtitle')}</p>

            {/* Overall Status */}
            <div className="max-w-md mx-auto">
              <div
                className={`flex items-center justify-center space-x-3 px-6 py-4 rounded-lg ${getStatusColor(overallStatus)}`}
              >
                {getStatusIcon(overallStatus)}
                <span className="text-lg font-semibold">
                  {overallStatus === 'operational'
                    ? t('overallStatus.allOperational')
                    : overallStatus === 'outage'
                      ? t('overallStatus.serviceOutage')
                      : t('overallStatus.partiallyDegraded')}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {t('overallStatus.lastUpdate', { time: currentTime.toLocaleString(i18n.language) })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`text-sm font-medium ${metric.color}`}>{metric.trend}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Services Status */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('services.title')}</h2>
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            {services.map((service, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(service.status)}`}>
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${getStatusColor(service.status)}`}>
                      {getStatusText(service.status)}
                    </p>
                    <p className="text-xs text-gray-500">{service.uptime} uptime</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('incidents.title')}</h2>
          {incidents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">{t('incidents.noIncidents')}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {incidents.map((incident) => (
                <div key={incident.id} className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-gray-900">{incident.title}</h3>
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${getSeverityColor(
                          incident.severity,
                        )}`}
                      >
                        {t(`incidents.severity.${incident.severity}`)}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2">{incident.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
                      <span>{t(`incidents.status.${incident.status}`)}</span>
                      <span className="text-gray-300">|</span>
                      <span>{incident.startTime}</span>
                      {incident.endTime && (
                        <>
                          <span className="text-gray-300">→</span>
                          <span>{incident.endTime}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {incident.updates.length > 0 && (
                    <div className="bg-gray-50 px-6 py-4">
                      <h4 className="font-semibold text-gray-700 mb-2">{t('incidents.updates')}</h4>
                      <ul className="space-y-2">
                        {incident.updates.map((update, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <span className="text-gray-400 w-40 flex-shrink-0">{update.time}</span>
                            <p className="text-gray-600">{update.message}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
