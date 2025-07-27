import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryProvider } from '@tanstack/react-query';
import ReportGenerator from '../ReportGenerator';
import * as reportingService from '@/services\reportingService';

// Mock services
jest.mock('../../../services/reportingService');

// Mock data
const mockReportTypes = [
  { value: 'revenue', label: 'Report Entrate', description: 'Analisi delle entrate per periodo' },
  { value: 'expenses', label: 'Report Spese', description: 'Analisi delle spese per categoria' },
  { value: 'client', label: 'Report Clienti', description: 'Analisi dei clienti e progetti' },
  { value: 'project', label: 'Report Progetti', description: 'Stato e performance dei progetti' }
];

const mockGeneratedReport = {
  id: 'report_123',
  name: 'Revenue Report Q1 2024',
  type: 'revenue',
  format: 'PDF',
  status: 'completed',
  downloadUrl: '/api/reports/download/report_123.pdf',
  createdAt: '2024-01-15T10:00:00Z',
  size: '2.5 MB'
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

describe('ReportGenerator Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    reportingService.getReportTypes.mockResolvedValue(mockReportTypes);
    reportingService.generateReport.mockResolvedValue(mockGeneratedReport);
    reportingService.validateReportParams.mockResolvedValue({ valid: true });
  });

  it('renders form elements correctly', async () => {
    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    expect(screen.getByText('Genera Nuovo Report')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo Report')).toBeInTheDocument();
    expect(screen.getByLabelText('Data Inizio')).toBeInTheDocument();
    expect(screen.getByLabelText('Data Fine')).toBeInTheDocument();
    expect(screen.getByLabelText('Formato')).toBeInTheDocument();
    expect(screen.getByText('Genera Report')).toBeInTheDocument();
  });

  it('loads report types on mount', async () => {
    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(reportingService.getReportTypes).toHaveBeenCalled();
    });

    // Check if report types are loaded in select
    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    
    expect(screen.getByText('Report Entrate')).toBeInTheDocument();
    expect(screen.getByText('Report Spese')).toBeInTheDocument();
  });

  it('validates form before submission', async () => {
    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    // Try to submit without filling required fields
    const generateBtn = screen.getByText('Genera Report');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Seleziona un tipo di report')).toBeInTheDocument();
      expect(screen.getByText('Seleziona data inizio')).toBeInTheDocument();
      expect(screen.getByText('Seleziona data fine')).toBeInTheDocument();
    });

    expect(reportingService.generateReport).not.toHaveBeenCalled();
  });

  it('validates date range', async () => {
    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    // Set end date before start date
    await user.type(screen.getByLabelText('Data Inizio'), '2024-01-31');
    await user.type(screen.getByLabelText('Data Fine'), '2024-01-01');

    const generateBtn = screen.getByText('Genera Report');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('La data fine deve essere successiva alla data inizio')).toBeInTheDocument();
    });
  });

  it('generates report successfully', async () => {
    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    // Fill form
    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Report Entrate'));

    await user.type(screen.getByLabelText('Data Inizio'), '2024-01-01');
    await user.type(screen.getByLabelText('Data Fine'), '2024-01-31');

    const formatSelect = screen.getByLabelText('Formato');
    await user.click(formatSelect);
    await user.click(screen.getByText('PDF'));

    // Submit form
    const generateBtn = screen.getByText('Genera Report');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(reportingService.generateReport).toHaveBeenCalledWith({
        type: 'revenue',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        format: 'PDF',
        name: expect.any(String)
      });
    });

    // Check success message
    expect(screen.getByText('Report generato con successo!')).toBeInTheDocument();
  });

  it('shows loading state during generation', async () => {
    // Mock slow response
    reportingService.generateReport.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockGeneratedReport), 1000))
    );

    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    // Fill and submit form
    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Report Entrate'));

    await user.type(screen.getByLabelText('Data Inizio'), '2024-01-01');
    await user.type(screen.getByLabelText('Data Fine'), '2024-01-31');

    const generateBtn = screen.getByText('Genera Report');
    await user.click(generateBtn);

    // Check loading state
    expect(screen.getByText('Generazione in corso...')).toBeInTheDocument();
    expect(generateBtn).toBeDisabled();
  });

  it('handles generation errors', async () => {
    reportingService.generateReport.mockRejectedValue(new Error('Server error'));

    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    // Fill and submit form
    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Report Entrate'));

    await user.type(screen.getByLabelText('Data Inizio'), '2024-01-01');
    await user.type(screen.getByLabelText('Data Fine'), '2024-01-31');

    const generateBtn = screen.getByText('Genera Report');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Errore nella generazione del report')).toBeInTheDocument();
    });
  });

  it('supports custom report names', async () => {
    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    // Fill form with custom name
    const nameInput = screen.getByLabelText('Nome Report (opzionale)');
    await user.type(nameInput, 'Custom Revenue Report');

    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Report Entrate'));

    await user.type(screen.getByLabelText('Data Inizio'), '2024-01-01');
    await user.type(screen.getByLabelText('Data Fine'), '2024-01-31');

    const generateBtn = screen.getByText('Genera Report');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(reportingService.generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Custom Revenue Report'
        })
      );
    });
  });

  it('supports different output formats', async () => {
    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    // Test Excel format
    const formatSelect = screen.getByLabelText('Formato');
    await user.click(formatSelect);
    await user.click(screen.getByText('Excel'));

    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Report Entrate'));

    await user.type(screen.getByLabelText('Data Inizio'), '2024-01-01');
    await user.type(screen.getByLabelText('Data Fine'), '2024-01-31');

    const generateBtn = screen.getByText('Genera Report');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(reportingService.generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'Excel'
        })
      );
    });
  });

  it('resets form after successful generation', async () => {
    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    // Fill and submit form
    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Report Entrate'));

    await user.type(screen.getByLabelText('Data Inizio'), '2024-01-01');
    await user.type(screen.getByLabelText('Data Fine'), '2024-01-31');

    const generateBtn = screen.getByText('Genera Report');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Report generato con successo!')).toBeInTheDocument();
    });

    // Check form is reset
    expect(screen.getByLabelText('Data Inizio')).toHaveValue('');
    expect(screen.getByLabelText('Data Fine')).toHaveValue('');
  });

  it('provides download link after generation', async () => {
    render(
      <TestWrapper>
        <ReportGenerator />
      </TestWrapper>
    );

    // Generate report
    const typeSelect = screen.getByLabelText('Tipo Report');
    await user.click(typeSelect);
    await user.click(screen.getByText('Report Entrate'));

    await user.type(screen.getByLabelText('Data Inizio'), '2024-01-01');
    await user.type(screen.getByLabelText('Data Fine'), '2024-01-31');

    const generateBtn = screen.getByText('Genera Report');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Scarica Report')).toBeInTheDocument();
    });

    const downloadLink = screen.getByText('Scarica Report');
    expect(downloadLink).toHaveAttribute('href', mockGeneratedReport.downloadUrl);
  });
});

// Integration tests
describe('ReportGenerator Integration', () => {
  it('integrates with report scheduling', async () => {
    const onSchedule = vi.fn();
    
    render(
      <TestWrapper>
        <ReportGenerator onSchedule={onSchedule} />
      </TestWrapper>
    );

    // Generate report and schedule
    const typeSelect = screen.getByLabelText('Tipo Report');
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Report Entrate'));

    await userEvent.type(screen.getByLabelText('Data Inizio'), '2024-01-01');
    await userEvent.type(screen.getByLabelText('Data Fine'), '2024-01-31');

    const generateBtn = screen.getByText('Genera Report');
    await userEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Programma Report')).toBeInTheDocument();
    });

    const scheduleBtn = screen.getByText('Programma Report');
    await userEvent.click(scheduleBtn);

    expect(onSchedule).toHaveBeenCalledWith({
      type: 'revenue',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      format: 'PDF'
    });
  });
});