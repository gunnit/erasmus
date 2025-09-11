import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Award, Target, 
  Users, DollarSign, Calendar, FileText, CheckCircle, 
  Clock, AlertCircle, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { Skeleton } from './ui/Skeleton';
import api from '../services/api';
import { fadeInVariants, staggerContainer } from '../lib/utils';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch analytics data from API
      const [statsResponse, trendsResponse] = await Promise.all([
        api.get('/analytics/stats'),
        api.get(`/analytics/trends?time_range=${timeRange}`)
      ]);
      
      const overview = statsResponse.data?.overview || {};
      const trends = trendsResponse.data || {};
      
      const data = {
        overview: {
          totalProposals: overview.totalProposals || 0,
          totalBudget: overview.totalBudget || 0,
          successRate: overview.successRate || 0,
          avgDuration: overview.averageDuration || 24,
          totalPartners: overview.totalPartners || 0,
          completionRate: overview.completionRate || 0
        },
        trends: trends,
        priorities: [
          { name: 'Digital Transformation', value: 35, color: '#3B82F6' },
          { name: 'Social Inclusion', value: 25, color: '#10B981' },
          { name: 'Environmental', value: 20, color: '#F59E0B' },
          { name: 'Innovation', value: 15, color: '#8B5CF6' },
          { name: 'Other', value: 5, color: '#6B7280' }
        ],
        statusDistribution: [
          { status: 'Approved', count: overview.approvedProposals || 0, percentage: overview.successRate || 0 },
          { status: 'Pending', count: overview.pendingProposals || 0, percentage: 20 },
          { status: 'Rejected', count: overview.rejectedProposals || 0, percentage: 5 }
        ],
        partnerCountries: [
          { country: 'Germany', partners: 23 },
          { country: 'France', partners: 18 },
          { country: 'Spain', partners: 15 },
          { country: 'Italy', partners: 12 },
          { country: 'Poland', partners: 10 },
          { country: 'Others', partners: 11 }
        ]
      };
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set default data on error
      setAnalyticsData({
        overview: {
          totalProposals: 0,
          totalBudget: 0,
          successRate: 0,
          avgDuration: 24,
          totalPartners: 0,
          completionRate: 0
        },
        trends: { proposals: [], budget: [] },
        priorities: [],
        statusDistribution: [],
        partnerCountries: []
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {change && (
              <p className={`text-sm mt-2 flex items-center ${
                change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(change)}% from last {timeRange}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Track your Erasmus+ application performance</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={timeRange === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
          <Button
            variant={timeRange === 'year' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('year')}
          >
            Year
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={fadeInVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Proposals"
          value={analyticsData?.overview.totalProposals}
          change={12}
          icon={FileText}
          color="from-blue-500 to-indigo-600"
        />
        <StatCard
          title="Success Rate"
          value={`${analyticsData?.overview.successRate}%`}
          change={5}
          icon={Award}
          color="from-green-500 to-emerald-600"
        />
        <StatCard
          title="Total Budget"
          value={`€${(analyticsData?.overview.totalBudget / 1000000).toFixed(1)}M`}
          change={-3}
          icon={DollarSign}
          color="from-purple-500 to-pink-600"
        />
        <StatCard
          title="Active Partners"
          value={analyticsData?.overview.totalPartners}
          change={8}
          icon={Users}
          color="from-orange-500 to-red-600"
        />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proposals Trend */}
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Proposals Trend</CardTitle>
              <CardDescription>Monthly submission and approval rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData?.trends.proposals}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Submitted"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Approved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Utilization */}
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Budget Utilization</CardTitle>
              <CardDescription>Allocated vs Spent budget over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData?.trends.budget}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="allocated" 
                    stackId="1"
                    stroke="#8B5CF6" 
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                    name="Allocated"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="spent" 
                    stackId="2"
                    stroke="#F59E0B" 
                    fill="#F59E0B"
                    fillOpacity={0.6}
                    name="Spent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
              <CardDescription>Focus areas of submitted proposals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData?.priorities}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData?.priorities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Current proposal status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.statusDistribution.map((item, index) => {
                  const icons = {
                    Approved: CheckCircle,
                    Pending: Clock,
                    Rejected: AlertCircle
                  };
                  const colors = {
                    Approved: 'from-green-500 to-emerald-600',
                    Pending: 'from-yellow-500 to-orange-600',
                    Rejected: 'from-red-500 to-rose-600'
                  };
                  const Icon = icons[item.status];
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${colors[item.status]}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium">{item.status}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <Progress value={item.percentage} max={100} size="sm" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Partner Countries */}
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Partner Countries</CardTitle>
              <CardDescription>Distribution of partner organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData?.partnerCountries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="country" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="partners" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Rate */}
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Application Completion</CardTitle>
              <CardDescription>Average completion rate of applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="60%" 
                      outerRadius="90%" 
                      barSize={20} 
                      data={[{ value: analyticsData?.overview.completionRate, fill: '#3B82F6' }]}
                    >
                      <RadialBar dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{analyticsData?.overview.completionRate}%</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Analytics;