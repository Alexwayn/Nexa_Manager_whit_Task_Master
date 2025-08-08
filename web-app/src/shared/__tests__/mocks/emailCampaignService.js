// Mock for emailCampaignService
const mockEmailCampaignService = {
  baseTrackingUrl: 'http://localhost:3000',
  
  createCampaign: jest.fn().mockResolvedValue({
    id: 'test-campaign-id',
    name: 'Test Campaign',
    status: 'draft'
  }),
  
  getCampaigns: jest.fn().mockResolvedValue([]),
  
  getCampaign: jest.fn().mockResolvedValue({
    id: 'test-campaign-id',
    name: 'Test Campaign',
    status: 'draft'
  }),
  
  updateCampaign: jest.fn().mockResolvedValue({
    id: 'test-campaign-id',
    name: 'Updated Campaign',
    status: 'draft'
  }),
  
  deleteCampaign: jest.fn().mockResolvedValue(true),
  
  sendCampaign: jest.fn().mockResolvedValue({
    id: 'test-campaign-id',
    status: 'sent'
  }),
  
  trackOpen: jest.fn().mockResolvedValue(true),
  
  trackClick: jest.fn().mockResolvedValue(true),
  
  getAnalytics: jest.fn().mockResolvedValue({
    opens: 0,
    clicks: 0,
    bounces: 0,
    unsubscribes: 0
  })
};

// Named exports
export const getEmailCampaignService = () => mockEmailCampaignService;
export const emailCampaignService = mockEmailCampaignService;

// Default export
export default getEmailCampaignService;
