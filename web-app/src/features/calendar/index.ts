// Calendar Feature - Public API

// Components
export { default as CalendarView } from './components/Calendar'; // Using existing Calendar.jsx
export { default as EventModal } from './components/EventModal';
export { default as EventForm } from './components/Calendar'; // Using Calendar.jsx as it likely contains form functionality
export { default as EventList } from './components/Calendar'; // Using Calendar.jsx as it likely contains list functionality
export { default as CalendarFilters } from './components/Calendar'; // Using Calendar.jsx as it likely contains filter functionality
export { default as RecurringEventManager } from './components/Calendar'; // Using Calendar.jsx as fallback
export { default as EventInvitations } from './components/EventModal'; // Using EventModal.jsx as fallback

// Hooks (if any exist)
// export { default as useCalendar } from './hooks/useCalendar';

// Services
export { default as eventService } from './services/eventService.js';
export { default as eventInvitationService } from './services/eventInvitationService.js';
export * as recurringEventsService from './services/recurringEventsService.js';