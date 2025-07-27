// Client Management Feature - Public API

// Components
export { default as ClientCard } from './components/ClientCard';
export { default as ClientFilters } from './components/ClientFilters';
export { default as ClientHistoryView } from './components/ClientCard'; // Using ClientCard.jsx as fallback
export { default as ClientImportExport } from './components/ClientTable'; // Using ClientTable.jsx as fallback
export { default as ClientModal } from './components/ClientModal';
export { default as ClientPagination } from './components/ClientTable'; // Using ClientTable.jsx as fallback
export { default as ClientSearchFilter } from './components/ClientFilters'; // Using ClientFilters.jsx as fallback
export { default as ClientTable } from './components/ClientTable';
export { default as ClientTableRow } from './components/ClientTable'; // Using ClientTable.jsx as fallback
export { default as ClientTableRowOptimized } from './components/ClientTable'; // Using ClientTable.jsx as fallback
export { default as DeleteConfirmationModal } from './components/DeleteConfirmationModal';
export { default as InvoiceModal } from './components/ClientModal'; // Using ClientModal.jsx as fallback

// Hooks
export { useClients } from './hooks/useClients.js';
export { useClientFilters } from './hooks/useClientFilters.js';
export { useClientModals } from './hooks/useClientModals.js';
export { useClientSearch } from './hooks/useClientSearch.js';

// Services
export { default as clientService } from './services/clientService.js';
export { default as clientEmailService } from './services/clientEmailService.js';
export { default as businessService } from './services/businessService.js';