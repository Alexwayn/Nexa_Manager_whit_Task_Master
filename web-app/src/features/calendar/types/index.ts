// Calendar Types

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  attendees: string[];
  reminders: {
    type: 'email' | 'popup';
    minutes: number;
  }[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'public' | 'private';
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: string;
    count?: number;
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  date: string;
}

export interface EventInvitation {
  id: string;
  eventId: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
  respondedAt?: string;
}