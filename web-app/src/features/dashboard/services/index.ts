// Dashboard Services
// Placeholder exports - actual services will be implemented as needed

export const dashboardService = {
  getDashboardData: async () => ({ widgets: [], stats: {} }),
  updateLayout: async () => ({ success: true })
};

export const widgetService = {
  getWidgets: async () => [],
  createWidget: async () => ({ id: '', type: 'metric' })
};

export const notificationService = {
  getNotifications: async () => [],
  markAsRead: async () => ({ success: true })
};
