# Calendar Feature

## Overview

The Calendar feature provides comprehensive event management, appointment scheduling, and calendar integration for Nexa Manager. It handles event creation, RSVP management, calendar synchronization, and integration with client communications.

## Public API

### Components
- `CalendarView` - Main calendar display with multiple views
- `EventModal` - Event creation and editing modal
- `AppointmentScheduler` - Appointment booking interface
- `EventList` - List view of events
- `RSVPManager` - RSVP tracking and management

### Hooks
- `useCalendar` - Calendar data and event management
- `useEvents` - Event CRUD operations
- `useAppointments` - Appointment scheduling
- `useRSVP` - RSVP management

### Services
- `calendarService` - Core calendar operations
- `eventService` - Event management
- `appointmentService` - Appointment scheduling
- `rsvpService` - RSVP tracking

## Integration Patterns

Integrates with other features for comprehensive scheduling:
- **Clients**: Client appointment scheduling
- **Email**: Event invitations and reminders
- **Auth**: User availability and permissions

## Testing Approach

Focus on date/time handling, timezone management, and recurring event logic.

## Dependencies

- date-fns for date manipulation
- FullCalendar for calendar display
- iCal generation for calendar exports