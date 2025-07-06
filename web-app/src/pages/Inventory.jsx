import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '@components/shared/Footer';
import InventorySidebar from '@components/inventory/InventorySidebar';
import RecentActivities from '@components/inventory/RecentActivities';
import QuickActions from '@components/inventory/QuickActions';
import InventoryByCategory from '@components/inventory/InventoryByCategory';
import InventoryValueTrend from '@components/inventory/InventoryValueTrend';
import AddItemModal from '@components/inventory/AddItemModal';
import ManageCategoriesModal from '@components/inventory/ManageCategoriesModal';
import ExportInventoryModal from '@components/inventory/ExportInventoryModal';
import StockAlertsModal from '@components/inventory/StockAlertsModal';
import ReportsModal from '@components/inventory/ReportsModal';
import ReorderModal from '@components/inventory/ReorderModal';
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
  ArrowUpIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  HomeIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Search, ChevronDown, Eye, MapPin } from 'lucide-react';
import nexaFooterLogo from '@assets/logo_nexa_footer.png';
import nexaLogo from '@assets/logo_nexa.png';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function Inventory() {
  const { t, ready } = useTranslation('inventory');
  const { t: tCommon, ready: readyCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_az'); // Static default
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('allProducts'); // Static default
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    stockStatus: '',
  });

  // Modal states
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [isExportInventoryModalOpen, setIsExportInventoryModalOpen] = useState(false);
  const [isStockAlertsModalOpen, setIsStockAlertsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [selectedItemForReorder, setSelectedItemForReorder] = useState(null);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

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
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading inventory...</p>
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

  const getStatusColor = status => {
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

  // Filter data based on current tab and filters
  const getFilteredData = () => {
    if (activeTab === 'categories') {
      // Group by categories and return summary data
      const categoryGroups = inventoryData.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = {
            id: item.category,
            name: item.category,
            category: item.category,
            location: 'Multiple',
            stock: 0,
            minStock: 0,
            price: 0,
            cost: 0,
            supplier: 'Various',
            sku: 'CAT-' + item.category.substring(0, 3).toUpperCase(),
            status: safeT('status.inStock', {}, 'In Stock'),
            lastUpdated: new Date().toISOString().split('T')[0],
            itemCount: 0,
            totalValue: 0
          };
        }
        acc[item.category].stock += item.stock;
        acc[item.category].minStock += item.minStock;
        acc[item.category].totalValue += item.stock * item.price;
        acc[item.category].itemCount += 1;
        return acc;
      }, {});
      return Object.values(categoryGroups);
    } else if (activeTab === 'locations') {
      // Group by locations and return summary data
      const locationGroups = inventoryData.reduce((acc, item) => {
        if (!acc[item.location]) {
          acc[item.location] = {
            id: item.location,
            name: item.location,
            category: 'Multiple',
            location: item.location,
            stock: 0,
            minStock: 0,
            price: 0,
            cost: 0,
            supplier: 'Various',
            sku: 'LOC-' + item.location.substring(0, 3).toUpperCase(),
            status: safeT('status.inStock', {}, 'In Stock'),
            lastUpdated: new Date().toISOString().split('T')[0],
            itemCount: 0,
            totalValue: 0
          };
        }
        acc[item.location].stock += item.stock;
        acc[item.location].minStock += item.minStock;
        acc[item.location].totalValue += item.stock * item.price;
        acc[item.location].itemCount += 1;
        return acc;
      }, {});
      return Object.values(locationGroups);
    } else {
      // Default: show all products with filters applied
      return inventoryData.filter(item => {
        // Search filter
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Category filter
        const matchesCategory = !filters.category || item.category.toLowerCase() === filters.category.toLowerCase();
        
        // Location filter
        const matchesLocation = !filters.location || item.location.toLowerCase() === filters.location.toLowerCase();
        
        // Stock status filter
        let matchesStockStatus = true;
        if (filters.stockStatus) {
          if (filters.stockStatus === 'in-stock') {
            matchesStockStatus = item.stock > item.minStock;
          } else if (filters.stockStatus === 'low-stock') {
            matchesStockStatus = item.stock <= item.minStock && item.stock > 0;
          } else if (filters.stockStatus === 'out-of-stock') {
            matchesStockStatus = item.stock === 0;
          }
        }
        
        return matchesSearch && matchesCategory && matchesLocation && matchesStockStatus;
      });
    }
  };

  const filteredData = getFilteredData();

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const totalValue = inventoryData.reduce((sum, item) => sum + item.stock * item.price, 0);
  const lowStockItems = inventoryData.filter(
    item => item.stock <= item.minStock && item.stock > 0,
  ).length;
  const outOfStockItems = inventoryData.filter(item => item.stock === 0).length;
  const needsReorderItems = inventoryData.filter(item => item.stock <= item.minStock).length;

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Main Content */}
        <div className='flex-1 p-0'>
          <div className='space-y-6'>
            {/* Breadcrumb */}
            <nav className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2 text-base'>
                  <HomeIcon className='h-5 w-5 text-blue-600' />
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className='text-blue-600 hover:text-blue-700 font-medium transition-colors'
                  >
                    Dashboard
                  </button>
                  <ChevronRightIcon className='h-5 w-5 text-gray-400' />
                  <span className='text-nav-text font-semibold text-gray-600'>
                    {safeT('breadcrumb.inventory', {}, 'Inventory')}
                  </span>
                </div>
                {/* Search Bar */}
                <div className='flex items-center bg-white rounded px-2 h-10 w-100 py-0 relative'>
                  <Search className='h-2 w-2 text-gray-400 mr-1' />
                  <input
                    type='text'
                    placeholder={safeT('searchPlaceholder', {}, 'Search products...')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='flex-1 h-5 text-gray-700 bg-transparent border-none focus:border-none focus:ring-0 focus:outline-none text-input-text leading-tight placeholder:text-input-text'
                  />
                </div>
              </div>
            </nav>

            {/* Header Section */}
            <div className='flex items-center justify-between px-4 md:px-8'>
              <div>
                <h1 className='text-page-title text-gray-900'>
                  {safeT('header.title', {}, 'Inventory Management')}
                </h1>
                <p className='text-subtitle text-gray-600 mt-1'>
                  {safeT('header.subtitle', {}, 'Track, control, and manage all your products.')}
                </p>
              </div>
              <div className='flex items-center space-x-3'>
                <button 
                  onClick={() => setIsReportsModalOpen(true)}
                  className='flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <DocumentTextIcon className='h-4 w-4' />
                  <span className='text-button-text'>{safeT('buttons.reports', {}, 'Reports')}</span>
                </button>
                <button 
                  onClick={() => setIsExportInventoryModalOpen(true)}
                  className='flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <ArrowDownTrayIcon className='h-4 w-4' />
                  <span className='text-button-text'>{safeT('buttons.export', {}, 'Export')}</span>
                </button>
                <button 
                  onClick={() => setIsAddItemModalOpen(true)}
                  className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  <PlusIcon className='h-4 w-4' />
                  <span className='text-button-text'>{safeT('buttons.addNewItem', {}, 'Add New Item')}</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-8'>
              {/* Total Inventory Value */}
              <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-200 hover:border-blue-300'>
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md'>
                       <CurrencyDollarIcon className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <p className='text-card-title text-blue-700'>
                        {safeT('stats.totalValue', {}, 'Total Inventory Value')}
                      </p>
                      <p className='text-card-metric text-blue-900'>
                         €{totalValue.toLocaleString()}
                       </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-badge font-semibold shadow-sm'>
                     <ArrowUpIcon className='w-3 h-3' />
                     +8.2%
                   </div>
                </div>
                <div className='w-full bg-blue-200 rounded-full h-3 mb-2 shadow-inner'>
                  <div
                    className='bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm'
                    style={{ width: '75%' }}
                  ></div>
                </div>
                <div className='flex justify-between text-badge text-blue-600 font-medium'>
                  <span>{safeT('stats.target', {}, 'Target: ')} €{(totalValue * 1.2).toLocaleString()}</span>
                  <span>{safeT('stats.targetPercentage', {}, '75% of target')}</span>
                </div>
              </div>

              {/* Low Stock Items */}
              <div className='bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-red-200 hover:border-red-300'>
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md'>
                      <ExclamationTriangleIcon className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <p className='text-card-title text-red-700'>
                        {safeT('stats.lowStock', {}, 'Articoli in Scarsità')}
                      </p>
                      <p className='text-card-metric text-red-900'>
                         {lowStockItems}
                       </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-full text-badge font-semibold shadow-sm'>
                    <ExclamationTriangleIcon className='w-3 h-3' />
                    {safeT('stats.alert', {}, 'Alert')}
                  </div>
                </div>
                <div className='w-full bg-red-200 rounded-full h-3 mb-2 shadow-inner'>
                  <div
                    className='bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full shadow-sm'
                    style={{ width: `${Math.min((lowStockItems / 10) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className='flex justify-between text-badge text-red-600 font-medium'>
                  <span>{safeT('stats.critical', {}, 'Critical: ')} {Math.floor(lowStockItems * 0.3)}</span>
                  <span>{safeT('stats.needsAttention', {}, 'Needs attention')}</span>
                </div>
              </div>

              {/* Items to Reorder */}
              <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-200 hover:border-green-300'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md'>
                       <ArrowPathIcon className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <p className='text-card-title text-green-700'>
                        {safeT('stats.itemsToReorder', {}, 'Articoli da Riordinare')}
                      </p>
                      <p className='text-card-metric text-green-900'>
                         {needsReorderItems}
                       </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-badge font-semibold shadow-sm'>
                     <ArrowPathIcon className='w-3 h-3' />
                     {safeT('stats.ready', {}, 'Ready')}
                   </div>
                </div>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-green-700 text-nav-text font-medium'>
                    {safeT('stats.reorderRate', {}, 'Reorder Rate:')}
                  </span>
                  <span className='font-bold text-green-900'>{Math.min(Math.floor((needsReorderItems / 20) * 100), 100)}%</span>
                  <div className='flex-1 bg-green-200 rounded-full h-3 shadow-inner'>
                    <div
                      className='bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full shadow-sm'
                      style={{ width: `${Math.min((needsReorderItems / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className='flex justify-between text-badge text-green-600 font-medium'>
                  <span>{Math.min(Math.floor((needsReorderItems / 20) * 100), 100)}%</span>
                  <span>{safeT('stats.reorderEfficiency', {}, 'Reorder efficiency')}</span>
                </div>
              </div>
            </div>

            {/* Main Content Area with Sidebar */}
            <div className='flex gap-6 px-4 md:px-8'>
              {/* Main Table Section */}
              <div className='flex-1 bg-white rounded-none shadow-sm border border-gray-200'>
                {/* New Table Header */}
                <div className='px-6 py-4 border-b border-gray-200'>
                  {/* Tab Navigation */}
                  <div className='flex items-center space-x-8 mb-4'>
                    <button
                      className={`pb-2 text-sm font-medium border-b-2 ${
                        activeTab === 'allProducts'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('allProducts')}
                    >
                      <span className='text-nav-text'>{safeT('tabs.allProducts', {}, 'All Products')}</span>
                    </button>
                    <button
                      className={`pb-2 text-sm font-medium border-b-2 ${
                        activeTab === 'categories'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('categories')}
                    >
                      <span className='text-nav-text'>{safeT('tabs.categories', {}, 'Categories')}</span>
                    </button>
                    <button
                      className={`pb-2 text-sm font-medium border-b-2 ${
                        activeTab === 'locations'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('locations')}
                    >
                      <span className='text-nav-text'>{safeT('tabs.locations', {}, 'Locations')}</span>
                    </button>
                  </div>
                  
                  {/* Search, Filters, and Sort Controls */}
                  <div className='flex items-center justify-between'>
                    {/* Search Bar */}
                    <div className='relative flex-1 max-w-md'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' />
                      </div>
                      <input
                        type='text'
                        className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-input-text'
                        placeholder={safeT('search.placeholder', {}, 'Search products...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className='flex items-center space-x-4 ml-4'>
                      {/* Filters Button */}
                      <button 
                        className='flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-button-text font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <FunnelIcon className='h-4 w-4' />
                        <span>{safeT('filters.title', {}, 'Filters')}</span>
                      </button>
                      
                      {/* Sort Dropdown */}
                      <div className='flex items-center space-x-2 text-nav-text text-gray-600'>
                        <span>{safeT('sort.label', {}, 'Sort by:')}</span>
                        <select 
                          className='border border-gray-300 rounded-md px-3 py-2 text-input-text text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="name_az">{safeT('sort.nameAZ', {}, 'Name (A-Z)')}</option>
                          <option value="name_za">{safeT('sort.nameZA', {}, 'Name (Z-A)')}</option>
                          <option value="stock_low">{safeT('sort.stockLow', {}, 'Stock (Low to High)')}</option>
                          <option value="stock_high">{safeT('sort.stockHigh', {}, 'Stock (High to Low)')}</option>
                          <option value="price_low">{safeT('sort.priceLow', {}, 'Price (Low to High)')}</option>
                          <option value="price_high">{safeT('sort.priceHigh', {}, 'Price (High to Low)')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expandable Filters Section */}
                  {showFilters && (
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                      <div className='flex items-center space-x-4'>
                        <select 
                          className='border border-gray-300 rounded-md px-3 py-2 text-input-text text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          value={filters.category}
                          onChange={(e) => setFilters({...filters, category: e.target.value})}
                        >
                          <option value="">{safeT('filters.category', {}, 'All Categories')}</option>
                          <option value={safeT('sampleData.macbook.category', {}, 'Electronics')}>{safeT('sampleData.macbook.category', {}, 'Electronics')}</option>
                          <option value={safeT('sampleData.officeChair.category', {}, 'Furniture')}>{safeT('sampleData.officeChair.category', {}, 'Furniture')}</option>
                        </select>

                        <select 
                          className='border border-gray-300 rounded-md px-3 py-2 text-input-text text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          value={filters.location}
                          onChange={(e) => setFilters({...filters, location: e.target.value})}
                        >
                          <option value="">{safeT('filters.location', {}, 'All Locations')}</option>
                          <option value={safeT('sampleData.macbook.location', {}, 'Warehouse A')}>{safeT('sampleData.macbook.location', {}, 'Warehouse A')}</option>
                          <option value={safeT('sampleData.officeChair.location', {}, 'Warehouse B')}>{safeT('sampleData.officeChair.location', {}, 'Warehouse B')}</option>
                        </select>

                        <select 
                          className='border border-gray-300 rounded-md px-3 py-2 text-input-text text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          value={filters.stockStatus}
                          onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
                        >
                          <option value="">{safeT('filters.stockStatus', {}, 'All Stock Status')}</option>
                          <option value="in-stock">{safeT('status.inStock', {}, 'In Stock')}</option>
                          <option value="low-stock">{safeT('status.lowStock', {}, 'Low Stock')}</option>
                          <option value="out-of-stock">{safeT('status.outOfStock', {}, 'Out of Stock')}</option>
                        </select>

                        {/* Clear Filters Button */}
                        {(filters.category || filters.location || filters.stockStatus) && (
                          <button
                            className='px-3 py-2 text-button-text font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
                            onClick={() => setFilters({ category: '', location: '', stockStatus: '' })}
                          >
                            {safeT('filters.clearFilters', {}, 'Clear Filters')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              {/* Table */}
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      {activeTab === 'categories' ? (
                        <>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.category', {}, 'Category')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.itemsCount', {}, 'Items Count')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.totalStock', {}, 'Total Stock')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.totalValue', {}, 'Total Value')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.lastUpdated', {}, 'Last Updated')}
                          </th>
                          <th className='relative px-6 py-3'>
                            <span className='sr-only'>{safeT('table.actions', {}, 'Actions')}</span>
                          </th>
                        </>
                      ) : activeTab === 'locations' ? (
                        <>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.location', {}, 'Location')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            Items Count
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            Total Stock
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            Total Value
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.lastUpdated', {}, 'Last Updated')}
                          </th>
                          <th className='relative px-6 py-3'>
                            <span className='sr-only'>{safeT('table.actions', {}, 'Actions')}</span>
                          </th>
                        </>
                      ) : (
                        <>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.product', {}, 'Product')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.category', {}, 'Category')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.location', {}, 'Location')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.stock', {}, 'Stock')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.price', {}, 'Price')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.supplier', {}, 'Supplier')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {safeT('table.lastUpdated', {}, 'Last Updated')}
                          </th>
                          <th className='relative px-6 py-3'>
                            <span className='sr-only'>{safeT('table.actions', {}, 'Actions')}</span>
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {paginatedData.length > 0 ? (
                      paginatedData.map(item => (
                        <tr key={item.id}>
                          {activeTab === 'categories' ? (
                            <>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='flex items-center'>
                                  <div className='flex-shrink-0 h-10 w-10'>
                                    <div className='h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center'>
                                      <TagIcon className='h-5 w-5 text-blue-600' />
                                    </div>
                                  </div>
                                  <div className='ml-4'>
                                    <div className='text-table-cell font-medium text-gray-900'>{item.name}</div>
                                    <div className='text-table-cell text-gray-500'>{item.sku}</div>
                                  </div>
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-table-cell text-gray-900'>
                                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-badge font-medium bg-blue-100 text-blue-800'>
                                  {item.itemCount} items
                                </span>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-table-cell text-gray-900'>
                                <span className='font-medium'>{item.stock}</span>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-table-cell text-gray-900'>
                                €{item.totalValue.toFixed(2)}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-table-cell text-gray-500'>
                                <div className='flex items-center'>
                                  <ClockIcon className='h-4 w-4 mr-2' />
                                  {item.lastUpdated}
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-right text-table-cell font-medium'>
                                <button className='text-gray-500 hover:text-gray-700'>
                                  <EllipsisHorizontalIcon className='h-5 w-5' />
                                </button>
                              </td>
                            </>
                          ) : activeTab === 'locations' ? (
                            <>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='flex items-center'>
                                  <div className='flex-shrink-0 h-10 w-10'>
                                    <div className='h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center'>
                                      <MapPinIcon className='h-5 w-5 text-green-600' />
                                    </div>
                                  </div>
                                  <div className='ml-4'>
                                    <div className='text-table-cell font-medium text-gray-900'>{item.name}</div>
                                    <div className='text-table-cell text-gray-500'>{item.sku}</div>
                                  </div>
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-table-cell text-gray-900'>
                                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-badge font-medium bg-green-100 text-green-800'>
                                  {item.itemCount} items
                                </span>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-table-cell text-gray-900'>
                                <span className='font-medium'>{item.stock}</span>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-table-cell text-gray-900'>
                                ${item.totalValue.toFixed(2)}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-table-cell text-gray-500'>
                                <div className='flex items-center'>
                                  <ClockIcon className='h-4 w-4 mr-2' />
                                  {item.lastUpdated}
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-right text-table-cell font-medium'>
                                <button className='text-gray-500 hover:text-gray-700'>
                                  <EllipsisHorizontalIcon className='h-5 w-5' />
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='flex items-center'>
                                  <div className='flex-shrink-0 h-10 w-10'>
                                    <BuildingStorefrontIcon className='h-10 w-10 text-gray-300' />
                                  </div>
                                  <div className='ml-4'>
                                    <div className='text-table-cell font-medium text-gray-900'>{item.name}</div>
                                    <div className='text-table-cell text-gray-500'>{item.sku}</div>
                                  </div>
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='flex items-center'>
                                  <TagIcon className='h-4 w-4 text-gray-400 mr-2' />
                                  <span className='text-table-cell text-gray-800'>{item.category}</span>
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='flex items-center'>
                                  <MapPinIcon className='h-4 w-4 text-gray-400 mr-2' />
                                  <span className='text-table-cell text-gray-800'>{item.location}</span>
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='flex items-center'>
                                  <ArchiveBoxIcon className='h-4 w-4 text-gray-400 mr-2' />
                                  <span className='text-sm font-semibold'>{item.stock}</span>
                                  <span className='text-sm text-gray-500 ml-1'>/ {item.minStock}</span>
                                  {(() => {
                                    const { color, icon: Icon } = getStockIndicator(
                                      item.stock,
                                      item.minStock,
                                    );
                                    return <Icon className={`h-4 w-4 ml-2 ${color}`} />;
                                  })()}
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-800'>
                                €{item.price.toFixed(2)}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-800'>
                                {item.supplier}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                <div className='flex items-center'>
                                  <ClockIcon className='h-4 w-4 mr-2' />
                                  {item.lastUpdated}
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                <button className='text-gray-500 hover:text-gray-700'>
                                  <EllipsisHorizontalIcon className='h-5 w-5' />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan='8' className='text-center py-12'>
                          <div className='flex flex-col items-center'>
                            <MagnifyingGlassIcon className='h-12 w-12 text-gray-400' />
                            <h3 className='mt-2 text-card-title text-gray-900'>
                              {safeT('emptyState.title', {}, 'No products found')}
                            </h3>
                            <p className='mt-1 text-subtitle text-gray-500'>
                              {safeT(
                                'emptyState.message',
                                {},
                                'Try adjusting your search or filters.',
                              )}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className='px-6 py-4 flex items-center justify-between'>
                <div className='flex-1 flex justify-between sm:hidden'>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <span className='text-button-text'>{safeT('pagination.previous', {}, 'Precedente')}</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <span className='text-button-text'>{safeT('pagination.next', {}, 'Successivo')}</span>
                  </button>
                </div>
                <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm text-gray-700'>
                      {safeT('pagination.showing', {}, 'Mostrando')}{' '}
                      <span className='font-medium'>{startIndex + 1}</span> {safeT('pagination.to', {}, 'a')}{' '}
                      <span className='font-medium'>{Math.min(endIndex, filteredData.length)}</span> {safeT('pagination.of', {}, 'di')}{' '}
                      <span className='font-medium'>{filteredData.length}</span> {safeT('pagination.results', {}, 'risultati')}
                    </p>
                  </div>
                  <div>
                    <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px' aria-label='Pagination'>
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <span className='sr-only'>{safeT('pagination.previous', {}, 'Precedente')}</span>
                        <ChevronLeftIcon className='h-5 w-5' aria-hidden='true' />
                      </button>
                      <span className='relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700'>
                        {safeT('pagination.page', {}, 'Pagina')} {currentPage} {safeT('pagination.of', {}, 'di')} {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <span className='sr-only'>{safeT('pagination.next', {}, 'Successivo')}</span>
                        <ChevronRightIcon className='h-5 w-5' aria-hidden='true' />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
              </div>

              {/* Right Column: Sidebar only */}
              <div className='w-[362px] flex flex-col gap-6'>
                {/* Quick Actions - Moved to top */}
                <div className="border border-gray-200 bg-white shadow-sm rounded-none h-full">
                  <QuickActions 
                    onAddItem={() => setIsAddItemModalOpen(true)}
                    onManageCategories={() => setIsManageCategoriesModalOpen(true)}
                    onExportInventory={() => setIsExportInventoryModalOpen(true)}
                    onStockAlerts={() => setIsStockAlertsModalOpen(true)}
                  />
                </div>
                
                {/* Sidebar */}
                <InventorySidebar 
                  onReorder={(item) => {
                    setSelectedItemForReorder(item);
                    setIsReorderModalOpen(true);
                  }}
                />
              </div>
            </div>
          </div>



          {/* Footer */}
          <Footer />
        </div>
      </div>

      {/* Modals */}
      <AddItemModal 
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onSave={(newItem) => {
          // Add the new item to inventory
          console.log('Adding new item:', newItem);
          setIsAddItemModalOpen(false);
        }}
      />

      <ManageCategoriesModal 
        isOpen={isManageCategoriesModalOpen}
        onClose={() => setIsManageCategoriesModalOpen(false)}
        categories={[...new Set(inventoryData.map(item => item.category))]}
        onSave={(categories) => {
          // Update categories
          console.log('Updated categories:', categories);
          setIsManageCategoriesModalOpen(false);
        }}
      />

      <ExportInventoryModal 
        isOpen={isExportInventoryModalOpen}
        onClose={() => setIsExportInventoryModalOpen(false)}
        data={filteredData}
        onExport={(exportConfig) => {
          // Handle export
          console.log('Exporting with config:', exportConfig);
          setIsExportInventoryModalOpen(false);
        }}
      />

      <StockAlertsModal 
        isOpen={isStockAlertsModalOpen}
        onClose={() => setIsStockAlertsModalOpen(false)}
        lowStockItems={inventoryData.filter(item => item.stock <= item.minStock)}
        onAction={(action, items) => {
          // Handle bulk actions
          console.log('Stock alert action:', action, items);
          setIsStockAlertsModalOpen(false);
        }}
      />

      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />

      <ReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => {
          setIsReorderModalOpen(false);
          setSelectedItemForReorder(null);
        }}
        item={selectedItemForReorder}
      />
    </ErrorBoundary>
  );
}
