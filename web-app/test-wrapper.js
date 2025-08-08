// Simple test wrapper
const testWrapper = {
  async storeEmail(userId, emailData) {
    return { success: true, message: 'Test wrapper working' };
  },
  
  async getEmails(userId, options = {}) {
    if (!userId) {
      return { 
        success: false, 
        error: 'User ID is required',
        data: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
      };
    }
    return { success: true, data: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } };
  }
};

export default testWrapper;