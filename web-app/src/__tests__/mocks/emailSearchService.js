/**
 * Mock for emailSearchService
 * Provides mock implementations for email search functionality
 */

const mockEmailSearchService = {
  searchEmails: jest.fn().mockResolvedValue({
    emails: [],
    total: 0,
    hasMore: false,
  }),
  searchBySubject: jest.fn().mockResolvedValue([]),
  searchBySender: jest.fn().mockResolvedValue([]),
  searchByDateRange: jest.fn().mockResolvedValue([]),
  searchByContent: jest.fn().mockResolvedValue([]),
  getSearchSuggestions: jest.fn().mockResolvedValue([]),
  saveSearchQuery: jest.fn().mockResolvedValue(true),
  getRecentSearches: jest.fn().mockResolvedValue([]),
  clearSearchHistory: jest.fn().mockResolvedValue(true),
  indexEmail: jest.fn().mockResolvedValue(true),
  reindexEmails: jest.fn().mockResolvedValue(true),
  getSearchStats: jest.fn().mockResolvedValue({
    totalEmails: 0,
    indexedEmails: 0,
    lastIndexed: new Date().toISOString(),
  }),
};

// Default export
export default mockEmailSearchService;

// Named exports
export const emailSearchService = mockEmailSearchService;
export const getEmailSearchService = () => mockEmailSearchService;
export const searchEmails = mockEmailSearchService.searchEmails;
export const searchBySubject = mockEmailSearchService.searchBySubject;
export const searchBySender = mockEmailSearchService.searchBySender;
export const searchByDateRange = mockEmailSearchService.searchByDateRange;
export const searchByContent = mockEmailSearchService.searchByContent;
export const getSearchSuggestions = mockEmailSearchService.getSearchSuggestions;
export const saveSearchQuery = mockEmailSearchService.saveSearchQuery;
export const getRecentSearches = mockEmailSearchService.getRecentSearches;
export const clearSearchHistory = mockEmailSearchService.clearSearchHistory;
export const indexEmail = mockEmailSearchService.indexEmail;
export const reindexEmails = mockEmailSearchService.reindexEmails;
export const getSearchStats = mockEmailSearchService.getSearchStats;

// CommonJS compatibility
module.exports = mockEmailSearchService;
module.exports.default = mockEmailSearchService;
module.exports.emailSearchService = mockEmailSearchService;
module.exports.getEmailSearchService = () => mockEmailSearchService;
module.exports.searchEmails = mockEmailSearchService.searchEmails;
module.exports.searchBySubject = mockEmailSearchService.searchBySubject;
module.exports.searchBySender = mockEmailSearchService.searchBySender;
module.exports.searchByDateRange = mockEmailSearchService.searchByDateRange;
module.exports.searchByContent = mockEmailSearchService.searchByContent;
module.exports.getSearchSuggestions = mockEmailSearchService.getSearchSuggestions;
module.exports.saveSearchQuery = mockEmailSearchService.saveSearchQuery;
module.exports.getRecentSearches = mockEmailSearchService.getRecentSearches;
module.exports.clearSearchHistory = mockEmailSearchService.clearSearchHistory;
module.exports.indexEmail = mockEmailSearchService.indexEmail;
module.exports.reindexEmails = mockEmailSearchService.reindexEmails;
module.exports.getSearchStats = mockEmailSearchService.getSearchStats;
