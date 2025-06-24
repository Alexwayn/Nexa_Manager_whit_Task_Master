import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Code, Copy, Play, CheckCircle, AlertCircle, Key, Globe } from 'lucide-react';

const ApiReference = () => {
  const { t } = useTranslation('apiReference');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('auth');
  const [copiedCode, setCopiedCode] = useState('');

  const endpoints = [
    { id: 'auth', name: t('endpointsList.auth'), icon: '🔐' },
    { id: 'clients', name: t('endpointsList.clients'), icon: '👥' },
    { id: 'invoices', name: t('endpointsList.invoices'), icon: '📄' },
    { id: 'payments', name: t('endpointsList.payments'), icon: '💳' },
    { id: 'reports', name: t('endpointsList.reports'), icon: '📊' },
  ];

  const apiData = {
    auth: {
      title: t('api.auth.title'),
      description: t('api.auth.description'),
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/auth/login',
          description: t('api.auth.endpoints.login.description'),
          parameters: [
            {
              name: 'email',
              type: 'string',
              required: true,
              description: t('api.auth.endpoints.login.parameters.email'),
            },
            {
              name: 'password',
              type: 'string',
              required: true,
              description: t('api.auth.endpoints.login.parameters.password'),
            },
          ],
          example: `{
  "email": "user@example.com",
  "password": "password123"
}`,
          response: `{
  "success": true,
  "data": {
    "token": "jwt_access_token_example_here...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Mario Rossi"
    }
  }
}`,
        },
        {
          method: 'POST',
          path: '/api/v1/auth/refresh',
          description: t('api.auth.endpoints.refresh.description'),
          parameters: [
            {
              name: 'refresh_token',
              type: 'string',
              required: true,
              description: t('api.auth.endpoints.refresh.parameters.refresh_token'),
            },
          ],
          example: `{
  "refresh_token": "jwt_refresh_token_example_here..."
}`,
          response: `{
  "success": true,
  "data": {
    "token": "jwt_new_access_token_example_here...",
    "expires_in": 3600
  }
}`,
        },
      ],
    },
    clients: {
      title: t('api.clients.title'),
      description: t('api.clients.description'),
      endpoints: [
        {
          method: 'GET',
          path: '/api/v1/clients',
          description: t('api.clients.endpoints.getClients.description'),
          parameters: [
            {
              name: 'page',
              type: 'integer',
              required: false,
              description: t('api.clients.endpoints.getClients.parameters.page'),
            },
            {
              name: 'limit',
              type: 'integer',
              required: false,
              description: t('api.clients.endpoints.getClients.parameters.limit'),
            },
            {
              name: 'search',
              type: 'string',
              required: false,
              description: t('api.clients.endpoints.getClients.parameters.search'),
            },
          ],
          example: 'GET /api/v1/clients?page=1&limit=10&search=mario',
          response: `{
  "success": true,
  "data": {
    "clients": [
      {
        "id": 1,
        "name": "Mario Rossi",
        "email": "mario@example.com",
        "phone": "+39 123 456 789",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 48
    }
  }
}`,
        },
        {
          method: 'POST',
          path: '/api/v1/clients',
          description: t('api.clients.endpoints.createClient.description'),
          parameters: [
            {
              name: 'name',
              type: 'string',
              required: true,
              description: t('api.clients.endpoints.createClient.parameters.name'),
            },
            {
              name: 'email',
              type: 'string',
              required: true,
              description: t('api.clients.endpoints.createClient.parameters.email'),
            },
            {
              name: 'phone',
              type: 'string',
              required: false,
              description: t('api.clients.endpoints.createClient.parameters.phone'),
            },
            {
              name: 'address',
              type: 'object',
              required: false,
              description: t('api.clients.endpoints.createClient.parameters.address'),
            },
          ],
          example: `{
  "name": "Luca Verdi",
  "email": "luca@example.com",
  "phone": "+39 987 654 321",
  "address": {
    "street": "Via Roma 123",
    "city": "Milano",
    "zip": "20100"
  }
}`,
          response: `{
  "success": true,
  "data": {
    "id": 2,
    "name": "Luca Verdi",
    "email": "luca@example.com",
    "created_at": "2024-01-16T14:20:00Z"
  }
}`,
        },
      ],
    },
    invoices: {
      title: t('api.invoices.title'),
      description: t('api.invoices.description'),
      endpoints: [
        {
          method: 'GET',
          path: '/api/v1/invoices',
          description: t('api.invoices.endpoints.getInvoices.description'),
          parameters: [
            {
              name: 'status',
              type: 'string',
              required: false,
              description: t('api.invoices.endpoints.getInvoices.parameters.status'),
            },
            {
              name: 'client_id',
              type: 'integer',
              required: false,
              description: t('api.invoices.endpoints.getInvoices.parameters.client_id'),
            },
            {
              name: 'date_from',
              type: 'date',
              required: false,
              description: t('api.invoices.endpoints.getInvoices.parameters.date_from'),
            },
            {
              name: 'date_to',
              type: 'date',
              required: false,
              description: t('api.invoices.endpoints.getInvoices.parameters.date_to'),
            },
          ],
          example: 'GET /api/v1/invoices?status=sent&client_id=1',
          response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "number": "INV-2024-001",
      "client_id": 1,
      "client_name": "Mario Rossi",
      "amount": 1500.00,
      "status": "sent",
      "due_date": "2024-02-15",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}`,
        },
      ],
    },
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
            <p className="text-xl text-gray-600 mb-8">{t('header.subtitle')}</p>

            {/* API Info */}
            <div className="flex justify-center items-center space-x-8 mb-8">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">{t('apiInfo.baseUrl')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-gray-600">{t('apiInfo.apiKey')}</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('sidebar.endpoints')}</h3>
              <div className="space-y-2">
                {endpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      selectedEndpoint === endpoint.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{endpoint.icon}</span>
                    <span className="font-medium">{endpoint.name}</span>
                  </button>
                ))}
              </div>

              {/* Quick Links */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Risorse</h4>
                <div className="space-y-2">
                  <a
                    href="#"
                    className="flex items-center text-sm text-gray-600 hover:text-blue-600"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Postman Collection
                  </a>
                  <a
                    href="#"
                    className="flex items-center text-sm text-gray-600 hover:text-blue-600"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    API Playground
                  </a>
                  <a
                    href="mailto:support@nexamanager.com"
                    className="flex items-center text-sm text-gray-600 hover:text-blue-600"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Supporto API
                  </a>
                </div>
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {apiData[selectedEndpoint] && (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {apiData[selectedEndpoint].title}
                  </h2>
                  <p className="text-gray-600">{apiData[selectedEndpoint].description}</p>
                </div>

                <div className="space-y-12">
                  {apiData[selectedEndpoint].endpoints
                    .filter((endpoint) =>
                      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((endpoint, index) => (
                      <div key={index} className="bg-white rounded-lg shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <div className="flex items-center space-x-4">
                            <span
                              className={`px-3 py-1 text-sm font-semibold rounded-full ${getMethodColor(
                                endpoint.method,
                              )}`}
                            >
                              {t(`methods.${endpoint.method}`)}
                            </span>
                            <h3 className="text-lg font-mono font-semibold text-gray-900">
                              {endpoint.path}
                            </h3>
                          </div>
                          <p className="mt-2 text-gray-600">{endpoint.description}</p>
                        </div>

                        <div className="p-6">
                          <h4 className="text-md font-semibold text-gray-900 mb-4">
                            {t('content.parameters')}
                          </h4>
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 text-gray-600">
                                <th className="py-2">{t('content.name')}</th>
                                <th className="py-2">{t('content.type')}</th>
                                <th className="py-2">{t('content.required')}</th>
                                <th className="py-2">{t('content.description')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {endpoint.parameters?.map((param, pIndex) => (
                                <tr key={pIndex} className="border-b border-gray-100">
                                  <td className="py-2 font-mono text-gray-800">{param.name}</td>
                                  <td className="py-2 font-mono text-purple-600">{param.type}</td>
                                  <td className="py-2">
                                    {param.required ? (
                                      <span className="text-red-600">{t('content.required')}</span>
                                    ) : (
                                      <span className="text-gray-500">No</span>
                                    )}
                                  </td>
                                  <td className="py-2 text-gray-600">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="grid md:grid-cols-2 gap-6 mt-8">
                            <div>
                              <h4 className="text-md font-semibold text-gray-900 mb-4">
                                {t('content.exampleRequest')}
                              </h4>
                              <div className="bg-gray-800 rounded-lg p-4 relative text-sm font-mono text-white">
                                <button
                                  onClick={() => copyToClipboard(endpoint.example, `req-${index}`)}
                                  className="absolute top-2 right-2 p-1 bg-gray-600 hover:bg-gray-500 rounded-md"
                                >
                                  {copiedCode === `req-${index}` ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 text-green-400" />
                                      <span className="sr-only">{t('content.copied')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4" />
                                      <span className="sr-only">{t('content.copy')}</span>
                                    </>
                                  )}
                                </button>
                                <pre>
                                  <code>{endpoint.example}</code>
                                </pre>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-md font-semibold text-gray-900 mb-4">
                                {t('content.exampleResponse')}
                              </h4>
                              <div className="bg-gray-800 rounded-lg p-4 relative text-sm font-mono text-white">
                                <button
                                  onClick={() => copyToClipboard(endpoint.response, `res-${index}`)}
                                  className="absolute top-2 right-2 p-1 bg-gray-600 hover:bg-gray-500 rounded-md"
                                >
                                  {copiedCode === `res-${index}` ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 text-green-400" />
                                      <span className="sr-only">{t('content.copied')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4" />
                                      <span className="sr-only">{t('content.copy')}</span>
                                    </>
                                  )}
                                </button>
                                <pre>
                                  <code>{endpoint.response}</code>
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Support Section */}
            <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Hai bisogno di supporto per le API?
                </h3>
                <p className="text-gray-600 mb-6">
                  Il nostro team tecnico è disponibile per assistenza e consulenza
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:support@nexamanager.com"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Contatta il Team API
                  </a>
                  <a
                    href="tel:+39351693692"
                    className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Chiama +39 351 693 692
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiReference;
