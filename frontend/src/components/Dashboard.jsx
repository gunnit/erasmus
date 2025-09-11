import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, AreaChart, Area
} from 'recharts';
import { 
  FileText, TrendingUp, Clock, CheckCircle, AlertCircle,
  Plus, ArrowRight, Calendar, Euro, Users, Target,
  Download, Edit3, Trash2, Eye, Filter, Search,
  Award, Briefcase, Globe, Sparkles
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { Skeleton, SkeletonCard } from './ui/Skeleton';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn, fadeInVariants, staggerContainer } from '../lib/utils';

const Dashboard = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proposalsResponse, statsResponse] = await Promise.all([
        api.getProposals(0, 100),
        api.getDashboardStats()
      ]);
      
      // Handle proposals data
      const proposalsData = proposalsResponse?.proposals || proposalsResponse || [];
      setProposals(Array.isArray(proposalsData) ? proposalsData : []);
      
      // Handle stats data
      setStats(statsResponse?.stats || {
        totalProposals: 0,
        approvedProposals: 0,
        pendingProposals: 0,
        rejectedProposals: 0,
        totalBudget: 0,
        successRate: 0,
        averageDuration: 24,
        totalPartners: 0
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
      setProposals([]);
      setStats({
        totalProposals: 0,
        approvedProposals: 0,
        pendingProposals: 0,
        rejectedProposals: 0,
        totalBudget: 0,
        successRate: 0,
        averageDuration: 24,
        totalPartners: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this proposal?')) {
      try {
        await api.deleteProposal(id);
        setProposals(proposals.filter(p => p.id !== id));
        toast.success('Proposal deleted successfully');
      } catch (error) {
        toast.error('Failed to delete proposal');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'from-green-500 to-emerald-500';
      case 'pending': return 'from-yellow-500 to-orange-500';
      case 'rejected': return 'from-red-500 to-rose-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return AlertCircle;
      default: return FileText;
    }
  };

  // Chart data
  const budgetData = [
    { name: 'Q1', budget: 450000, spent: 320000 },
    { name: 'Q2', budget: 600000, spent: 480000 },
    { name: 'Q3', budget: 750000, spent: 620000 },
    { name: 'Q4', budget: 600000, spent: 450000 }
  ];

  const priorityData = [
    { name: 'Digital', value: 35, color: '#3B82F6' },
    { name: 'Inclusion', value: 30, color: '#8B5CF6' },
    { name: 'Climate', value: 20, color: '#10B981' },
    { name: 'Democracy', value: 15, color: '#F59E0B' }
  ];

  const performanceData = [
    { month: 'Jan', proposals: 2, approved: 2 },
    { month: 'Feb', proposals: 3, approved: 2 },
    { month: 'Mar', proposals: 4, approved: 3 },
    { month: 'Apr', proposals: 3, approved: 3 },
    { month: 'May', proposals: 5, approved: 4 },
    { month: 'Jun', proposals: 4, approved: 3 }
  ];

  const filteredProposals = Array.isArray(proposals) 
    ? proposals.filter(proposal => {
        const matchesFilter = filter === 'all' || proposal.status === filter;
        const matchesSearch = proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        return matchesFilter && matchesSearch;
      })
    : [];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage your Erasmus+ proposals</p>
        </div>
        <Button
          onClick={() => navigate('/new-proposal')}
          size="lg"
          icon={Plus}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          New Proposal
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={fadeInVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Proposals</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalProposals}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +20% from last month
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.successRate}%</p>
                <Progress value={stats?.successRate} max={100} size="sm" variant="success" className="mt-2" />
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">€{(stats?.totalBudget / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-gray-500 mt-2">Across all projects</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Euro className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Partners</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalPartners}</p>
                <p className="text-xs text-gray-500 mt-2">From 12 countries</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={fadeInVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Quarterly budget allocation and spending</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={budgetData}>
                <defs>
                  <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="budget" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorBudget)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="spent" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorSpent)" 
                  strokeWidth={2}
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Focus</CardTitle>
            <CardDescription>Distribution across EU priorities</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {priorityData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Chart */}
      <motion.div variants={fadeInVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Proposal Performance</CardTitle>
            <CardDescription>Monthly submission and approval trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="proposals" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="approved" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Proposals Table */}
      <motion.div variants={fadeInVariants}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Recent Proposals</CardTitle>
                <CardDescription>Manage and track your proposals</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search proposals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Budget</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">
                        No proposals found
                      </td>
                    </tr>
                  ) : (
                    filteredProposals.map((proposal, index) => {
                      const StatusIcon = getStatusIcon(proposal.status);
                      return (
                        <motion.tr
                          key={proposal.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{proposal.title}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {proposal.partner_organizations?.length || 0} partners
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className={cn(
                                "p-1 rounded-lg bg-gradient-to-r",
                                getStatusColor(proposal.status)
                              )}>
                                <StatusIcon className="w-4 h-4 text-white" />
                              </div>
                              <span className="ml-2 text-sm font-medium capitalize">
                                {proposal.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium">€{proposal.budget?.toLocaleString()}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm">{proposal.duration_months} months</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500">
                              {new Date(proposal.created_at).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => navigate(`/proposals/${proposal.id}`)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDelete(proposal.id)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeInVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/new-proposal')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Create New Proposal</h3>
                <p className="text-sm text-gray-500 mt-1">Start a new application</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">View Templates</h3>
                <p className="text-sm text-gray-500 mt-1">Browse proposal templates</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Learning Resources</h3>
                <p className="text-sm text-gray-500 mt-1">Improve your applications</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;