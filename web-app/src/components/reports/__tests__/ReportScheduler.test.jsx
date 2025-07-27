import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryProvider } from '@tanstack/react-query';
import ReportScheduler from '../ReportScheduler';
import * as reportingService from '@/services\reportingService';

// Mock services
jest.mock('../../../services/reportingService');

// Mock data
const mockSchedules = [
  {
    id: 1,
    name: 'Weekly Revenue Report',
    type: 'revenue',
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    time: '09:00',
    format: 'PDF',
    email: 'admin@company.com',
    enabled: true,
    nextRun: '2024-01-22T09:00:00Z',
    lastRun: '2024-01-15T09:00:00Z'
  },
  {
    id: 2,
    name: 'Monthly Client Report',
    type: 'client',
    frequency: 'monthly',
    dayOfMonth: 1,
    time: '10:00',
    format: 'Excel',
    email: 'manager@company.com',
    enabled: false,
    nextRun: '2024-02-01T10:00:00Z',
    lastRun: null
  }
];

const mockNewSchedule = {
  id: 3,
  name: 'Daily Expense Report',
  type: 'expenses',
  frequency: 'daily',
  time: '08:00',
  format: 'PDF',
  email: 'finance@company.com',
  enabled: true
};

// Test wrapper
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryProvider client={queryClient}>
      {children}
    </QueryProvider>
  );
};

describe('ReportScheduler Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    reportingService.getScheduledReports.mockResolvedValue(mockSchedules);
    reportingService.createSchedule.mockResolvedValue(mockNewSchedule);
    reportingService.updateSchedule.mockResolvedValue({ ...mockSchedules[0], enabled: false });
    reportingService.deleteSchedule.mockResolvedValue({ success: true });
  });

  it('renders scheduler interface correctly', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    expect(screen.getByText('Programmazione Report')).toBeInTheDocument();
    expect(screen.getByText('Nuovo Schedule')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Revenue Report')).toBeInTheDocument();
      expect(screen.getByText('Monthly Client Report')).toBeInTheDocument();
    });
  });

  it('displays existing schedules with correct information', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check first schedule
      expect(screen.getByText('Weekly Revenue Report')).toBeInTheDocument();
      expect(screen.getByText('Settimanale')).toBeInTheDocument();
      expect(screen.getByText('Lunedì alle 09:00')).toBeInTheDocument();
      expect(screen.getByText('admin@company.com')).toBeInTheDocument();
      
      // Check second schedule
      expect(screen.getByText('Monthly Client Report')).toBeInTheDocument();
      expect(screen.getByText('Mensile')).toBeInTheDocument();
      expect(screen.getByText('1° del mese alle 10:00')).toBeInTheDocument();
      expect(screen.getByText('manager@company.com')).toBeInTheDocument();
    });
  });

  it('shows enabled/disabled status correctly', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    await waitFor(() => {
      const enabledSchedule = screen.getByTestId('schedule-1');
      const disabledSchedule = screen.getByTestId('schedule-2');
      
      expect(enabledSchedule).toHaveClass('enabled');
      expect(disabledSchedule).toHaveClass('disabled');
    });
  });

  it('opens create schedule form', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    const newScheduleBtn = screen.getByText('Nuovo Schedule');
    await user.click(newScheduleBtn);

    expect(screen.getByText('Crea Nuovo Schedule')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome Schedule')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo Report')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequenza')).toBeInTheDocument();
    expect(screen.getByLabelText('Ora')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Destinatario')).toBeInTheDocument();
  });

  it('validates schedule form', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    const newScheduleBtn = screen.getByText('Nuovo Schedule');
    await user.click(newScheduleBtn);

    // Try to submit without required fields
    const saveBtn = screen.getByText('Salva Schedule');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Nome richiesto')).toBeInTheDocument();
      expect(screen.getByText('Tipo report richiesto')).toBeInTheDocument();
      expect(screen.getByText('Email richiesta')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    const newScheduleBtn = screen.getByText('Nuovo Schedule');
    await user.click(newScheduleBtn);

    // Enter invalid email
    const emailInput = screen.getByLabelText('Email Destinatario');
    await user.type(emailInput, 'invalid-email');

    const saveBtn = screen.getByText('Salva Schedule');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Email non valida')).toBeInTheDocument();
    });
  });

  it('creates new schedule successfully', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    const newScheduleBtn = screen.getByText('Nuovo Schedule');
    await user.click(newScheduleBtn);

    // Fill form
    await user.type(screen.getByLabelText('Nome Schedule'), 'Daily Expense Report');
    
    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Spese'));

    const frequencySelect = screen.getByLabelText('Frequenza');
    await user.click(frequencySelect);
    await user.click(screen.getByText('Giornaliera'));

    await user.type(screen.getByLabelText('Ora'), '08:00');
    await user.type(screen.getByLabelText('Email Destinatario'), 'finance@company.com');

    // Submit form
    const saveBtn = screen.getByText('Salva Schedule');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(reportingService.createSchedule).toHaveBeenCalledWith({
        name: 'Daily Expense Report',
        type: 'expenses',
        frequency: 'daily',
        time: '08:00',
        format: 'PDF',
        email: 'finance@company.com',
        enabled: true
      });
    });

    expect(screen.getByText('Schedule creato con successo')).toBeInTheDocument();
  });

  it('handles weekly frequency options', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    const newScheduleBtn = screen.getByText('Nuovo Schedule');
    await user.click(newScheduleBtn);

    // Select weekly frequency
    const frequencySelect = screen.getByLabelText('Frequenza');
    await user.click(frequencySelect);
    await user.click(screen.getByText('Settimanale'));

    // Should show day of week selector
    expect(screen.getByLabelText('Giorno della Settimana')).toBeInTheDocument();

    const daySelect = screen.getByLabelText('Giorno della Settimana');
    await user.click(daySelect);
    await user.click(screen.getByText('Venerdì'));

    // Fill other required fields
    await user.type(screen.getByLabelText('Nome Schedule'), 'Weekly Test');
    
    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Entrate'));

    await user.type(screen.getByLabelText('Ora'), '10:00');
    await user.type(screen.getByLabelText('Email Destinatario'), 'test@company.com');

    const saveBtn = screen.getByText('Salva Schedule');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(reportingService.createSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency: 'weekly',
          dayOfWeek: 5 // Friday
        })
      );
    });
  });

  it('handles monthly frequency options', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    const newScheduleBtn = screen.getByText('Nuovo Schedule');
    await user.click(newScheduleBtn);

    // Select monthly frequency
    const frequencySelect = screen.getByLabelText('Frequenza');
    await user.click(frequencySelect);
    await user.click(screen.getByText('Mensile'));

    // Should show day of month selector
    expect(screen.getByLabelText('Giorno del Mese')).toBeInTheDocument();

    const dayInput = screen.getByLabelText('Giorno del Mese');
    await user.clear(dayInput);
    await user.type(dayInput, '15');

    // Fill other required fields
    await user.type(screen.getByLabelText('Nome Schedule'), 'Monthly Test');
    
    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Clienti'));

    await user.type(screen.getByLabelText('Ora'), '14:00');
    await user.type(screen.getByLabelText('Email Destinatario'), 'monthly@company.com');

    const saveBtn = screen.getByText('Salva Schedule');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(reportingService.createSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency: 'monthly',
          dayOfMonth: 15
        })
      );
    });
  });

  it('toggles schedule enabled/disabled', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Weekly Revenue Report')).toBeInTheDocument();
    });

    // Find and click toggle for first schedule
    const toggleBtn = screen.getByTestId('toggle-schedule-1');
    await user.click(toggleBtn);

    await waitFor(() => {
      expect(reportingService.updateSchedule).toHaveBeenCalledWith(1, {
        enabled: false
      });
    });
  });

  it('edits existing schedule', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Weekly Revenue Report')).toBeInTheDocument();
    });

    // Click edit button
    const editBtn = screen.getByTestId('edit-schedule-1');
    await user.click(editBtn);

    expect(screen.getByText('Modifica Schedule')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Weekly Revenue Report')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin@company.com')).toBeInTheDocument();
  });

  it('deletes schedule with confirmation', async () => {
    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Weekly Revenue Report')).toBeInTheDocument();
    });

    // Click delete button
    const deleteBtn = screen.getByTestId('delete-schedule-1');
    await user.click(deleteBtn);

    expect(global.confirm).toHaveBeenCalledWith(
      'Sei sicuro di voler eliminare questo schedule?'
    );

    await waitFor(() => {
      expect(reportingService.deleteSchedule).toHaveBeenCalledWith(1);
    });
  });

  it('cancels delete when user declines confirmation', async () => {
    // Mock window.confirm to return false
    global.confirm = vi.fn(() => false);

    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Weekly Revenue Report')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId('delete-schedule-1');
    await user.click(deleteBtn);

    expect(global.confirm).toHaveBeenCalled();
    expect(reportingService.deleteSchedule).not.toHaveBeenCalled();
  });

  it('shows next run time for enabled schedules', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Prossima esecuzione:')).toBeInTheDocument();
      expect(screen.getByText('22/01/2024 09:00')).toBeInTheDocument();
    });
  });

  it('handles schedule creation errors', async () => {
    reportingService.createSchedule.mockRejectedValue(new Error('Server error'));

    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    const newScheduleBtn = screen.getByText('Nuovo Schedule');
    await user.click(newScheduleBtn);

    // Fill and submit form
    await user.type(screen.getByLabelText('Nome Schedule'), 'Test Schedule');
    
    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Entrate'));

    await user.type(screen.getByLabelText('Ora'), '10:00');
    await user.type(screen.getByLabelText('Email Destinatario'), 'test@company.com');

    const saveBtn = screen.getByText('Salva Schedule');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Errore nella creazione dello schedule')).toBeInTheDocument();
    });
  });

  it('filters schedules by status', async () => {
    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Weekly Revenue Report')).toBeInTheDocument();
      expect(screen.getByText('Monthly Client Report')).toBeInTheDocument();
    });

    // Filter by enabled only
    const enabledFilter = screen.getByText('Solo Attivi');
    await user.click(enabledFilter);

    expect(screen.getByText('Weekly Revenue Report')).toBeInTheDocument();
    expect(screen.queryByText('Monthly Client Report')).not.toBeInTheDocument();
  });
});

// Performance tests
describe('ReportScheduler Performance', () => {
  it('handles large number of schedules efficiently', async () => {
    const largeScheduleList = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Schedule ${i + 1}`,
      type: 'revenue',
      frequency: 'daily',
      time: '09:00',
      format: 'PDF',
      email: `user${i + 1}@company.com`,
      enabled: i % 2 === 0
    }));

    reportingService.getScheduledReports.mockResolvedValue(largeScheduleList);

    const startTime = performance.now();

    render(
      <TestWrapper>
        <ReportScheduler />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Schedule 1')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within 1 second even with many schedules
    expect(renderTime).toBeLessThan(1000);
  });
});