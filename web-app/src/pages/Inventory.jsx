import React, { useState, useEffect } from 'react';
import Footer from '@components/shared/Footer';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  PencilSquareIcon,
  EllipsisHorizontalIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  TagIcon,
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Search, ChevronDown } from 'lucide-react';
import nexaFooterLogo from '@assets/logo_nexa_footer.png';
import nexaLogo from '@assets/logo_nexa.png';
import { useTranslation } from 'react-i18next';

export default function Inventory() {
  const { t, ready } = useTranslation('inventory');
  const { t: tCommon, ready: readyCommon } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_az'); // Static default
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('allProducts'); // Static default

  // Safe translation function that handles loading state and interpolation
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) return fallback;
    return t(key, options);
  };

  // Safe translation function for common namespace
  const safeTCommon = (key, options = {}, fallback = key) => {
    if (!readyCommon) return fallback;
    return tCommon(key, options);
  };

  // Show loading state if translations are not ready
  if (!ready || !readyCommon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  // Sample data with safe translations
  const inventoryData = [
    {
      id: 1,
      name: safeT('sampleData.macbook.name', {}, 'MacBook Pro 16"'),
      category: safeT('sampleData.macbook.category', {}, 'Electronics'),
      location: safeT('sampleData.macbook.location', {}, 'Warehouse A'),
      stock: 12,
      minStock: 5,
      price: 2499.0,
      cost: 1899.0,
      supplier: safeT('sampleData.macbook.supplier', {}, 'Apple Inc.'),
      sku: 'MBP16-2023',
      status: safeT('status.inStock', {}, 'In Stock'),
      lastUpdated: '2024-01-15',
    },
    {
      id: 2,
      name: safeT('sampleData.officeChair.name', {}, 'Office Chair'),
      category: safeT('sampleData.officeChair.category', {}, 'Furniture'),
      location: safeT('sampleData.officeChair.location', {}, 'Warehouse B'),
      stock: 3,
      minStock: 10,
      price: 299.0,
      cost: 189.0,
      supplier: safeT('sampleData.officeChair.supplier', {}, 'Herman Miller'),
      sku: 'OFC-HM-001',
      status: safeT('status.lowStock', {}, 'Low Stock'),
      lastUpdated: '2024-01-14',
    },
    {
      id: 3,
      name: safeT('sampleData.wirelessMouse.name', {}, 'Wireless Mouse'),
      category: safeT('sampleData.wirelessMouse.category', {}, 'Electronics'),
      location: safeT('sampleData.wirelessMouse.location', {}, 'Warehouse A'),
      stock: 0,
      minStock: 20,
      price: 79.99,
      cost: 45.0,
      supplier: safeT('sampleData.wirelessMouse.supplier', {}, 'Logitech'),
      sku: 'WM-LOG-MX3',
      status: safeT('status.outOfStock', {}, 'Out of Stock'),
      lastUpdated: '2024-01-13',
    },
    {
      id: 4,
      name: safeT('sampleData.standingDesk.name', {}, 'Standing Desk'),
      category: safeT('sampleData.standingDesk.category', {}, 'Furniture'),
      location: safeT('sampleData.standingDesk.location', {}, 'Warehouse B'),
      stock: 8,
      minStock: 5,
      price: 599.0,
      cost: 399.0,
      supplier: safeT('sampleData.standingDesk.supplier', {}, 'IKEA'),
      sku: 'SD-IKEA-ADJ',
      status: safeT('status.inStock', {}, 'In Stock'),
      lastUpdated: '2024-01-15',
    },
    {
      id: 5,
      name: safeT('sampleData.monitor.name', {}, 'Monitor 27"'),
      category: safeT('sampleData.monitor.category', {}, 'Electronics'),
      location: safeT('sampleData.monitor.location', {}, 'Warehouse A'),
      stock: 15,
      minStock: 8,
      price: 349.0,
      cost: 249.0,
      supplier: safeT('sampleData.monitor.supplier', {}, 'Dell'),
      sku: 'MON-DELL-27',
      status: safeT('status.inStock', {}, 'In Stock'),
      lastUpdated: '2024-01-15',
    },
  ];

  const getStatusColor = (status) => {
    const inStock = safeT('status.inStock', {}, 'In Stock');
    const lowStock = safeT('status.lowStock', {}, 'Low Stock');
    const outOfStock = safeT('status.outOfStock', {}, 'Out of Stock');

    switch (status) {
      case inStock:
        return 'bg-green-100 text-green-800';
      case lowStock:
        return 'bg-yellow-100 text-yellow-800';
      case outOfStock:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockIndicator = (stock, minStock) => {
    if (stock === 0) return { color: 'text-red-500', icon: XCircleIcon };
    if (stock <= minStock) return { color: 'text-yellow-500', icon: ExclamationTriangleIcon };
    return { color: 'text-green-500', icon: CheckCircleIcon };
  };

  const filteredData = inventoryData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalValue = inventoryData.reduce((sum, item) => sum + item.stock * item.price, 0);
  const lowStockItems = inventoryData.filter(
    (item) => item.stock <= item.minStock && item.stock > 0,
  ).length;
  const outOfStockItems = inventoryData.filter((item) => item.stock === 0).length;
  const needsReorderItems = inventoryData.filter((item) => item.stock <= item.minStock).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 p-0">
        <div className="space-y-6 px-2 md:px-4">
          {/* Breadcrumb */}
          <div className="bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-blue-600 font-medium">{safeT('breadcrumb.inventory', {}, 'Inventory')}</span>
                <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg]" />
                <span className="text-gray-600">{safeT('breadcrumb.management', {}, 'Management')}</span>
              </div>
              {/* Search Bar */}
              <div className="flex items-center bg-white rounded px-2 h-10 w-100 py-0 relative">
                <Search className="h-2 w-2 text-gray-400 mr-1" />
                <input
                  type="text"
                  placeholder={safeT('searchPlaceholder', {}, 'Search products...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 h-5 text-gray-700 bg-transparent border-none focus:border-none focus:ring-0 focus:outline-none text-xs leading-tight font-light placeholder:text-xs placeholder:font-light"
                />
              </div>
            </div>
          </div>

          {/* Header Section */}
          <div className="flex items-center justify-between px-4 md:px-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{safeT('header.title', {}, 'Inventory Management')}</h1>
              <p className="text-gray-600 mt-1">{safeT('header.subtitle', {}, 'Track, control, and manage all your products.')}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <DocumentTextIcon className="h-4 w-4" />
                <span>{safeT('buttons.reports', {}, 'Reports')}</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>{safeT('buttons.export', {}, 'Export')}</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <PlusIcon className="h-4 w-4" />
                <span>{safeT('buttons.addNewItem', {}, 'Add New Item')}</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-8">
            {/* Total Inventory Value */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{safeT('stats.totalValue', {}, 'Total Inventory Value')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900">
                      ${totalValue.toLocaleString()}
                    </p>
                    <span className="flex items-center text-sm text-green-600">
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      {safeT('stats.trend', {}, '+8.2%')}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Low Stock Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{safeT('stats.lowStock', {}, 'Low Stock Items')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
                    <span className="text-sm text-yellow-600">
                      {safeT('stats.needsAttention', { count: 3 }, '3 items need attention')}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Items to Reorder */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{safeT('stats.itemsToReorder', {}, 'Items to Reorder')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900">{needsReorderItems}</p>
                    <span className="text-sm text-red-600">
                      {safeT('stats.criticallyLow', { count: outOfStockItems }, `${outOfStockItems} out of stock`)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <ShoppingCartIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Table Section */}
          <div className="bg-white rounded-xl shadow-sm mx-4 md:mx-8">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button
                    className={`px-3 py-2 text-sm font-medium ${
                      activeTab === 'allProducts'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('allProducts')}
                  >
                    {safeT('tabs.allProducts', {}, 'All Products')}
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium ${
                      activeTab === 'categories'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('categories')}
                  >
                    {safeT('tabs.categories', {}, 'Categories')}
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium ${
                      activeTab === 'suppliers'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('suppliers')}
                  >
                    {safeT('tabs.suppliers', {}, 'Suppliers')}
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium ${
                      activeTab === 'locations'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('locations')}
                  >
                    {safeT('tabs.locations', {}, 'Locations')}
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800">
                      <AdjustmentsHorizontalIcon className="h-4 w-4" />
                      <span>{sortBy}</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {safeT('table.product', {}, 'Product')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {safeT('table.category', {}, 'Category')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {safeT('table.location', {}, 'Location')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {safeT('table.stock', {}, 'Stock')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {safeT('table.price', {}, 'Price')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {safeT('table.supplier', {}, 'Supplier')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {safeT('table.lastUpdated', {}, 'Last Updated')}
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">{safeT('table.actions', {}, 'Actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <BuildingStorefrontIcon className="h-10 w-10 text-gray-300" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-800">{item.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-800">{item.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ArchiveBoxIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-semibold">{item.stock}</span>
                            <span className="text-sm text-gray-500 ml-1">/ {item.minStock}</span>
                            {(() => {
                              const { color, icon: Icon } = getStockIndicator(
                                item.stock,
                                item.minStock,
                              );
                              return <Icon className={`h-4 w-4 ml-2 ${color}`} />;
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {item.supplier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            {item.lastUpdated}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-gray-500 hover:text-gray-700">
                            <EllipsisHorizontalIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {safeT('emptyState.title', {}, 'No products found')}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">{safeT('emptyState.message', {}, 'Try adjusting your search or filters.')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                {safeT('table.showing', {}, 'Showing')} <span className="font-medium">1</span> {safeT('table.to', {}, 'to')}{' '}
                <span className="font-medium">{filteredData.length}</span> {safeT('table.of', {}, 'of')}{' '}
                <span className="font-medium">{inventoryData.length}</span> {safeT('table.results', {}, 'results')}
              </p>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  {safeT('table.previous', {}, 'Previous')}
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  {safeT('table.next', {}, 'Next')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
