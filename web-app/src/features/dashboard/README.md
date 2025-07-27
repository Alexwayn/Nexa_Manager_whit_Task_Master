# Dashboard Feature

## Overview

The Dashboard feature provides the main business intelligence and overview interface for Nexa Manager. It displays key performance indicators (KPIs), real-time analytics, quick actions, and summarized data from all other features in an intuitive dashboard layout.

## Public API

### Components
- `DashboardOverview` - Main dashboard layout with widgets
- `KPICards` - Key performance indicator cards
- `RecentActivity` - Recent business activity feed
- `QuickActions` - Quick action buttons for common tasks
- `AnalyticsCharts` - Interactive charts and graphs

### Hooks
- `useDashboardData` - Main dashboard data management
- `useKPIs` - Key performance indicators data
- `useRecentActivity` - Recent activity feed data

### Services
- `dashboardService` - Dashboard data aggregation
- `kpiService` - KPI calculations and metrics
- `activityService` - Activity tracking and feed

## Integration Patterns

The dashboard integrates with all other features to provide a unified view:
- **Clients**: Client count, new clients, client activity
- **Financial**: Revenue, invoices, payments, expenses
- **Email**: Email campaigns, open rates, click rates
- **Calendar**: Upcoming events, appointments

## Testing Approach

Focus on testing data aggregation, KPI calculations, and real-time updates.

## Dependencies

- All other features for data aggregation
- Chart.js for data visualization
- Real-time subscriptions for live updates