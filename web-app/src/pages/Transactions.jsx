import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import Footer from '@components/shared/Footer';
import nexaLogo from '../../../assets/logos/logo_nexa.png';
import ErrorBoundary from '@components/common/ErrorBoundary';
import {
  HomeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  EllipsisHorizontalIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function Transactions() {
  const { t, ready } = useTranslation('transactions');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showFinancialReportModal, setShowFinancialReportModal] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [budgetProgressMenuOpen, setBudgetProgressMenuOpen] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [addIncomeModalOpen, setAddIncomeModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [incomeMenuOpen, setIncomeMenuOpen] = useState(false);
  const [expenseMenuOpen, setExpenseMenuOpen] = useState(false);
  const [budgetPerformanceMenuOpen, setBudgetPerformanceMenuOpen] = useState(false);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [recurringItems, setRecurringItems] = useState([]);

  // Handle period change
  const handlePeriodChange = period => {
    setSelectedPeriod(period);
    setDateMenuOpen(false);
    // Here you can add logic to fetch data for the selected period
    console.log('Period changed to:', period);
  };

  // Handle export functionality
  const handleExport = () => {
    console.log('Exporting data...');
    // Create CSV content
    const csvContent = [
      ['Date', 'Type', 'Category', 'Description', 'Amount', 'Status'],
      ...incomeTransactions.map(t => [t.date, 'Income', t.category, t.client, t.amount, t.status]),
      ...expenseTransactions.map(t => [
        t.date,
        'Expense',
        t.category,
        t.vendor,
        t.amount,
        t.status,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${selectedPeriod.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle add income modal
  const handleAddIncome = () => {
    setAddIncomeModalOpen(true);
  };

  const handleCloseIncomeModal = () => {
    setAddIncomeModalOpen(false);
  };

  // Handle add expense modal
  const handleAddExpense = () => {
    setAddExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    setAddExpenseModalOpen(false);
  };

  // Handle dropdown menus
  const handleIncomeMenuToggle = () => {
    setIncomeMenuOpen(!incomeMenuOpen);
    setExpenseMenuOpen(false);
  };

  const handleExpenseMenuToggle = () => {
    setExpenseMenuOpen(!expenseMenuOpen);
    setIncomeMenuOpen(false);
  };

  const handleBudgetPerformanceMenuToggle = () => {
    setBudgetPerformanceMenuOpen(!budgetPerformanceMenuOpen);
  };

  const handleExportIncomeData = () => {
    const csvContent = incomeTransactions
      .map(t => `${t.date},${t.category},${t.client},${t.amount},${t.status}`)
      .join('\n');
    const blob = new Blob([`Date,Category,Client,Amount,Status\n${csvContent}`], {
      type: 'text/csv',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setIncomeMenuOpen(false);
  };

  const handleExportExpenseData = () => {
    const csvContent = expenseTransactions
      .map(t => `${t.date},${t.category},${t.vendor},${t.amount},${t.status}`)
      .join('\n');
    const blob = new Blob([`Date,Category,Vendor,Amount,Status\n${csvContent}`], {
      type: 'text/csv',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setExpenseMenuOpen(false);
  };

  // Handle quick actions
  const handleAdjustBudget = () => {
    setShowBudgetModal(true);
  };

  const handleCloseBudgetModal = () => {
    setShowBudgetModal(false);
  };

  const handleUpdateBudget = (categoryId, newBudget) => {
    setBudgetCategories(prev =>
      prev.map(cat => (cat.id === categoryId ? { ...cat, budget: newBudget } : cat)),
    );
  };

  const handleAddBudgetCategory = () => {
    setShowBudgetModal(true);
  };

  const handleAddNewBudgetCategory = () => {
    const newCategory = {
      id: budgetCategories.length + 1,
      name: 'New Category',
      budget: 1000,
      spent: 0,
    };
    setBudgetCategories(prev => [...prev, newCategory]);
  };

  const handleFinancialReport = () => {
    setShowFinancialReportModal(true);
  };

  const handleForecastTool = () => {
    setShowForecastModal(true);
  };

  const handleRecurringItems = () => {
    setShowRecurringModal(true);
  };

  const handleCloseFinancialReportModal = () => {
    setShowFinancialReportModal(false);
  };

  const handleCloseForecastModal = () => {
    setShowForecastModal(false);
  };

  const handleCloseRecurringModal = () => {
    setShowRecurringModal(false);
  };

  const handleAddRecurringItem = () => {
    const newItem = {
      id: recurringItems.length + 1,
      name: 'New Recurring Item',
      amount: 0,
      frequency: 'Monthly',
      category: 'Other',
      nextDate: new Date().toISOString().split('T')[0],
    };
    setRecurringItems(prev => [...prev, newItem]);
  };

  const handleUpdateRecurringItem = (itemId, field, value) => {
    setRecurringItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, [field]: value } : item)),
    );
  };

  const handleDeleteRecurringItem = itemId => {
    setRecurringItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (budgetProgressMenuOpen) {
        const menuElement = document.querySelector('.budget-progress-menu');
        if (menuElement && !menuElement.contains(event.target)) {
          setBudgetProgressMenuOpen(false);
        }
      }
      if (dateMenuOpen) {
        const dateMenuElement = document.querySelector('.date-menu-container');
        if (dateMenuElement && !dateMenuElement.contains(event.target)) {
          setDateMenuOpen(false);
        }
      }
      if (incomeMenuOpen) {
        const incomeMenuElement = document.querySelector('.income-menu-container');
        if (incomeMenuElement && !incomeMenuElement.contains(event.target)) {
          setIncomeMenuOpen(false);
        }
      }
      if (expenseMenuOpen) {
        const expenseMenuElement = document.querySelector('.expense-menu-container');
        if (expenseMenuElement && !expenseMenuElement.contains(event.target)) {
          setExpenseMenuOpen(false);
        }
      }
      if (budgetPerformanceMenuOpen) {
        const budgetPerformanceMenuElement = document.querySelector(
          '.budget-performance-menu-container',
        );
        if (budgetPerformanceMenuElement && !budgetPerformanceMenuElement.contains(event.target)) {
          setBudgetPerformanceMenuOpen(false);
        }
      }
    };

    if (
      budgetProgressMenuOpen ||
      dateMenuOpen ||
      incomeMenuOpen ||
      expenseMenuOpen ||
      budgetPerformanceMenuOpen
    ) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    budgetProgressMenuOpen,
    dateMenuOpen,
    incomeMenuOpen,
    expenseMenuOpen,
    budgetPerformanceMenuOpen,
  ]);

  // Safe translation function that handles loading state and interpolation
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) return fallback;
    return t(key, options);
  };

  // Empty financial data - to be populated from real data
  const financialData = {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    incomeProgress: 0,
    expenseProgress: 0,
    savingsRate: 0,
  };

  // Empty income transactions - to be populated from real data
  const incomeTransactions = [];

  // Empty expense transactions - to be populated from real data
  const expenseTransactions = [];

  // Empty budget performance - to be populated from real data
  const budgetPerformance = [];

  // ALL useEffect hooks must be called before any conditional returns
  useEffect(() => {
    setLoading(false);
  }, []);

  // Show loading state if translations are not ready or component is loading
  if (!ready || loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Main Content */}
        <div className='flex flex-col'>
          {/* Breadcrumb */}
          <div className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
            <nav className='flex items-center space-x-2 text-base'>
              <HomeIcon className='h-5 w-5 text-blue-600' />
              <button
                onClick={() => navigate('/dashboard')}
                className='text-blue-600 hover:text-blue-700 font-medium transition-colors'
              >
                Dashboard
              </button>
              <ChevronRightIcon className='h-5 w-5 text-gray-400' />
              <span className='text-gray-600 font-bold'>
                {safeT('breadcrumb', {}, 'Income & Expenses')}
              </span>
            </nav>
          </div>

          {/* Page Content */}
          <div className='flex-1 px-6 py-6 space-y-6'>
            {/* Page Header */}
            <div className='flex items-center justify-between'>
              <h1 className='text-page-title text-gray-900'>
                {safeT('title', {}, 'Income & Expenses')}
              </h1>
              <div className='flex items-center gap-3'>
                {/* Date Selector */}
                <div className='relative date-menu-container'>
                  <button
                    onClick={() => setDateMenuOpen(!dateMenuOpen)}
                    className='flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors'
                  >
                    <CalendarIcon className='w-4 h-4 text-gray-600' />
                    <span className='text-nav-text text-gray-700'>
                      {safeT(`period.${selectedPeriod.toLowerCase()}`, {}, selectedPeriod)}
                    </span>
                    <ChevronDownIcon className='w-4 h-4 text-gray-600' />
                  </button>
                  {dateMenuOpen && (
                    <div className='absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-full'>
                      <button
                        onClick={() => handlePeriodChange('Monthly')}
                        className='block w-full text-left px-4 py-2 text-nav-text text-gray-700 hover:bg-gray-50'
                      >
                        {safeT('period.monthly', {}, 'Monthly')}
                      </button>
                      <button
                        onClick={() => handlePeriodChange('Quarterly')}
                        className='block w-full text-left px-4 py-2 text-nav-text text-gray-700 hover:bg-gray-50'
                      >
                        {safeT('period.quarterly', {}, 'Quarterly')}
                      </button>
                      <button
                        onClick={() => handlePeriodChange('Yearly')}
                        className='block w-full text-left px-4 py-2 text-nav-text text-gray-700 hover:bg-gray-50'
                      >
                        {safeT('period.yearly', {}, 'Yearly')}
                      </button>
                    </div>
                  )}
                </div>
                {/* Export Button */}
                <button
                  onClick={handleExport}
                  className='bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors'
                >
                  <DocumentArrowDownIcon className='w-4 h-4' />
                  <span className='text-button-text'>{safeT('actions.export', {}, 'Export')}</span>
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className='grid grid-cols-3 gap-6'>
              {/* Total Income Card */}
              <div className='bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-primary-200 hover:border-primary-300'>
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md'>
                      <ArrowUpIcon className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <p className='text-card-title text-blue-700'>
                        {safeT('summary.totalIncome', {}, 'Total Income')}
                      </p>
                      <p className='text-kpi-value text-blue-900'>
                        €{financialData.totalIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm'>
                    <ArrowUpIcon className='w-3 h-3' />
                    0%
                  </div>
                </div>
                <div className='w-full bg-blue-200 rounded-full h-3 mb-2 shadow-inner'>
                  <div
                    className='bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm'
                    style={{ width: `${financialData.incomeProgress}%` }}
                  ></div>
                </div>
                <div className='flex justify-between text-subtitle text-blue-600'>
                  <span>{safeT('summary.budget', { amount: '0' }, 'Budget: €0')}</span>
                  <span>{safeT('summary.ofBudget', { percent: 0 }, '0% of budget')}</span>
                </div>
              </div>

              {/* Total Expenses Card */}
              <div className='bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-red-200 hover:border-red-300'>
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md'>
                      <ArrowDownIcon className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <p className='text-card-title text-red-700'>
                        {safeT('summary.totalExpenses', {}, 'Total Expenses')}
                      </p>
                      <p className='text-kpi-value text-red-900'>
                        €{financialData.totalExpenses.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm'>
                    <ArrowDownIcon className='w-3 h-3' />
                    0%
                  </div>
                </div>
                <div className='w-full bg-red-200 rounded-full h-3 mb-2 shadow-inner'>
                  <div
                    className='bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full shadow-sm'
                    style={{ width: `${financialData.expenseProgress}%` }}
                  ></div>
                </div>
                <div className='flex justify-between text-xs text-red-600 font-medium'>
                  <span>{safeT('summary.budget', { amount: '0' }, 'Budget: €0')}</span>
                  <span>{safeT('summary.ofBudget', { percent: 0 }, '0% of budget')}</span>
                </div>
              </div>

              {/* Net Profit Card */}
              <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-200 hover:border-green-300'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md'>
                      <ChartBarIcon className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <p className='text-card-title text-green-700'>
                        {safeT('summary.netProfit', {}, 'Net Profit')}
                      </p>
                      <p className='text-kpi-value text-green-900'>
                        €{financialData.netProfit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm'>
                    <ArrowUpIcon className='w-3 h-3' />
                    0%
                  </div>
                </div>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-green-700 text-sm font-medium'>
                    {safeT('summary.savingsRate', {}, 'Savings Rate')}:
                  </span>
                  <span className='font-bold text-green-900'>{financialData.savingsRate}%</span>
                  <div className='flex-1 bg-green-200 rounded-full h-3 shadow-inner'>
                    <div
                      className='bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full shadow-sm'
                      style={{ width: `${financialData.savingsRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className='flex justify-between text-xs text-green-600 font-medium'>
                  <span>{financialData.savingsRate}%</span>
                  <span>{safeT('summary.savingsRate', {}, 'Savings Rate')}</span>
                </div>
              </div>
            </div>

            {/* Charts, Budget Progress and Quick Actions Row */}
            <div className='grid grid-cols-6 gap-6'>
              {/* Income vs Expenses Chart */}
              <div className='col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-section-title text-gray-800'>
                    {safeT('charts.incomeVsExpenses', {}, 'Income vs Expenses')}
                  </h3>
                  <div className='flex items-center gap-2 bg-gray-50 p-1 rounded-lg'>
                    <button
                      onClick={() => handlePeriodChange('Monthly')}
                      className={`px-3 py-1.5 rounded-md text-nav-text shadow-sm transition-colors ${
                        selectedPeriod === 'Monthly'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {safeT('period.monthly', {}, 'Monthly')}
                    </button>
                    <button
                      onClick={() => handlePeriodChange('Quarterly')}
                      className={`px-3 py-1.5 text-nav-text transition-colors ${
                        selectedPeriod === 'Quarterly'
                          ? 'bg-blue-500 text-white rounded-md shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {safeT('period.quarterly', {}, 'Quarterly')}
                    </button>
                    <button
                      onClick={() => handlePeriodChange('Yearly')}
                      className={`px-3 py-1.5 text-nav-text transition-colors ${
                        selectedPeriod === 'Yearly'
                          ? 'bg-blue-500 text-white rounded-md shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {safeT('period.yearly', {}, 'Yearly')}
                    </button>
                  </div>
                </div>
                <div className='h-64 bg-gradient-to-t from-gray-50 to-white rounded-lg flex items-end justify-center p-6 mb-4 relative overflow-hidden'>
                  {/* Background Grid */}
                  <div className='absolute inset-0 opacity-10'>
                    <div
                      className='h-full w-full'
                      style={{
                        backgroundImage:
                          'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                    ></div>
                  </div>

                  {/* Chart Bars */}
                  <div className='flex items-end gap-3 relative z-10'>
                    {/* Week 1 */}
                    <div className='flex items-end gap-1'>
                      <div className='w-6 h-2 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                      <div className='w-6 h-2 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                    </div>
                    {/* Week 2 */}
                    <div className='flex items-end gap-1'>
                      <div className='w-6 h-2 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                      <div className='w-6 h-2 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                    </div>
                    {/* Week 3 */}
                    <div className='flex items-end gap-1'>
                      <div className='w-6 h-2 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                      <div className='w-6 h-2 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                    </div>
                    {/* Week 4 */}
                    <div className='flex items-end gap-1'>
                      <div className='w-6 h-2 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                      <div className='w-6 h-2 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                    </div>
                  </div>

                  {/* Chart Labels */}
                  <div className='absolute bottom-2 left-6 right-6 flex justify-between text-xs text-gray-500'>
                    <span>{safeT('period.week1', {}, 'Week 1')}</span>
                    <span>{safeT('period.week2', {}, 'Week 2')}</span>
                    <span>{safeT('period.week3', {}, 'Week 3')}</span>
                    <span>{safeT('period.week4', {}, 'Week 4')}</span>
                  </div>
                </div>
                <div className='flex items-center justify-center gap-8 bg-gray-50 rounded-lg p-3'>
                  <div className='flex items-center gap-2'>
                    <div className='w-4 h-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded shadow-sm'></div>
                    <span className='text-blue-600 font-medium text-sm'>
                      {safeT('charts.income', {}, 'Income')}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-4 h-4 bg-gradient-to-r from-red-500 to-red-400 rounded shadow-sm'></div>
                    <span className='text-red-500 font-medium text-sm'>
                      {safeT('charts.expenses', {}, 'Expenses')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Budget Progress */}
              <div className='col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-section-title text-gray-800'>
                    {safeT('charts.budgetProgress', {}, 'Budget Progress')}
                  </h3>
                  <div className='relative budget-progress-menu'>
                    <button
                      onClick={() => {
                        console.log(
                          'Budget menu button clicked, current state:',
                          budgetProgressMenuOpen,
                        );
                        setBudgetProgressMenuOpen(!budgetProgressMenuOpen);
                      }}
                      className='p-1 hover:bg-gray-100 rounded-full transition-colors'
                    >
                      <EllipsisHorizontalIcon className='w-4 h-4 text-gray-400' />
                    </button>
                    {budgetProgressMenuOpen && (
                      <div className='absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10'>
                        <button
                          onClick={() => {
                            setBudgetProgressMenuOpen(false);
                            handleAdjustBudget();
                          }}
                          className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
                        >
                          <ChartBarIcon className='w-4 h-4' />
                          {safeT('quickActions.adjustBudget', {}, 'Adjust Budget')}
                        </button>
                        <button
                          onClick={() => {
                            setBudgetProgressMenuOpen(false);
                            console.log('Export budget report');
                          }}
                          className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
                        >
                          <DocumentArrowDownIcon className='w-4 h-4' />
                          Export Budget Report
                        </button>
                        <button
                          onClick={() => {
                            setBudgetProgressMenuOpen(false);
                            console.log('Reset budget period');
                          }}
                          className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
                        >
                          <CalendarIcon className='w-4 h-4' />
                          Reset Budget Period
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-6 mb-6'>
                  <div className='text-center'>
                    <p className='text-card-title text-blue-600 mb-3'>
                      {safeT('summary.income', {}, 'Income')}
                    </p>
                    <div className='w-28 h-28 mx-auto mb-3 relative'>
                      {/* Background Circle */}
                      <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='#E5E7EB'
                          strokeWidth='6'
                          fill='none'
                        />
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='url(#blueGradient)'
                          strokeWidth='6'
                          fill='none'
                          strokeDasharray={`${financialData.incomeProgress * 2.51} 251`}
                          strokeLinecap='round'
                          className='drop-shadow-sm'
                        />
                        <defs>
                          <linearGradient id='blueGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                            <stop offset='0%' stopColor='#3B82F6' />
                            <stop offset='100%' stopColor='#1D4ED8' />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Percentage in center */}
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <span className='text-card-metric text-blue-600'>
                          {financialData.incomeProgress}%
                        </span>
                      </div>
                    </div>
                    <p className='text-card-metric text-blue-900'>
                      €{financialData.totalIncome.toLocaleString()}
                    </p>
                    <p className='text-subtitle text-blue-600'>
                      {safeT('budgetInfo.of', { amount: '0' }, 'of €0')}
                    </p>
                  </div>
                  <div className='text-center'>
                    <p className='text-card-title text-red-600 mb-3'>
                      {safeT('summary.expenses', {}, 'Expenses')}
                    </p>
                    <div className='w-28 h-28 mx-auto mb-3 relative'>
                      {/* Background Circle */}
                      <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='#E5E7EB'
                          strokeWidth='6'
                          fill='none'
                        />
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='url(#redGradient)'
                          strokeWidth='6'
                          fill='none'
                          strokeDasharray={`${financialData.expenseProgress * 2.51} 251`}
                          strokeLinecap='round'
                          className='drop-shadow-sm'
                        />
                        <defs>
                          <linearGradient id='redGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                            <stop offset='0%' stopColor='#EF4444' />
                            <stop offset='100%' stopColor='#DC2626' />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Percentage in center */}
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <span className='text-card-metric text-red-600'>
                          {financialData.expenseProgress}%
                        </span>
                      </div>
                    </div>
                    <p className='text-card-metric text-red-900'>
                      €{financialData.totalExpenses.toLocaleString()}
                    </p>
                    <p className='text-subtitle text-red-600'>
                      {safeT('budgetInfo.of', { amount: '0' }, 'of €0')}
                    </p>
                  </div>
                </div>
                <div className='border-t border-gray-100 pt-4 space-y-3 bg-gray-50 rounded-lg p-4'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600 font-medium'>
                      {safeT('budgetInfo.budgetPeriod', {}, 'Budget Period:')}
                    </span>
                    <span className='font-semibold text-gray-800'>
                      {safeT('budgetInfo.noPeriod', {}, 'No period set')}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600 font-medium'>
                      {safeT('budgetInfo.remainingDays', {}, 'Remaining Days:')}
                    </span>
                    <span className='font-semibold text-orange-600'>
                      {safeT('budgetInfo.noDays', {}, '0 days')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className='col-span-2 bg-white rounded-xl shadow-sm p-6'>
                <h3 className='text-section-title mb-4'>
                  {safeT('quickActions.title', {}, 'Quick Actions')}
                </h3>
                <div className='grid grid-cols-2 gap-4 mb-6'>
                  <button
                    onClick={handleAdjustBudget}
                    className='relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-xl flex flex-col items-center gap-3 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group'
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    }}
                  >
                    <div className='absolute inset-0 opacity-10'>
                      <div className='absolute top-2 left-2 w-4 h-4 bg-white rounded-full'></div>
                      <div className='absolute top-8 right-4 w-2 h-2 bg-white rounded-full'></div>
                      <div className='absolute bottom-4 left-6 w-3 h-3 bg-white rounded-full'></div>
                      <div className='absolute bottom-2 right-2 w-5 h-5 bg-white rounded-full'></div>
                    </div>
                    <ChartBarIcon className='w-8 h-8 relative z-10 group-hover:scale-110 transition-transform duration-300' />
                    <span className='text-sm font-semibold relative z-10 text-center leading-tight'>
                      {safeT('quickActions.adjustBudget', {}, 'Adjust Budget')}
                    </span>
                  </button>
                  <button
                    onClick={handleFinancialReport}
                    className='relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl flex flex-col items-center gap-3 hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group'
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                  >
                    <div className='absolute inset-0 opacity-10'>
                      <div className='absolute top-4 left-4 w-3 h-3 bg-white rounded-full'></div>
                      <div className='absolute top-2 right-6 w-4 h-4 bg-white rounded-full'></div>
                      <div className='absolute bottom-6 left-2 w-2 h-2 bg-white rounded-full'></div>
                      <div className='absolute bottom-2 right-4 w-6 h-6 bg-white rounded-full'></div>
                    </div>
                    <DocumentTextIcon className='w-8 h-8 relative z-10 group-hover:scale-110 transition-transform duration-300' />
                    <span className='text-sm font-semibold relative z-10 text-center leading-tight'>
                      {safeT('quickActions.financialReport', {}, 'Financial Report')}
                    </span>
                  </button>
                  <button
                    onClick={handleForecastTool}
                    className='relative overflow-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl flex flex-col items-center gap-3 hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group'
                    style={{
                      background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                    }}
                  >
                    <div className='absolute inset-0 opacity-10'>
                      <div className='absolute top-3 left-6 w-5 h-5 bg-white rounded-full'></div>
                      <div className='absolute top-6 right-2 w-3 h-3 bg-white rounded-full'></div>
                      <div className='absolute bottom-3 left-3 w-4 h-4 bg-white rounded-full'></div>
                      <div className='absolute bottom-6 right-6 w-2 h-2 bg-white rounded-full'></div>
                    </div>
                    <ChartBarIcon className='w-8 h-8 relative z-10 group-hover:scale-110 transition-transform duration-300' />
                    <span className='text-sm font-semibold relative z-10 text-center leading-tight'>
                      {safeT('quickActions.forecastTool', {}, 'Forecast Tool')}
                    </span>
                  </button>
                  <button
                    onClick={handleRecurringItems}
                    className='relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl flex flex-col items-center gap-3 hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group'
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    }}
                  >
                    <div className='absolute inset-0 opacity-10'>
                      <div className='absolute top-2 left-4 w-6 h-6 bg-white rounded-full'></div>
                      <div className='absolute top-5 right-5 w-2 h-2 bg-white rounded-full'></div>
                      <div className='absolute bottom-4 left-2 w-3 h-3 bg-white rounded-full'></div>
                      <div className='absolute bottom-2 right-3 w-4 h-4 bg-white rounded-full'></div>
                    </div>
                    <CalendarIcon className='w-8 h-8 relative z-10 group-hover:scale-110 transition-transform duration-300' />
                    <span className='text-sm font-semibold relative z-10 text-center leading-tight'>
                      {safeT('quickActions.recurringItems', {}, 'Recurring Items')}
                    </span>
                  </button>
                </div>

                {/* Upcoming Tasks */}
                <div className='bg-gray-50 rounded-lg p-4'>
                  <h4 className='text-card-title mb-3'>
                    {safeT('upcomingTasks.title', {}, 'Upcoming Financial Tasks')}
                  </h4>
                  <div className='space-y-2 text-sm'>
                    <div className='text-gray-500 text-center py-4'>
                      {safeT('upcomingTasks.noTasks', {}, 'No upcoming tasks')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Tables */}
            <div className='grid grid-cols-2 gap-6'>
              {/* Income Transactions */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-section-title'>
                    {safeT('income.title', {}, 'Income Transactions')}
                  </h3>
                  <div className='flex items-center gap-3'>
                    <div className='relative income-menu-container'>
                      <button
                        onClick={handleIncomeMenuToggle}
                        className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'
                      >
                        <EllipsisHorizontalIcon className='w-5 h-5' />
                      </button>
                      {incomeMenuOpen && (
                        <div className='absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10'>
                          <button
                            onClick={handleExportIncomeData}
                            className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
                          >
                            <svg
                              className='w-4 h-4'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                              />
                            </svg>
                            {safeT('actions.exportIncomeData', {}, 'Export Income Data')}
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAddIncome}
                      className='bg-blue-600 text-white px-4 py-2 rounded-lg text-button-text flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm'
                    >
                      <PlusIcon className='w-4 h-4' />
                      {safeT('actions.addIncome', {}, 'Add Income')}
                    </button>
                  </div>
                </div>

                {/* Table Header */}
                <div className='grid grid-cols-5 gap-4 bg-gray-50 px-3 py-3 text-table-header text-gray-500 uppercase tracking-wide'>
                  <span>{safeT('table.date', {}, 'Date')}</span>
                  <span>{safeT('table.category', {}, 'Category')}</span>
                  <span>{safeT('table.client', {}, 'Client')}</span>
                  <span className='text-right'>{safeT('table.amount', {}, 'Amount')}</span>
                  <span className='text-center'>{safeT('table.status', {}, 'Status')}</span>
                </div>

                {/* Table Body */}
                <div className='border-t border-gray-200'>
                  {incomeTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className='grid grid-cols-5 gap-4 px-3 py-4 border-b border-gray-100 text-body'
                    >
                      <span className='text-gray-900'>{transaction.date}</span>
                      <div className='flex items-center gap-2'>
                        <div className={`w-2 h-2 rounded-full ${transaction.categoryColor}`}></div>
                        <span>
                          {safeT(
                            `income.category.${transaction.category.toLowerCase()}`,
                            {},
                            transaction.category,
                          )}
                        </span>
                      </div>
                      <span className='text-gray-900'>{transaction.client}</span>
                      <span className='text-right font-medium'>
                        +€{transaction.amount.toLocaleString()}
                      </span>
                      <div className='flex justify-center'>
                        <span className='bg-green-100 text-green-800 px-2 py-1 rounded-full text-caption font-semibold'>
                          {safeT(
                            `income.status.${transaction.status.toLowerCase()}`,
                            {},
                            transaction.status,
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Transactions */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-section-title'>
                    {safeT('expenses.title', {}, 'Expense Transactions')}
                  </h3>
                  <div className='flex items-center gap-3'>
                    <div className='relative expense-menu-container'>
                      <button
                        onClick={handleExpenseMenuToggle}
                        className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'
                      >
                        <EllipsisHorizontalIcon className='w-5 h-5' />
                      </button>
                      {expenseMenuOpen && (
                        <div className='absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10'>
                          <button
                            onClick={handleExportExpenseData}
                            className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
                          >
                            <svg
                              className='w-4 h-4'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                              />
                            </svg>
                            {safeT('actions.exportExpenseData', {}, 'Export Expense Data')}
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAddExpense}
                      className='bg-red-500 text-white px-4 py-2 rounded-lg text-button-text flex items-center gap-2 hover:bg-red-600 transition-colors shadow-sm'
                    >
                      <PlusIcon className='w-4 h-4' />
                      {safeT('actions.addExpense', {}, 'Add Expense')}
                    </button>
                  </div>
                </div>

                {/* Table Header */}
                <div className='grid grid-cols-5 gap-4 bg-gray-50 px-3 py-3 text-table-header text-gray-500 uppercase tracking-wide'>
                  <span>{safeT('table.date', {}, 'Date')}</span>
                  <span>{safeT('table.category', {}, 'Category')}</span>
                  <span>{safeT('table.client', {}, 'Client')}</span>
                  <span className='text-right'>{safeT('table.amount', {}, 'Amount')}</span>
                  <span className='text-center'>{safeT('table.status', {}, 'Status')}</span>
                </div>

                {/* Table Body */}
                <div className='border-t border-gray-200'>
                  {expenseTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className='grid grid-cols-5 gap-4 px-3 py-4 border-b border-gray-100 text-body'
                    >
                      <span className='text-gray-900'>{transaction.date}</span>
                      <span>
                        {safeT(
                          `expenses.category.${transaction.category.replace(/ /g, '').toLowerCase()}`,
                          {},
                          transaction.category,
                        )}
                      </span>
                      <span className='text-gray-900'>{transaction.vendor}</span>
                      <span className='text-right font-medium'>
                        -€{transaction.amount.toLocaleString()}
                      </span>
                      <div className='flex justify-center'>
                        <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-caption font-semibold'>
                          {safeT(
                            `expenses.status.${transaction.status.toLowerCase()}`,
                            {},
                            transaction.status,
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Budget Performance, Cash Flow */}
            <div className='grid grid-cols-2 gap-6'>
              {/* Budget Performance */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-section-title'>
                    {safeT('budgetPerformance.title', {}, 'Budget Performance')}
                  </h3>
                  <div className='relative budget-performance-menu-container'>
                    <button
                      onClick={handleBudgetPerformanceMenuToggle}
                      className='p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                    >
                      <EllipsisHorizontalIcon className='w-5 h-5 text-gray-500 hover:text-gray-700' />
                    </button>
                    {budgetPerformanceMenuOpen && (
                      <div className='absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-20 min-w-64 animate-in slide-in-from-top-2 duration-200'>
                        <button
                          onClick={() => {
                            console.log('Export budget performance data');
                            setBudgetPerformanceMenuOpen(false);
                          }}
                          className='w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 flex items-center gap-3 group'
                        >
                          <svg
                            className='w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                          </svg>
                          <span className='font-medium'>
                            {safeT('actions.exportBudgetData', {}, 'Export Budget Data')}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            console.log('View budget analytics');
                            setBudgetPerformanceMenuOpen(false);
                          }}
                          className='w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 flex items-center gap-3 group'
                        >
                          <svg
                            className='w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                            />
                          </svg>
                          <span className='font-medium'>
                            {safeT('actions.viewAnalytics', {}, 'View Analytics')}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className='space-y-6'>
                  {budgetPerformance.map((item, index) => (
                    <div key={index} className='space-y-1'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className='font-medium'>
                            {safeT(
                              `income.category.${item.category.toLowerCase()}`,
                              {},
                              item.category,
                            )}
                          </span>
                        </div>
                        <div className='flex items-center gap-1'>
                          {item.status === 'under' ? (
                            <ArrowDownIcon className='w-4 h-4 text-green-600' />
                          ) : (
                            <ArrowUpIcon className='w-4 h-4 text-red-600' />
                          )}
                          <span
                            className={item.status === 'under' ? 'text-green-600' : 'text-red-600'}
                          >
                            {item.status === 'under' ? 'Under Budget' : 'Over Budget'}
                          </span>
                        </div>
                      </div>
                      <div className='flex justify-between text-body text-gray-500'>
                        <span>Actual: €{item.actual.toLocaleString()}</span>
                        <span>Budget: €{item.budget.toLocaleString()}</span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className={`h-2 rounded-full ${item.status === 'under' ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min((item.actual / item.budget) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className='text-right'>
                        <span
                          className={`text-caption ${item.status === 'under' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {item.status === 'under' ? '-' : '+'}
                          {Math.abs(item.variance).toLocaleString()} ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleAddBudgetCategory}
                    className='w-full border-2 border-dashed border-gray-300 rounded-xl py-4 flex items-center justify-center gap-3 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group font-medium'
                  >
                    <div className='w-6 h-6 border-2 border-current rounded-full flex items-center justify-center group-hover:scale-110 transition-transform'>
                      <PlusIcon className='w-3 h-3' />
                    </div>
                    <span>{safeT('budgetPerformance.addCategory', {}, 'Add Budget Category')}</span>
                  </button>
                </div>
              </div>

              {/* Cash Flow Forecast */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-section-title'>
                    {safeT('cashFlow.title', {}, 'Cash Flow Forecast')}
                  </h3>
                  <div className='bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-caption'>
                    {safeT('cashFlow.next90Days', {}, 'Next 90 Days')}
                  </div>
                </div>
                {/* Chart Container */}
                <div className='h-80 bg-white rounded-lg mb-4 relative'>
                  {/* Y-axis labels */}
                  <div className='absolute left-0 top-0 h-full flex flex-col justify-between text-caption text-gray-400 py-2'>
                    <span>60000</span>
                    <span>45000</span>
                    <span>30000</span>
                    <span>15000</span>
                    <span>0</span>
                  </div>

                  {/* Chart area */}
                  <div className='ml-12 mr-4 h-full relative'>
                    {/* Grid lines */}
                    <div className='absolute inset-0'>
                      <div className='h-full flex flex-col justify-between'>
                        <div className='border-t border-gray-200 border-dotted'></div>
                        <div className='border-t border-gray-200 border-dotted'></div>
                        <div className='border-t border-gray-200 border-dotted'></div>
                        <div className='border-t border-gray-200 border-dotted'></div>
                        <div className='border-t border-gray-200'></div>
                      </div>
                    </div>

                    {/* Line chart */}
                    <svg className='w-full h-full' viewBox='0 0 400 160' preserveAspectRatio='none'>
                      <defs>
                        {/* Gradient for the line */}
                        <linearGradient id='lineGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                          <stop offset='0%' stopColor='#3B82F6' />
                          <stop offset='50%' stopColor='#1D4ED8' />
                          <stop offset='100%' stopColor='#2563EB' />
                        </linearGradient>
                        {/* Gradient for the area under the curve */}
                        <linearGradient id='areaGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
                          <stop offset='0%' stopColor='#3B82F6' stopOpacity='0.3' />
                          <stop offset='100%' stopColor='#3B82F6' stopOpacity='0.05' />
                        </linearGradient>
                        {/* Drop shadow filter */}
                        <filter id='dropshadow' x='-20%' y='-20%' width='140%' height='140%'>
                          <feDropShadow
                            dx='0'
                            dy='2'
                            stdDeviation='3'
                            floodColor='#3B82F6'
                            floodOpacity='0.2'
                          />
                        </filter>
                      </defs>

                      {/* Area under the curve */}
                      <path
                        d='M 20,80 Q 60,70 100,60 Q 140,65 180,70 Q 220,60 260,50 Q 300,55 340,60 Q 360,65 380,70 L 380,160 L 20,160 Z'
                        fill='url(#areaGradient)'
                      />

                      {/* Smooth curved line */}
                      <path
                        d='M 20,80 Q 60,70 100,60 Q 140,65 180,70 Q 220,60 260,50 Q 300,55 340,60 Q 360,65 380,70'
                        fill='none'
                        stroke='url(#lineGradient)'
                        strokeWidth='3'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        filter='url(#dropshadow)'
                        className='animate-pulse'
                        style={{
                          strokeDasharray: '1000',
                          strokeDashoffset: '1000',
                          animation: 'drawLine 2s ease-in-out forwards',
                        }}
                      />

                      {/* Enhanced data points with glow effect */}
                      <circle
                        cx='20'
                        cy='80'
                        r='5'
                        fill='#FFFFFF'
                        stroke='#3B82F6'
                        strokeWidth='3'
                        filter='url(#dropshadow)'
                        className='animate-pulse'
                      />
                      <circle
                        cx='100'
                        cy='60'
                        r='5'
                        fill='#FFFFFF'
                        stroke='#1D4ED8'
                        strokeWidth='3'
                        filter='url(#dropshadow)'
                        className='animate-pulse'
                      />
                      <circle
                        cx='180'
                        cy='70'
                        r='5'
                        fill='#FFFFFF'
                        stroke='#2563EB'
                        strokeWidth='3'
                        filter='url(#dropshadow)'
                        className='animate-pulse'
                      />
                      <circle
                        cx='260'
                        cy='50'
                        r='5'
                        fill='#FFFFFF'
                        stroke='#1D4ED8'
                        strokeWidth='3'
                        filter='url(#dropshadow)'
                        className='animate-pulse'
                      />
                      <circle
                        cx='340'
                        cy='60'
                        r='5'
                        fill='#FFFFFF'
                        stroke='#3B82F6'
                        strokeWidth='3'
                        filter='url(#dropshadow)'
                        className='animate-pulse'
                      />
                      <circle
                        cx='380'
                        cy='70'
                        r='5'
                        fill='#FFFFFF'
                        stroke='#2563EB'
                        strokeWidth='3'
                        filter='url(#dropshadow)'
                        className='animate-pulse'
                      />

                      {/* Inner circles for data points */}
                      <circle cx='20' cy='80' r='2' fill='#3B82F6' />
                      <circle cx='100' cy='60' r='2' fill='#1D4ED8' />
                      <circle cx='180' cy='70' r='2' fill='#2563EB' />
                      <circle cx='260' cy='50' r='2' fill='#1D4ED8' />
                      <circle cx='340' cy='60' r='2' fill='#3B82F6' />
                      <circle cx='380' cy='70' r='2' fill='#2563EB' />
                    </svg>
                  </div>

                  {/* X-axis labels */}
                  <div className='absolute bottom-0 left-12 right-4 flex justify-between text-caption text-gray-400 pb-2'>
                    <span>Jun 30</span>
                    <span>Jul 15</span>
                    <span>Jul 30</span>
                    <span>Aug 15</span>
                    <span>Aug 30</span>
                  </div>
                </div>
                <div className='border-t border-gray-100 pt-4 space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>
                      {safeT('cashFlow.currentBalance', {}, 'Current Balance:')}
                    </span>
                    <span className='font-medium'>€0</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>
                      {safeT('cashFlow.projected', {}, 'Projected (Aug 30):')}
                    </span>
                    <span className='font-medium'>€0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>

        {/* Financial Report Modal */}
        {showFinancialReportModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto'>
              {/* Modal Header */}
              <div className='flex items-center justify-between p-6 border-b border-gray-200'>
                <h2 className='text-page-title text-gray-900'>
                  {safeT('financialReportModal.title', {}, 'Financial Report')}
                </h2>
                <button
                  onClick={handleCloseFinancialReportModal}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                >
                  <XMarkIcon className='w-6 h-6' />
                </button>
              </div>

              {/* Modal Content */}
              <div className='p-6'>
                <div className='grid grid-cols-2 gap-6 mb-6'>
                  {/* Summary Stats */}
                  <div className='space-y-4'>
                    <h3 className='text-section-title text-gray-800'>
                      {safeT('financialReportModal.summary', {}, 'Summary')}
                    </h3>
                    <div className='space-y-3'>
                      <div className='flex justify-between p-3 bg-blue-50 rounded-lg'>
                        <span className='text-blue-700'>
                          {safeT('financialReportModal.totalIncome', {}, 'Total Income')}
                        </span>
                        <span className='font-bold text-blue-900'>
                          €{financialData.totalIncome.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between p-3 bg-red-50 rounded-lg'>
                        <span className='text-red-700'>
                          {safeT('financialReportModal.totalExpenses', {}, 'Total Expenses')}
                        </span>
                        <span className='font-bold text-red-900'>
                          €{financialData.totalExpenses.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between p-3 bg-green-50 rounded-lg'>
                        <span className='text-green-700'>
                          {safeT('financialReportModal.netProfit', {}, 'Net Profit')}
                        </span>
                        <span className='font-bold text-green-900'>
                          €{financialData.netProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Report Options */}
                  <div className='space-y-4'>
                    <h3 className='text-section-title text-gray-800'>
                      {safeT('financialReportModal.reportOptions', {}, 'Report Options')}
                    </h3>
                    <div className='space-y-3'>
                      <button className='w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50'>
                        {safeT(
                          'financialReportModal.monthlyProfitLoss',
                          {},
                          'Monthly Profit & Loss',
                        )}
                      </button>
                      <button className='w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50'>
                        {safeT('financialReportModal.cashFlowStatement', {}, 'Cash Flow Statement')}
                      </button>
                      <button className='w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50'>
                        {safeT('financialReportModal.budgetVsActual', {}, 'Budget vs Actual')}
                      </button>
                      <button className='w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50'>
                        {safeT('financialReportModal.taxSummary', {}, 'Tax Summary')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className='flex items-center justify-end gap-3 pt-6 border-t border-gray-200'>
                  <button
                    onClick={handleCloseFinancialReportModal}
                    className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
                  >
                    {safeT('financialReportModal.close', {}, 'Close')}
                  </button>
                  <button className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2'>
                    <DocumentArrowDownIcon className='w-4 h-4' />
                    {safeT('financialReportModal.generateReport', {}, 'Generate Report')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Tool Modal */}
        {showForecastModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto'>
              {/* Modal Header */}
              <div className='flex items-center justify-between p-6 border-b border-gray-200'>
                <h2 className='text-page-title text-gray-900'>
                  {safeT('forecastModal.title', {}, 'Financial Forecast Tool')}
                </h2>
                <button
                  onClick={handleCloseForecastModal}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                >
                  <XMarkIcon className='w-6 h-6' />
                </button>
              </div>

              {/* Modal Content */}
              <div className='p-6'>
                <div className='space-y-6'>
                  {/* Forecast Period */}
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('forecastModal.forecastPeriod', {}, 'Forecast Period')}
                    </label>
                    <select className='w-full border border-gray-300 rounded px-3 py-2 text-body focus:border-blue-500 focus:outline-none'>
                      <option>{safeT('forecastModal.next3Months', {}, 'Next 3 Months')}</option>
                      <option>{safeT('forecastModal.next6Months', {}, 'Next 6 Months')}</option>
                      <option>{safeT('forecastModal.next12Months', {}, 'Next 12 Months')}</option>
                    </select>
                  </div>

                  {/* Forecast Results */}
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <h3 className='text-section-title text-gray-800 mb-4'>
                      {safeT('forecastModal.projectedResults', {}, 'Projected Results')}
                    </h3>
                    <div className='grid grid-cols-3 gap-4'>
                      <div className='text-center p-3 bg-white rounded-lg'>
                        <p className='text-sm text-gray-600'>
                          {safeT('forecastModal.projectedIncome', {}, 'Projected Income')}
                        </p>
                        <p className='text-xl font-bold text-blue-600'>€0</p>
                      </div>
                      <div className='text-center p-3 bg-white rounded-lg'>
                        <p className='text-sm text-gray-600'>
                          {safeT('forecastModal.projectedExpenses', {}, 'Projected Expenses')}
                        </p>
                        <p className='text-xl font-bold text-red-600'>€0</p>
                      </div>
                      <div className='text-center p-3 bg-white rounded-lg'>
                        <p className='text-sm text-gray-600'>
                          {safeT('forecastModal.projectedProfit', {}, 'Projected Profit')}
                        </p>
                        <p className='text-xl font-bold text-green-600'>€0</p>
                      </div>
                    </div>
                  </div>

                  {/* Assumptions */}
                  <div>
                    <h3 className='text-section-title text-gray-800 mb-3'>
                      {safeT('forecastModal.forecastAssumptions', {}, 'Forecast Assumptions')}
                    </h3>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between p-3 border border-gray-200 rounded-lg'>
                        <span>
                          {safeT('forecastModal.monthlyIncomeGrowth', {}, 'Monthly Income Growth')}
                        </span>
                        <input
                          type='number'
                          defaultValue='0'
                          className='w-20 text-right border border-gray-300 rounded px-2 py-1'
                        />
                        %
                      </div>
                      <div className='flex items-center justify-between p-3 border border-gray-200 rounded-lg'>
                        <span>
                          {safeT(
                            'forecastModal.monthlyExpenseGrowth',
                            {},
                            'Monthly Expense Growth',
                          )}
                        </span>
                        <input
                          type='number'
                          defaultValue='0'
                          className='w-20 text-right border border-gray-300 rounded px-2 py-1'
                        />
                        %
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className='flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200'>
                  <button
                    onClick={handleCloseForecastModal}
                    className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
                  >
                    {safeT('forecastModal.close', {}, 'Close')}
                  </button>
                  <button className='px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors'>
                    {safeT('forecastModal.updateForecast', {}, 'Update Forecast')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recurring Items Modal */}
        {showRecurringModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto'>
              {/* Modal Header */}
              <div className='flex items-center justify-between p-6 border-b border-gray-200'>
                <h2 className='text-page-title text-gray-900'>
                  {safeT('recurringModal.title', {}, 'Recurring Items')}
                </h2>
                <button
                  onClick={handleCloseRecurringModal}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                >
                  <XMarkIcon className='w-6 h-6' />
                </button>
              </div>

              {/* Modal Content */}
              <div className='p-6'>
                <div className='space-y-4 mb-6'>
                  {recurringItems.map(item => (
                    <div key={item.id} className='border border-gray-200 rounded-lg p-4'>
                      <div className='grid grid-cols-5 gap-4 items-center'>
                        <div>
                          <label className='block text-caption text-gray-500 mb-1'>
                            {safeT('recurringModal.name', {}, 'Name')}
                          </label>
                          <input
                            type='text'
                            value={item.name}
                            onChange={e =>
                              handleUpdateRecurringItem(item.id, 'name', e.target.value)
                            }
                            className='w-full border border-gray-300 rounded px-2 py-1 text-body focus:border-blue-500 focus:outline-none'
                          />
                        </div>
                        <div>
                          <label className='block text-caption text-gray-500 mb-1'>
                            {safeT('recurringModal.amount', {}, 'Amount')}
                          </label>
                          <input
                            type='number'
                            value={item.amount}
                            onChange={e =>
                              handleUpdateRecurringItem(
                                item.id,
                                'amount',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className='w-full border border-gray-300 rounded px-2 py-1 text-body focus:border-blue-500 focus:outline-none'
                          />
                        </div>
                        <div>
                          <label className='block text-caption text-gray-500 mb-1'>
                            {safeT('recurringModal.frequency', {}, 'Frequency')}
                          </label>
                          <select
                            value={item.frequency}
                            onChange={e =>
                              handleUpdateRecurringItem(item.id, 'frequency', e.target.value)
                            }
                            className='w-full border border-gray-300 rounded px-2 py-1 text-body focus:border-blue-500 focus:outline-none'
                          >
                            <option>{safeT('recurringModal.weekly', {}, 'Weekly')}</option>
                            <option>{safeT('recurringModal.monthly', {}, 'Monthly')}</option>
                            <option>{safeT('recurringModal.quarterly', {}, 'Quarterly')}</option>
                            <option>{safeT('recurringModal.yearly', {}, 'Yearly')}</option>
                          </select>
                        </div>
                        <div>
                          <label className='block text-caption text-gray-500 mb-1'>
                            {safeT('recurringModal.nextDate', {}, 'Next Date')}
                          </label>
                          <input
                            type='date'
                            value={item.nextDate}
                            onChange={e =>
                              handleUpdateRecurringItem(item.id, 'nextDate', e.target.value)
                            }
                            className='w-full border border-gray-300 rounded px-2 py-1 text-body focus:border-blue-500 focus:outline-none'
                          />
                        </div>
                        <div className='flex justify-end'>
                          <button
                            onClick={() => handleDeleteRecurringItem(item.id)}
                            className='text-red-500 hover:text-red-700 transition-colors'
                          >
                            <XMarkIcon className='w-4 h-4' />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Item Button */}
                <button
                  onClick={handleAddRecurringItem}
                  className='w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2'
                >
                  <PlusIcon className='w-5 h-5' />
                  {safeT('recurringModal.addNewItem', {}, 'Add New Recurring Item')}
                </button>

                {/* Modal Footer */}
                <div className='flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200'>
                  <button
                    onClick={handleCloseRecurringModal}
                    className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
                  >
                    {safeT('recurringModal.close', {}, 'Close')}
                  </button>
                  <button className='px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors'>
                    {safeT('recurringModal.saveChanges', {}, 'Save Changes')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Income Modal */}
        {addIncomeModalOpen && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden'>
              {/* Modal Header */}
              <div className='flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                    <PlusIcon className='w-5 h-5 text-blue-600' />
                  </div>
                  <div>
                    <h2 className='text-page-title text-gray-900'>
                      {safeT('incomeModal.title', {}, 'Add Income Transaction')}
                    </h2>
                    <p className='text-body text-gray-600 mt-1'>
                      {safeT('incomeModal.description', {}, 'Record a new income transaction')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseIncomeModal}
                  className='text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200'
                >
                  <XMarkIcon className='w-6 h-6' />
                </button>
              </div>

              {/* Modal Content */}
              <div className='p-6'>
                <form className='space-y-4'>
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('incomeModal.amount', {}, 'Amount')}
                    </label>
                    <input
                      type='number'
                      placeholder='0.00'
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                    />
                  </div>
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('incomeModal.category', {}, 'Category')}
                    </label>
                    <select className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'>
                      <option value=''>
                        {safeT('incomeModal.selectCategory', {}, 'Select category')}
                      </option>
                      <option value='consulting'>
                        {safeT('income.category.consulting', {}, 'Consulting')}
                      </option>
                      <option value='sales'>{safeT('income.category.sales', {}, 'Sales')}</option>
                      <option value='investment'>
                        {safeT('income.category.investment', {}, 'Investment')}
                      </option>
                      <option value='other'>{safeT('income.category.other', {}, 'Other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('incomeModal.client', {}, 'Client')}
                    </label>
                    <input
                      type='text'
                      placeholder={safeT('incomeModal.clientPlaceholder', {}, 'Enter client name')}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                    />
                  </div>
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('incomeModal.date', {}, 'Date')}
                    </label>
                    <input
                      type='date'
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                    />
                  </div>
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('incomeModal.description', {}, 'Description')}
                    </label>
                    <textarea
                      rows='3'
                      placeholder={safeT(
                        'incomeModal.descriptionPlaceholder',
                        {},
                        'Enter description (optional)',
                      )}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none'
                    ></textarea>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className='flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50'>
                <button
                  onClick={handleCloseIncomeModal}
                  className='px-6 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium'
                >
                  {safeT('incomeModal.cancel', {}, 'Cancel')}
                </button>
                <button
                  type='submit'
                  className='px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl'
                >
                  {safeT('incomeModal.save', {}, 'Add Income')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {addExpenseModalOpen && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden'>
              {/* Modal Header */}
              <div className='flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                    <PlusIcon className='w-5 h-5 text-red-600' />
                  </div>
                  <div>
                    <h2 className='text-page-title text-gray-900'>
                      {safeT('expenseModal.title', {}, 'Add Expense Transaction')}
                    </h2>
                    <p className='text-body text-gray-600 mt-1'>
                      {safeT('expenseModal.description', {}, 'Record a new expense transaction')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseExpenseModal}
                  className='text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200'
                >
                  <XMarkIcon className='w-6 h-6' />
                </button>
              </div>

              {/* Modal Content */}
              <div className='p-6'>
                <form className='space-y-4'>
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('expenseModal.amount', {}, 'Amount')}
                    </label>
                    <input
                      type='number'
                      placeholder='0.00'
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all'
                    />
                  </div>
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('expenseModal.category', {}, 'Category')}
                    </label>
                    <select className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all'>
                      <option value=''>
                        {safeT('expenseModal.selectCategory', {}, 'Select category')}
                      </option>
                      <option value='marketing'>
                        {safeT('expenses.category.marketing', {}, 'Marketing')}
                      </option>
                      <option value='operations'>
                        {safeT('expenses.category.operations', {}, 'Operations')}
                      </option>
                      <option value='travel'>
                        {safeT('expenses.category.travel', {}, 'Travel')}
                      </option>
                      <option value='equipment'>
                        {safeT('expenses.category.equipment', {}, 'Equipment')}
                      </option>
                      <option value='other'>{safeT('expenses.category.other', {}, 'Other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('expenseModal.vendor', {}, 'Vendor')}
                    </label>
                    <input
                      type='text'
                      placeholder={safeT('expenseModal.vendorPlaceholder', {}, 'Enter vendor name')}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all'
                    />
                  </div>
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('expenseModal.date', {}, 'Date')}
                    </label>
                    <input
                      type='date'
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all'
                    />
                  </div>
                  <div>
                    <label className='block text-body font-medium text-gray-700 mb-2'>
                      {safeT('expenseModal.description', {}, 'Description')}
                    </label>
                    <textarea
                      rows='3'
                      placeholder={safeT(
                        'expenseModal.descriptionPlaceholder',
                        {},
                        'Enter description (optional)',
                      )}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none'
                    ></textarea>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className='flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50'>
                <button
                  onClick={handleCloseExpenseModal}
                  className='px-6 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium'
                >
                  {safeT('expenseModal.cancel', {}, 'Cancel')}
                </button>
                <button
                  type='submit'
                  className='px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl'
                >
                  {safeT('expenseModal.save', {}, 'Add Expense')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Budget Modal */}
        {showBudgetModal && (
          <div className='fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden'>
              {/* Modal Header */}
              <div className='flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-blue-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className='text-page-title text-gray-900'>
                      {safeT('budgetModal.title', {}, 'Adjust Budget Categories')}
                    </h2>
                    <p className='text-body text-gray-600 mt-1'>
                      {safeT(
                        'budgetModal.description',
                        {},
                        'Manage your budget allocations and track spending',
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseBudgetModal}
                  className='text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200'
                >
                  <XMarkIcon className='w-6 h-6' />
                </button>
              </div>

              {/* Modal Content */}
              <div className='p-6 overflow-y-auto max-h-[calc(90vh-140px)]'>
                <div className='space-y-6 mb-8'>
                  {budgetCategories.map(category => {
                    const spentPercentage = (category.spent / category.budget) * 100;
                    const isOverBudget = spentPercentage > 100;
                    const remaining = category.budget - category.spent;

                    return (
                      <div
                        key={category.id}
                        className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200'
                      >
                        {/* Category Header */}
                        <div className='flex items-center justify-between mb-4'>
                          <div className='flex-1'>
                            <input
                              type='text'
                              value={category.name}
                              onChange={e => {
                                setBudgetCategories(prev =>
                                  prev.map(cat =>
                                    cat.id === category.id ? { ...cat, name: e.target.value } : cat,
                                  ),
                                );
                              }}
                              className='text-lg font-semibold text-gray-900 bg-transparent border-none outline-none focus:bg-gray-50 px-3 py-2 rounded-lg transition-colors w-full'
                              placeholder='Category name...'
                            />
                          </div>
                          <div className='flex items-center gap-4 ml-4'>
                            <div className='text-right'>
                              <div className='text-sm text-gray-500 mb-1'>Budget</div>
                              <div className='flex items-center gap-1'>
                                <span className='text-lg font-medium text-gray-700'>€</span>
                                <input
                                  type='number'
                                  value={category.budget}
                                  onChange={e =>
                                    handleUpdateBudget(category.id, parseInt(e.target.value) || 0)
                                  }
                                  className='w-24 text-right text-lg font-semibold border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all'
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Budget Overview */}
                        <div className='grid grid-cols-3 gap-4 mb-4'>
                          <div className='text-center p-3 bg-gray-50 rounded-lg'>
                            <div className='text-caption text-gray-500 uppercase tracking-wide mb-1'>
                              Spent
                            </div>
                            <div className='text-lg font-bold text-gray-900'>
                              €{category.spent.toLocaleString()}
                            </div>
                          </div>
                          <div className='text-center p-3 bg-blue-50 rounded-lg'>
                            <div className='text-caption text-blue-600 uppercase tracking-wide mb-1'>
                              Budget
                            </div>
                            <div className='text-lg font-bold text-blue-700'>
                              €{category.budget.toLocaleString()}
                            </div>
                          </div>
                          <div
                            className={`text-center p-3 rounded-lg ${
                              isOverBudget ? 'bg-red-50' : 'bg-green-50'
                            }`}
                          >
                            <div
                              className={`text-caption uppercase tracking-wide mb-1 ${
                                isOverBudget ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {isOverBudget ? 'Over' : 'Remaining'}
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                isOverBudget ? 'text-red-700' : 'text-green-700'
                              }`}
                            >
                              €{Math.abs(remaining).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Progress Bar */}
                        <div className='mb-4'>
                          <div className='flex justify-between items-center mb-2'>
                            <span className='text-body font-medium text-gray-700'>
                              {safeT('budgetModal.progress', {}, 'Progress')}:{' '}
                              {spentPercentage.toFixed(1)}%
                            </span>
                            <span
                              className={`text-body font-semibold px-2 py-1 rounded-full ${
                                isOverBudget
                                  ? 'bg-red-100 text-red-700'
                                  : spentPercentage > 80
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {isOverBudget
                                ? safeT('budgetModal.overBudget', {}, 'over budget')
                                : safeT('budgetModal.ofBudget', {}, 'of budget')}
                            </span>
                          </div>
                          <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden'>
                            <div
                              className={`h-4 rounded-full transition-all duration-500 ease-out relative ${
                                isOverBudget
                                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                                  : spentPercentage > 80
                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                              }`}
                              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                            >
                              {spentPercentage > 10 && (
                                <div className='absolute inset-0 bg-white bg-opacity-20 animate-pulse'></div>
                              )}
                            </div>
                            {isOverBudget && (
                              <div className='absolute right-0 top-0 h-4 w-2 bg-red-700 opacity-75'></div>
                            )}
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className='flex justify-between items-center'>
                          <div className='flex items-center gap-2'>
                            <div
                              className={`w-3 h-3 rounded-full ${
                                isOverBudget
                                  ? 'bg-red-500'
                                  : spentPercentage > 80
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              }`}
                            ></div>
                            <span className='text-body text-gray-600'>
                              {isOverBudget
                                ? safeT('budgetModal.overBudget', {}, 'Budget exceeded')
                                : spentPercentage > 80
                                  ? safeT('budgetModal.approachingLimit', {}, 'Approaching limit')
                                  : safeT('budgetModal.onTrack', {}, 'On track')}
                            </span>
                          </div>
                          <span
                            className={`text-body font-medium ${
                              isOverBudget ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {isOverBudget ? '-' : '+'}€{Math.abs(remaining).toLocaleString()}{' '}
                            {safeT('budgetModal.remaining', {}, 'remaining')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Category Button */}
                <button
                  onClick={handleAddNewBudgetCategory}
                  className='w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-3 group'
                >
                  <div className='w-8 h-8 border-2 border-current rounded-full flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <PlusIcon className='w-4 h-4' />
                  </div>
                  <span className='font-medium'>
                    {safeT('budgetModal.addCategory', {}, 'Add New Budget Category')}
                  </span>
                </button>

                {/* Modal Footer */}
                <div className='flex items-center justify-between mt-8 pt-6 border-t border-gray-200'>
                  <div className='text-body text-gray-500'>
                    {safeT('budgetModal.totalBudget', {}, 'Total Budget')}:{' '}
                    <span className='font-semibold text-gray-700'>
                      €{budgetCategories.reduce((sum, cat) => sum + cat.budget, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <button
                      onClick={handleCloseBudgetModal}
                      className='px-6 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium'
                    >
                      {safeT('budgetModal.cancel', {}, 'Cancel')}
                    </button>
                    <button
                      onClick={handleCloseBudgetModal}
                      className='px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl'
                    >
                      {safeT('budgetModal.save', {}, 'Save Changes')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
