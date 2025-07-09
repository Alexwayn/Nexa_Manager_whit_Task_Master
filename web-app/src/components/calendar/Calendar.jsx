import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Share,
  X,
  Grid3X3,
  List,
  Columns,
  Calendar as CalendarViewIcon,
  Phone,
  Video,
  FileText,
  Star,
} from 'lucide-react';

const Calendar = () => {
  const { t, ready } = useTranslation('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate] = useState(19); // Today is the 19th as shown in design
  const [viewMode, setViewMode] = useState('month'); // Use static default instead of translation

  // Safe translation function that handles loading state
  const safeT = (key, fallback = key) => {
    if (!ready) return fallback;
    return t(key);
  };

  // Show loading state if translations are not ready
  if (!ready) {
    return (
      <div className='flex h-screen bg-gray-50 items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading calendar...</p>
        </div>
      </div>
    );
  }

  const selectedEventData = safeT('sampleData.selectedEvent', { returnObjects: true }) || {};
  const eventsData = safeT('sampleData.events', { returnObjects: true }) || {};
  const upcomingEventsData = safeT('sampleData.upcomingEvents', { returnObjects: true }) || [];
  const filtersData = safeT('sampleData.filters', { returnObjects: true }) || {};
  const calendarsData = safeT('sampleData.calendars', { returnObjects: true }) || {};
  const eventCategoriesData = safeT('sampleData.eventCategories', { returnObjects: true }) || {};

  const [selectedEvent] = useState({
    title: selectedEventData.title || 'Sample Event',
    type: selectedEventData.type || 'meeting',
    date: selectedEventData.date || 'Today',
    time: selectedEventData.time || '10:00 AM',
    location: selectedEventData.location || 'Conference Room',
    organizer: selectedEventData.organizer || 'John Doe',
    participants: selectedEventData.participants || ['Jane Smith', 'Bob Johnson'],
    description: selectedEventData.description || 'Sample event description',
  });

  // Sample events data
  const events = {
    15: [
      {
        id: 1,
        title: eventsData.clientMeeting || 'Client Meeting',
        time: '10:00 AM',
        type: 'meeting',
        color: 'bg-blue-500',
      },
      {
        id: 2,
        title: eventsData.projectPresentation || 'Project Presentation',
        time: '2:00 PM',
        type: 'presentation',
        color: 'bg-purple-500',
      },
      {
        id: 3,
        title: eventsData.invoiceDue || 'Invoice Due',
        time: '',
        type: 'invoice',
        color: 'bg-red-500',
      },
    ],
    16: [
      {
        id: 4,
        title: eventsData.teamMeeting || 'Team Meeting',
        time: '9:00 AM',
        type: 'meeting',
        color: 'bg-blue-500',
      },
    ],
    17: [
      {
        id: 5,
        title: eventsData.clientCall || 'Client Call',
        time: '3:30 PM',
        type: 'call',
        color: 'bg-green-500',
      },
    ],
    20: [
      {
        id: 6,
        title: eventsData.quarterlyReview || 'Quarterly Review',
        time: '1:00 PM',
        type: 'review',
        color: 'bg-yellow-500',
      },
    ],
  };

  const upcomingEvents = upcomingEventsData.map((event, index) => ({
    id: index + 1,
    ...event,
    color: ['border-blue-500', 'border-purple-500', 'border-red-500', 'border-blue-500'][index % 4],
  }));

  const filters = Object.keys(filtersData).map((key, index) => ({
    name: filtersData[key],
    icon: [Video, FileText, FileText, Phone, Star][index],
    color: [
      'text-blue-500',
      'text-purple-500',
      'text-red-500',
      'text-green-500',
      'text-yellow-500',
    ][index],
    checked: true,
  }));

  const calendars = Object.keys(calendarsData).map(key => ({
    name: calendarsData[key],
    checked: true,
  }));

  const eventTypes = Object.keys(eventCategoriesData).map(key => ({
    name: eventCategoriesData[key],
    checked: true,
  }));

  // Generate calendar days
  const getDaysInMonth = date => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isNextMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isNextMonth: false,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isNextMonth: true,
      });
    }

    return days;
  };

  const monthsObj = safeT('months', { returnObjects: true }) || {};
  const monthNames = [
    monthsObj.january || 'January',
    monthsObj.february || 'February',
    monthsObj.march || 'March',
    monthsObj.april || 'April',
    monthsObj.may || 'May',
    monthsObj.june || 'June',
    monthsObj.july || 'July',
    monthsObj.august || 'August',
    monthsObj.september || 'September',
    monthsObj.october || 'October',
    monthsObj.november || 'November',
    monthsObj.december || 'December',
  ];
  
  const daysShortObj = safeT('daysShort', { returnObjects: true }) || {};
  const weekDays = [
    daysShortObj.sunday || 'Sun',
    daysShortObj.monday || 'Mon',
    daysShortObj.tuesday || 'Tue',
    daysShortObj.wednesday || 'Wed',
    daysShortObj.thursday || 'Thu',
    daysShortObj.friday || 'Fri',
    daysShortObj.saturday || 'Sat',
  ];
  const days = getDaysInMonth(currentDate);

  const navigateMonth = direction => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div className='flex h-screen bg-gray-50'>
      {/* Left Sidebar */}
      <div className='w-64 bg-white border-r border-gray-200 flex flex-col'>
        {/* Mini Calendar */}
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-base font-medium text-black'>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className='flex items-center space-x-1'>
              <button className='p-1 hover:bg-gray-100 rounded'>
                <ChevronLeft className='w-4 h-4 text-gray-500' />
              </button>
              <button className='p-1 hover:bg-gray-100 rounded'>
                <ChevronRight className='w-4 h-4 text-gray-500' />
              </button>
            </div>
          </div>

          {/* Mini calendar grid */}
          <div className='grid grid-cols-7 gap-1 text-xs mb-2'>
            {Object.values(
              safeT('daysMin', { returnObjects: true }) || ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            ).map((day, index) => (
              <div key={index} className='text-center text-gray-500 py-1'>
                {day}
              </div>
            ))}
          </div>

          <div className='grid grid-cols-7 gap-1 text-sm'>
            {/* Sample mini calendar days */}
            {[...Array(31)].map((_, index) => {
              const day = index + 1;
              const isToday = day === 15;
              return (
                <div
                  key={index}
                  className={`text-center py-1 cursor-pointer hover:bg-gray-100 rounded ${
                    isToday
                      ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto'
                      : ''
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters and Calendars */}
        <div className='flex-1 p-6 space-y-6 overflow-y-auto'>
          <div>
            <h4 className='text-sm font-medium text-gray-500 mb-3'>
              {safeT('filters', 'Filters')}
            </h4>
            <div className='space-y-2'>
              {filters.map((filter, index) => (
                <label key={index} className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    defaultChecked={filter.checked}
                  />
                  <filter.icon className={`w-4 h-4 ${filter.color}`} />
                  <span className='text-sm text-black'>{filter.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h4 className='text-sm font-medium text-gray-500 mb-3'>
              {safeT('myCalendars', 'My Calendars')}
            </h4>
            <div className='space-y-2'>
              {calendars.map((cal, index) => (
                <label key={index} className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    defaultChecked={cal.checked}
                  />
                  <span className='text-sm text-black'>{cal.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h4 className='text-sm font-medium text-gray-500 mb-3'>
              {safeT('eventTypes', 'Event Types')}
            </h4>
            <div className='space-y-2'>
              {eventTypes.map((type, index) => (
                <label key={index} className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    defaultChecked={type.checked}
                  />
                  <span className='text-sm text-black'>{type.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-white'>
          <div className='flex items-center space-x-4'>
            <h2 className='text-xl font-semibold text-black'>{`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}</h2>
            <button
              onClick={() => setCurrentDate(new Date())}
              className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
            >
              {safeT('today', 'Today')}
            </button>
            <div className='flex items-center'>
              <button
                onClick={() => navigateMonth(-1)}
                className='p-2 text-gray-500 rounded-md hover:bg-gray-100'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className='p-2 text-gray-500 rounded-md hover:bg-gray-100'
              >
                <ChevronRight className='w-5 h-5' />
              </button>
            </div>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder={safeT('searchPlaceholder', 'Search events...')}
                className='pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
            <div className='flex items-center bg-gray-100 rounded-md p-1'>
              {[
                { name: safeT('views.month', 'Month'), icon: Grid3X3 },
                { name: safeT('views.week', 'Week'), icon: Columns },
                { name: safeT('views.day', 'Day'), icon: CalendarViewIcon },
                { name: safeT('views.list', 'List'), icon: List },
              ].map(view => (
                <button
                  key={view.name}
                  onClick={() => setViewMode(view.name)}
                  className={`flex items-center space-x-2 px-3 py-1 text-sm rounded-md ${
                    viewMode === view.name ? 'bg-white text-black shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <view.icon className='w-4 h-4' />
                  <span>{view.name}</span>
                </button>
              ))}
            </div>
            <button className='flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'>
              <Plus className='w-4 h-4' />
              <span>{safeT('newEvent', 'New Event')}</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className='flex-1 grid grid-cols-7'>
          {weekDays.map(day => (
            <div
              key={day}
              className='text-center py-3 text-sm font-medium text-gray-500 border-b border-l border-gray-200'
            >
              {day}
            </div>
          ))}

          {days.map((dayObj, index) => (
            <div
              key={index}
              className={`relative p-2 border-b border-l border-gray-200 ${
                !dayObj.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              } ${index % 7 === 0 ? 'border-l-0' : ''}`}
              style={{ minHeight: '120px' }}
            >
              <span
                className={`text-sm ${
                  selectedDate === dayObj.day && dayObj.isCurrentMonth
                    ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                    : 'text-gray-900'
                } ${!dayObj.isCurrentMonth ? 'text-gray-400' : ''}`}
              >
                {dayObj.day}
              </span>
              <div className='mt-2 space-y-1'>
                {events[dayObj.day] &&
                  dayObj.isCurrentMonth &&
                  events[dayObj.day].map(event => (
                    <div
                      key={event.id}
                      className={`p-1.5 text-xs text-white rounded cursor-pointer ${event.color}`}
                    >
                      <p className='font-medium'>{event.title}</p>
                      {event.time && <p className='text-white/80'>{event.time}</p>}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className='w-80 bg-white border-l border-gray-200 flex flex-col'>
        {/* Upcoming Events */}
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-medium text-black'>{safeT('upcoming', 'Upcoming')}</h3>
            <a href='#' className='text-sm font-medium text-blue-600 hover:underline'>
              {safeT('viewAll', 'View All')}
            </a>
          </div>
          <div className='space-y-4'>
            {upcomingEvents.map(event => (
              <div key={event.id} className={`pl-3 border-l-2 ${event.color}`}>
                <p className='text-sm font-medium text-black'>{event.title}</p>
                <p className='text-xs text-gray-500'>{event.company}</p>
                <p className='text-xs text-gray-500'>
                  {event.time} &middot; {event.location} &middot; {event.duration}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Event Details */}
        {selectedEvent && (
          <div className='flex-1 p-6 space-y-6 overflow-y-auto'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-black'>
                {safeT('eventDetails', 'Event Details')}
              </h3>
              <div className='flex items-center space-x-2'>
                <button className='p-2 hover:bg-gray-100 rounded-full'>
                  <Share className='w-4 h-4 text-gray-500' />
                </button>
                <button className='p-2 hover:bg-gray-100 rounded-full'>
                  <Edit className='w-4 h-4 text-gray-500' />
                </button>
                <button className='p-2 hover:bg-gray-100 rounded-full'>
                  <Trash2 className='w-4 h-4 text-gray-500' />
                </button>
                <button className='p-2 hover:bg-gray-100 rounded-full'>
                  <X className='w-4 h-4 text-gray-500' />
                </button>
              </div>
            </div>

            <div>
              <p className='text-2xl font-bold text-black'>{selectedEvent.title}</p>
              <p className='text-sm text-gray-500'>{selectedEvent.type}</p>
            </div>

            <div className='space-y-4'>
              <div className='flex items-start space-x-3'>
                <Clock className='w-5 h-5 text-gray-400 mt-0.5' />
                <div>
                  <p className='text-sm text-black'>{selectedEvent.date}</p>
                  <p className='text-sm text-gray-500'>{selectedEvent.time}</p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <MapPin className='w-5 h-5 text-gray-400 mt-0.5' />
                <p className='text-sm text-black'>{selectedEvent.location}</p>
              </div>
              <div className='flex items-start space-x-3'>
                <Users className='w-5 h-5 text-gray-400 mt-0.5' />
                <div>
                  <p className='text-sm text-black'>
                    {safeT('organizer', 'Organizer')}: {selectedEvent.organizer}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {safeT('attendees', 'Attendees')}: {selectedEvent.participants.join(', ')}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className='text-sm font-medium text-black mb-2'>
                {safeT('description', 'Description')}
              </h4>
              <p className='text-sm text-gray-600'>{selectedEvent.description}</p>
            </div>
          </div>
        )}

        {/* Add Event Form (Example) */}
        <div className='p-6 border-t border-gray-200'>
          <h3 className='text-base font-medium text-black mb-4'>
            {safeT('newEvent', 'New Event')}
          </h3>
          <div className='space-y-4'>
            <input
              type='text'
              placeholder={safeT('eventTitlePlaceholder', 'Event title...')}
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md'
            />
            <input
              type='text'
              placeholder={safeT('eventType', 'Event type')}
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md'
            />
            <div className='flex items-center space-x-2'>
              <input
                type='date'
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md'
              />
              <input
                type='time'
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md'
              />
            </div>
            <label className='flex items-center space-x-2'>
              <input type='checkbox' className='h-4 w-4 rounded border-gray-300' />
              <span className='text-sm'>{safeT('allDayEvent', 'All day event')}</span>
            </label>
            <input
              type='text'
              placeholder={safeT('locationPlaceholder', 'Location...')}
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md'
            />
            <button className='w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100'>
              <Users className='w-4 h-4' />
              <span>{safeT('addParticipants', 'Add Participants')}</span>
            </button>
            <textarea
              placeholder={safeT('descriptionPlaceholder', 'Description...')}
              rows='3'
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md'
            ></textarea>
            <button className='w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'>
              {safeT('save', 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
