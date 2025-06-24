import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '@components/shared/Footer';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Phone,
  Video,
  FileText,
  MoreHorizontal,
  X,
  Edit3,
  Trash2,
  Share2,
  CheckSquare,
  User,
  ChevronDown,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  DocumentCheckIcon,
  XMarkIcon,
  MapPinIcon,
  PencilIcon,
  HashtagIcon,
  LinkIcon,
  Bars3Icon,
  SwatchIcon,
  BellIcon,
  UserIcon,
  CreditCardIcon,
  UserPlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import nexaFooterLogo from '@assets/logo_nexa_footer.png';
import nexaLogo from '@assets/logo_nexa.png';

export default function Calendar() {
  const { t } = useTranslation(['calendar', 'common']);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('Month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [syncedInvoices, setSyncedInvoices] = useState(false);
  const [syncedDocumentsToEvents, setSyncedDocumentsToEvents] = useState(false);

  // New calendar layout state
  const [viewMode, setViewMode] = useState('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [filters, setFilters] = useState({
    meetings: true,
    presentations: true,
    invoices: true,
    calls: true,
    reviews: true,
  });

  // Calculate month days for calendar grid
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Toggle filter function
  const toggleFilter = filterKey => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  // Check if event is visible based on filters
  const isEventVisible = event => {
    return filters[event.type] || false;
  };

  // Navigation functions for main calendar
  const handlePrev = () => {
    const newDate = new Date(selectedDate);
    if (view === 'Month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'Week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === 'Day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (view === 'Month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'Week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === 'Day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  // Navigation functions for mini calendar
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Sample events data with colors
  const sampleEvents = [
    {
      id: 1,
      title: 'Client Meeting',
      date: '2025-06-15',
      time: '10:00 AM',
      type: 'meetings',
      color: 'bg-blue-500',
      location: 'Conference Room A',
      description: 'Quarterly review with client',
      attendees: ['John Doe', 'Jane Smith'],
    },
    {
      id: 2,
      title: 'Product Presentation',
      date: '2025-06-16',
      time: '2:00 PM',
      type: 'presentations',
      color: 'bg-purple-500',
      location: 'Main Hall',
      description: 'New product launch presentation',
      attendees: ['Mike Johnson', 'Sarah Wilson'],
    },
    {
      id: 3,
      title: 'Invoice Review',
      date: '2025-06-17',
      time: '11:00 AM',
      type: 'invoices',
      color: 'bg-green-500',
      location: 'Office',
      description: 'Monthly invoice review meeting',
      attendees: ['Alex Brown'],
    },
    {
      id: 4,
      title: 'Team Call',
      date: '2025-06-18',
      time: '3:00 PM',
      type: 'calls',
      color: 'bg-orange-500',
      location: 'Virtual',
      description: 'Weekly team sync call',
      attendees: ['Team Members'],
    },
    {
      id: 5,
      title: 'Performance Review',
      date: '2025-06-19',
      time: '1:00 PM',
      type: 'reviews',
      color: 'bg-red-500',
      location: 'HR Office',
      description: 'Quarterly performance review',
      attendees: ['HR Team'],
    },
  ];

  useEffect(() => {
    setEvents(sampleEvents);
    setFilteredEvents(sampleEvents);
  }, []);

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      {/* Breadcrumb */}
      <div className='bg-blue-50 border-b border-blue-100 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2 text-sm'>
            <span className='text-blue-600 font-medium'>{t('calendar:title')}</span>
            <ChevronRight className='h-4 w-4 text-gray-400' />
            <span className='text-gray-600'>{t('calendar:events')}</span>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <Search className='h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2' />
              <input
                type='text'
                placeholder={t('calendar:searchPlaceholder')}
                className='pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex flex-1 bg-gray-50'>
        {/* Left Sidebar */}
        <div className='w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto'>
          {/* Mini Calendar */}
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <div className='flex space-x-1'>
                <button onClick={goToPreviousMonth} className='p-1 hover:bg-gray-100 rounded'>
                  <ChevronLeft className='h-4 w-4 text-gray-600' />
                </button>
                <button onClick={goToNextMonth} className='p-1 hover:bg-gray-100 rounded'>
                  <ChevronRight className='h-4 w-4 text-gray-600' />
                </button>
              </div>
            </div>

            {/* Mini Calendar Grid */}
            <div className='grid grid-cols-7 gap-1 text-center text-xs'>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className='p-2 text-gray-500 font-medium'>
                  {day}
                </div>
              ))}
              {monthDays.map((day, index) => (
                <button
                  key={index}
                  className={`p-2 text-sm rounded hover:bg-blue-50 ${
                    isSameDay(day, new Date())
                      ? 'bg-blue-500 text-white'
                      : isSameDay(day, selectedDate)
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-700'
                  }`}
                  onClick={() => setSelectedDate(day)}
                >
                  {format(day, 'd')}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className='mb-6'>
            <h3 className='text-sm font-semibold text-gray-900 mb-3'>{t('calendar:filters')}</h3>
            <div className='space-y-2'>
              {[
                { key: 'meetings', label: t('calendar:categories.meetings'), color: 'bg-blue-500' },
                {
                  key: 'presentations',
                  label: t('calendar:categories.presentations'),
                  color: 'bg-purple-500',
                },
                {
                  key: 'invoices',
                  label: t('calendar:categories.invoices'),
                  color: 'bg-green-500',
                },
                { key: 'calls', label: t('calendar:categories.calls'), color: 'bg-orange-500' },
                { key: 'reviews', label: t('calendar:categories.reviews'), color: 'bg-red-500' },
              ].map(filter => (
                <label key={filter.key} className='flex items-center space-x-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={filters[filter.key]}
                    onChange={() => toggleFilter(filter.key)}
                    className='rounded border-gray-300'
                  />
                  <div className={`w-3 h-3 rounded-full ${filter.color}`}></div>
                  <span className='text-sm text-gray-700'>{filter.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* My Calendars */}
          <div className='mb-6'>
            <h3 className='text-sm font-semibold text-gray-900 mb-3'>
              {t('calendar:myCalendars')}
            </h3>
            <div className='space-y-2'>
              <label className='flex items-center space-x-3 cursor-pointer'>
                <input type='checkbox' defaultChecked className='rounded border-gray-300' />
                <span className='text-sm text-gray-700'>{t('calendar:personal')}</span>
              </label>
              <label className='flex items-center space-x-3 cursor-pointer'>
                <input type='checkbox' defaultChecked className='rounded border-gray-300' />
                <span className='text-sm text-gray-700'>{t('calendar:work')}</span>
              </label>
              <label className='flex items-center space-x-3 cursor-pointer'>
                <input type='checkbox' className='rounded border-gray-300' />
                <span className='text-sm text-gray-700'>{t('calendar:family')}</span>
              </label>
            </div>
          </div>

          {/* Event Types */}
          <div className='mb-6'>
            <h3 className='text-sm font-semibold text-gray-900 mb-3'>{t('calendar:eventTypes')}</h3>
            <div className='space-y-2'>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <Users className='h-4 w-4' />
                <span>{t('calendar:categories.meetings')}</span>
              </div>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <FileText className='h-4 w-4' />
                <span>{t('calendar:categories.presentations')}</span>
              </div>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <Phone className='h-4 w-4' />
                <span>{t('calendar:categories.calls')}</span>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <h3 className='text-sm font-semibold text-gray-900 mb-3'>
              {t('calendar:teamMembers')}
            </h3>
            <div className='space-y-2'>
              {['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'].map(member => (
                <div key={member} className='flex items-center space-x-3'>
                  <div className='w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center'>
                    <span className='text-xs text-gray-600'>
                      {member
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </span>
                  </div>
                  <span className='text-sm text-gray-700'>{member}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className='flex-1'>
          {/* Calendar Header */}
          <div className='bg-white border-b border-gray-200 px-6 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-6'>
                <h1 className='text-2xl font-bold text-gray-900'>
                  {format(selectedDate, 'MMMM yyyy')}
                </h1>
                <div className='flex items-center space-x-1'>
                  <button onClick={handlePrev} className='p-2 hover:bg-gray-100 rounded-lg'>
                    <ChevronLeft className='h-5 w-5 text-gray-600' />
                  </button>
                  <button onClick={handleNext} className='p-2 hover:bg-gray-100 rounded-lg'>
                    <ChevronRight className='h-5 w-5 text-gray-600' />
                  </button>
                </div>
              </div>

              <div className='flex items-center space-x-4'>
                {/* View Toggle */}
                <div className='flex bg-gray-100 rounded-lg p-1'>
                  {[
                    { key: 'Month', label: t('calendar:views.month') },
                    { key: 'Week', label: t('calendar:views.week') },
                    { key: 'Day', label: t('calendar:views.day') },
                    { key: 'List', label: t('calendar:views.list') },
                  ].map(viewType => (
                    <button
                      key={viewType.key}
                      onClick={() => setView(viewType.key)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        view === viewType.key
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {viewType.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowEventModal(true)}
                  className='flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
                >
                  <Plus className='h-4 w-4' />
                  <span>{t('calendar:newEvent')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className='bg-white'>
            {view === 'Month' && (
              <div className='p-6'>
                {/* Days Header */}
                <div className='grid grid-cols-7 gap-px mb-4'>
                  {[
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                  ].map((day, index) => (
                    <div key={index} className='bg-gray-50 p-3 text-center'>
                      <span className='text-sm font-medium text-gray-700'>{day}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className='grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden'>
                  {monthDays.map((day, index) => {
                    const dayEvents = events.filter(
                      event => isSameDay(new Date(event.date), day) && isEventVisible(event),
                    );

                    return (
                      <div
                        key={index}
                        className={`bg-white p-3 min-h-[120px] ${
                          !isSameMonth(day, currentDate) ? 'bg-gray-50 text-gray-400' : ''
                        }`}
                      >
                        <div
                          className={`text-sm font-medium mb-2 ${
                            isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          {format(day, 'd')}
                        </div>

                        <div className='space-y-1'>
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`text-xs p-1 rounded cursor-pointer truncate ${event.color} text-white`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className='text-xs text-gray-500'>
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Event Details Section (below calendar) */}
          {selectedEvent && (
            <div className='bg-white border-t border-gray-200 p-6 mb-8'>
              <div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
                {/* Header */}
                <div className='bg-blue-50 flex justify-between items-center px-6 py-4 border-b border-gray-200'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {t('calendar:eventDetails')}
                  </h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className='p-6'>
                  <div className='grid grid-cols-2 gap-8'>
                    {/* Left Column */}
                    <div className='space-y-6'>
                      {/* Event Title and Type */}
                      <div>
                        <h4 className='text-xl font-semibold text-gray-900 mb-2'>
                          {selectedEvent.title}
                        </h4>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800'>
                          {t('calendar:categories.reviews')} {t('calendar:meetings')}
                        </span>
                      </div>

                      {/* Date and Time */}
                      <div className='bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg'>
                        <div className='flex items-center space-x-3'>
                          <CalendarIcon className='h-5 w-5 text-blue-600' />
                          <div>
                            <p className='font-medium text-gray-900'>{selectedEvent.date}</p>
                            <p className='text-sm text-gray-600'>{selectedEvent.time}</p>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className='flex items-center space-x-3'>
                        <MapPin className='h-5 w-5 text-gray-400' />
                        <span className='text-gray-700'>{selectedEvent.location}</span>
                      </div>

                      {/* Organizer */}
                      <div className='flex items-center space-x-3'>
                        <User className='h-5 w-5 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-600'>{t('calendar:organizer')}</p>
                          <p className='font-medium text-gray-900'>John Doe</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className='space-y-6'>
                      {/* Attendees */}
                      <div>
                        <h5 className='font-medium text-gray-900 mb-3'>
                          {t('calendar:attendees')}
                        </h5>
                        <div className='flex space-x-2'>
                          {['JD', 'JS', 'MJ', 'SW'].map((initials, index) => (
                            <div
                              key={index}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'][
                                  index
                                ]
                              }`}
                            >
                              {initials}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h5 className='font-medium text-gray-900 mb-3'>
                          {t('calendar:description')}
                        </h5>
                        <div className='bg-gray-50 p-4 rounded-lg'>
                          <p className='text-gray-700 text-sm leading-relaxed'>
                            {selectedEvent.description}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className='flex space-x-3'>
                        <button className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
                          <Edit3 size={16} />
                          <span>{t('calendar:edit')}</span>
                        </button>
                        <button className='flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'>
                          <Trash2 size={16} />
                          <span>{t('calendar:delete')}</span>
                        </button>
                        <button className='flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'>
                          <Share2 size={16} />
                          <span>{t('calendar:share')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className='w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto'>
          {/* Quick Actions */}
          <div className='mb-6'>
            <h3 className='font-semibold text-gray-900 mb-4'>{t('calendar:quickActions')}</h3>
            <div className='grid grid-cols-2 gap-3'>
              <button className='flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50'>
                <Plus className='h-6 w-6 text-blue-600 mb-2' />
                <span className='text-sm text-gray-700'>{t('calendar:newEvent')}</span>
              </button>
              <button className='flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50'>
                <Clock className='h-6 w-6 text-green-600 mb-2' />
                <span className='text-sm text-gray-700'>{t('calendar:schedule')}</span>
              </button>
              <button className='flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50'>
                <CheckSquare className='h-6 w-6 text-purple-600 mb-2' />
                <span className='text-sm text-gray-700'>{t('calendar:tasks')}</span>
              </button>
              <button className='flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50'>
                <Users className='h-6 w-6 text-orange-600 mb-2' />
                <span className='text-sm text-gray-700'>{t('calendar:meetings')}</span>
              </button>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className='bg-white rounded-lg shadow-sm p-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold text-gray-900'>{t('calendar:upcoming')}</h3>
              <button className='text-sm text-blue-600 hover:text-blue-700'>
                {t('calendar:viewAll')}
              </button>
            </div>
            <div className='space-y-4'>
              {/* Client Meeting */}
              <div className='border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r-lg'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900'>
                      Client {t('calendar:categories.meetings').slice(0, -1)}
                    </h4>
                    <p className='text-sm text-gray-600'>Acme Corporation • Virtual</p>
                    <div className='flex items-center space-x-1 mt-1'>
                      <Clock className='h-3 w-3 text-gray-400' />
                      <span className='text-xs text-gray-500'>1 {t('calendar:hour')}</span>
                    </div>
                  </div>
                  <span className='text-sm font-medium text-gray-900'>10:00 AM</span>
                </div>
              </div>

              {/* Team Standup */}
              <div className='border-l-4 border-purple-500 bg-purple-50 p-3 rounded-r-lg'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900'>Team Standup</h4>
                    <p className='text-sm text-gray-600'>Development Team • Conference Room</p>
                    <div className='flex items-center space-x-1 mt-1'>
                      <Clock className='h-3 w-3 text-gray-400' />
                      <span className='text-xs text-gray-500'>30 {t('calendar:minutes')}</span>
                    </div>
                  </div>
                  <span className='text-sm font-medium text-gray-900'>2:00 PM</span>
                </div>
              </div>

              {/* Budget Review */}
              <div className='border-l-4 border-red-500 bg-red-50 p-3 rounded-r-lg'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900'>
                      Budget {t('calendar:categories.reviews').slice(0, -1)}
                    </h4>
                    <p className='text-sm text-gray-600'>Finance Team • Office 204</p>
                    <div className='flex items-center space-x-1 mt-1'>
                      <Clock className='h-3 w-3 text-gray-400' />
                      <span className='text-xs text-gray-500'>45 {t('calendar:minutes')}</span>
                    </div>
                  </div>
                  <span className='text-sm font-medium text-gray-900'>4:30 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {showEventModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between p-6 border-b border-gray-100'>
              <h2 className='text-xl font-semibold text-gray-900'>{t('calendar:createEvent')}</h2>
              <button
                onClick={() => setShowEventModal(false)}
                className='p-2 hover:bg-gray-100 rounded-lg'
              >
                <X className='h-4 w-4 text-gray-600' />
              </button>
            </div>

            <div className='p-6'>
              <form className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    {t('calendar:eventTitle')}
                  </label>
                  <input
                    type='text'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder={t('calendar:eventTitlePlaceholder')}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      {t('calendar:date')}
                    </label>
                    <input
                      type='date'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      {t('calendar:time')}
                    </label>
                    <input
                      type='time'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    {t('calendar:location')}
                  </label>
                  <input
                    type='text'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder={t('calendar:locationPlaceholder')}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    {t('calendar:description')}
                  </label>
                  <textarea
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder={t('calendar:descriptionPlaceholder')}
                  />
                </div>
              </form>
            </div>

            <div className='bg-gray-50 px-6 py-4 flex justify-end space-x-3'>
              <button
                onClick={() => setShowEventModal(false)}
                className='px-4 py-2 text-gray-700 hover:text-gray-900'
              >
                {t('calendar:cancel')}
              </button>
              <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
                {t('calendar:createEvent')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
