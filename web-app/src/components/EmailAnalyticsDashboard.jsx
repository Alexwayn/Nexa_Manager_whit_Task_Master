import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area 
} from 'recharts';
import { 
  Mail, Send, Inbox, Star, Users, TrendingUp, TrendingDown, 
  Clock, Target, Eye, MousePointer, Reply, Download, RefreshCw,
  Calendar, Filter, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import emailAnalyticsService from '@lib/emailAnalyticsService';
import { useToast } from '@/hooks/use-toast';
import { formatNumber, formatPercentage, formatDate } from '@utils/formatters';

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

const EmailAnalyticsDashboard = ({ userId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [userId, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const result = await emailAnalyticsService.getDashboardAnalytics(userId, {
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString(),
        includeRealTime: true,
      });

      if (result.success) {
        setAnalytics(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load analytics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Analytics refreshed successfully',
    });
  };

  const generateReport = async (format = 'json') => {
    try {
      const result = await emailAnalyticsService.generateEmailReport(userId, {
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString(),
        format,
        includeCharts: true,
        includeDetails: true,
      });

      if (result.success) {
        // Handle download based on format
        if (format === 'csv' || format === 'pdf') {
          // Trigger download
          const blob = new Blob([result.data], { 
            type: format === 'csv' ? 'text/csv' : 'application/pdf' 
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `email-report-${formatDate(new Date())}.${format}`;
          a.click();
          URL.revokeObjectURL(url);
        }
        
        toast({
          title: 'Success',
          description: `Report generated successfully`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
        <Button onClick={loadAnalytics} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const { 
    overview = {
      totalEmails: 0,
      sentEmails: 0,
      receivedEmails: 0,
      unreadEmails: 0,
      openRate: 0,
      clickRate: 0,
      responseRate: 0,
      deliveryRate: 0,
      businessEmails: 0,
      invoiceEmails: 0,
      quoteEmails: 0,
      reminderEmails: 0,
      growthMetrics: {}
    }, 
    activity = {
      dailyTrends: [],
      hourlyDistribution: []
    }, 
    clients = {
      topClients: [],
      responseRates: []
    }, 
    performance = {
      templates: []
    }, 
    realTime = {
      last24Hours: {
        emailsSent: 0,
        opens: 0,
        clicks: 0
      },
      queue: {
        pending: 0
      }
    }
  } = analytics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Email Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your email performance
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Button
            variant="outline"
            onClick={refreshAnalytics}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select onValueChange={generateReport}>
            <SelectTrigger className="w-40">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON Report</SelectItem>
              <SelectItem value="csv">CSV Export</SelectItem>
              <SelectItem value="pdf">PDF Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Emails</p>
                <p className="text-2xl font-bold">{formatNumber(overview.totalEmails)}</p>
                {overview.growthMetrics?.emailGrowth && (
                  <div className="flex items-center mt-1">
                    {overview.growthMetrics.emailGrowth > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      overview.growthMetrics.emailGrowth > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {overview.growthMetrics.emailGrowth}%
                    </span>
                  </div>
                )}
              </div>
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sent Emails</p>
                <p className="text-2xl font-bold">{formatNumber(overview.sentEmails)}</p>
                <div className="flex items-center mt-1">
                  <Eye className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-500">
                    {formatPercentage(overview.openRate)}% open rate
                  </span>
                </div>
              </div>
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received Emails</p>
                <p className="text-2xl font-bold">{formatNumber(overview.receivedEmails)}</p>
                <div className="flex items-center mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {formatNumber(overview.unreadEmails)} unread
                  </Badge>
                </div>
              </div>
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(overview.responseRate)}%</p>
                <div className="flex items-center mt-1">
                  <Reply className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">
                    {formatPercentage(overview.clickRate)}% click rate
                  </span>
                </div>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity */}
      {realTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Real-time Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {formatNumber(realTime.last24Hours.emailsSent)}
                </p>
                <p className="text-sm text-muted-foreground">Emails sent (24h)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {formatNumber(realTime.last24Hours.opens)}
                </p>
                <p className="text-sm text-muted-foreground">Opens (24h)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">
                  {formatNumber(realTime.last24Hours.clicks)}
                </p>
                <p className="text-sm text-muted-foreground">Clicks (24h)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">
                  {formatNumber(realTime.queue.pending)}
                </p>
                <p className="text-sm text-muted-foreground">Queue pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Email Types Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Email Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Business', value: overview.businessEmails, color: CHART_COLORS[0] },
                        { name: 'Invoices', value: overview.invoiceEmails, color: CHART_COLORS[1] },
                        { name: 'Quotes', value: overview.quoteEmails, color: CHART_COLORS[2] },
                        { name: 'Reminders', value: overview.reminderEmails, color: CHART_COLORS[3] },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Delivery Rate', value: overview.deliveryRate },
                      { name: 'Open Rate', value: overview.openRate },
                      { name: 'Click Rate', value: overview.clickRate },
                      { name: 'Response Rate', value: overview.responseRate },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="value" fill={CHART_COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Email Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activity.dailyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="sent" stackId="1" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} />
                    <Area type="monotone" dataKey="received" stackId="1" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Hourly Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activity.hourlyDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Clients by Email Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(clients.topClients || []).map((client, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                      <Badge variant="secondary">
                        {formatNumber(client.emailCount)} emails
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Client Response Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Client Response Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clients.responseRates || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="client" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="responseRate" fill={CHART_COLORS[3]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Template Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Template Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(performance.templates || []).map((template, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(template.uses)} uses
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPercentage(template.openRate)}%</p>
                        <p className="text-sm text-muted-foreground">open rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Response Time</span>
                    <span className="font-medium">
                      {performance.responseTimes?.average || '0'} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fastest Response</span>
                    <span className="font-medium text-green-500">
                      {performance.responseTimes?.fastest || '0'} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slowest Response</span>
                    <span className="font-medium text-red-500">
                      {performance.responseTimes?.slowest || '0'} days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailAnalyticsDashboard;