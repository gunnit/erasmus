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
  Award, Briefcase, Globe, Sparkles, ChevronDown,
  ChevronRight, Building2
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { Skeleton, SkeletonCard } from './ui/Skeleton';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn, fadeInVariants, staggerContainer } from '../lib/utils';
import { formatDateWithFullMonth } from '../utils/dateUtils';
import SubscriptionStatus from './SubscriptionStatus';

const Dashboard = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [budgetMetrics, setBudgetMetrics] = useState(null);
  const [priorityMetrics, setPriorityMetrics] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setMetricsLoading(true);
    try {
      const [proposalsResponse, statsResponse, budgetResponse, priorityResponse, performanceResponse, subscriptionResponse] = await Promise.all([
        api.getProposals(0, 100),
        api.getDashboardStats(),
        api.getBudgetMetrics(12),
        api.getPriorityMetrics(),
        api.getPerformanceMetrics(6),
        api.get('/payments/subscription-status').catch(() => ({ data: null }))
      ]);

      // Handle proposals data
      const proposalsData = proposalsResponse?.proposals || [];
      setProposals(Array.isArray(proposalsData) ? proposalsData : []);

      // Handle stats data
      setStats(statsResponse?.stats || {
        totalProposals: proposalsData.length,
        approvedProposals: 0,
        pendingProposals: 0,
        rejectedProposals: 0,
        totalBudget: 0,
        successRate: 0,
        averageDuration: 24,
        totalPartners: 0
      });

      // Set metrics data
      setBudgetMetrics(budgetResponse);
      setPriorityMetrics(priorityResponse);
      setPerformanceMetrics(performanceResponse);
      setSubscriptionStatus(subscriptionResponse?.data);
    } catch (error) {
      const errorMessage = error.response?.data?.detail ||
                          error.response?.statusText ||
                          'Failed to load dashboard data';
      toast.error(errorMessage);

      // Still set default values but show the actual error
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
      setMetricsLoading(false);
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
      case 'submitted':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200';
      case 'complete':
        return 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200';
      case 'working':
      case 'in_progress':
        return 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200';
      case 'draft':
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
      case 'approved':
      case 'complete': return CheckCircle;
      case 'working':
      case 'pending': return Clock;
      case 'rejected': return AlertCircle;
      case 'draft':
      default: return FileText;
    }
  };

  // Get chart data from metrics or use defaults
  const budgetData = budgetMetrics?.data || [
    { name: 'Q1 2025', budget: 0, spent: 0 },
    { name: 'Q2 2025', budget: 0, spent: 0 },
    { name: 'Q3 2025', budget: 0, spent: 0 },
    { name: 'Q4 2025', budget: 0, spent: 0 }
  ];

  const priorityData = priorityMetrics?.data || [
    { name: 'Digital', value: 0, color: '#3B82F6' },
    { name: 'Inclusion', value: 0, color: '#8B5CF6' },
    { name: 'Green', value: 0, color: '#10B981' },
    { name: 'Democracy', value: 0, color: '#F59E0B' }
  ];

  const performanceData = performanceMetrics?.data || [
    { month: 'Jan', proposals: 0, approved: 0 },
    { month: 'Feb', proposals: 0, approved: 0 },
    { month: 'Mar', proposals: 0, approved: 0 },
    { month: 'Apr', proposals: 0, approved: 0 },
    { month: 'May', proposals: 0, approved: 0 },
    { month: 'Jun', proposals: 0, approved: 0 }
  ];

  const filteredProposals = Array.isArray(proposals)
    ? proposals.filter(proposal => {
        const matchesFilter = filter === 'all' || proposal.status === filter;
        const matchesSearch = proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           proposal.project_idea?.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Determine primary action based on user state
  const getPrimaryAction = () => {
    if (!subscriptionStatus?.has_subscription) {
      return { text: 'Start Free Draft', subtext: 'Upgrade for AI Generation' };
    }
    if (subscriptionStatus?.proposals_remaining <= 0) {
      return { text: 'Create Manual Draft', subtext: 'No AI generations left' };
    }
    const inProgressProposal = proposals.find(p => p.status === 'draft' || p.status === 'pending');
    if (inProgressProposal) {
      return { text: 'Continue Working', subtext: inProgressProposal.title, proposalId: inProgressProposal.id };
    }
    return { text: 'Start New Application', subtext: `${subscriptionStatus.proposals_remaining} AI generations available` };
  };

  const primaryAction = getPrimaryAction();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
      {/* Header with enhanced design */}
      <motion.div variants={fadeInVariants}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage your Erasmus+ grant applications</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/partners')}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-all hover:shadow-md"
              >
                <Users className="h-4 w-4" />
                Partners
              </button>
              <button
                onClick={() => navigate('/new-proposal')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                New Proposal
              </button>
            </div>
          </div>
        </div>

        {/* Priority Action Zone with enhanced design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SubscriptionStatus />

          {/* Primary Action Card with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative p-8 flex flex-col justify-center h-full">
              <h3 className="text-xl font-bold text-white mb-2">
                {primaryAction.proposalId ? 'Continue Your Work' : 'Start New Application'}
              </h3>
              <p className="text-blue-100 mb-6 text-sm">
                {primaryAction.subtext}
              </p>
              <button
                onClick={() => {
                  if (primaryAction.proposalId) {
                    navigate(`/proposals/${primaryAction.proposalId}`);
                  } else {
                    navigate('/new-proposal');
                  }
                }}
                className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                {primaryAction.proposalId ? <ArrowRight className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {primaryAction.text}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Work Section with enhanced design */}
      {proposals.length > 0 ? (
        <motion.div variants={fadeInVariants}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Your Proposals
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{filteredProposals.length} total proposals</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search proposals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                  </div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="working">In Progress</option>
                    <option value="complete">Complete</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposal</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProposals.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-500">
                          No proposals found matching your search
                        </td>
                      </tr>
                    ) : (
                      filteredProposals.slice(0, 10).map((proposal, index) => {
                        const StatusIcon = getStatusIcon(proposal.status);
                        // Calculate completion percentage based on filled answers
                        const totalQuestions = 27;
                        const filledAnswers = proposal.answers ? Object.values(proposal.answers).filter(a => a && a.length > 0).length : 0;
                        const completionPercentage = Math.round((filledAnswers / totalQuestions) * 100);

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
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(proposal.status)} shadow-sm`}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {proposal.status === 'complete' ? 'Complete' :
                                 proposal.status === 'working' ? 'In Progress' :
                                 proposal.status === 'draft' ? 'Draft' :
                                 proposal.status === 'submitted' ? 'Submitted' :
                                 proposal.status || 'Draft'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-24">
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${completionPercentage}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{completionPercentage}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm font-medium">€{proposal.budget?.toLocaleString()}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-500">
                                {formatDateWithFullMonth(proposal.updated_at || proposal.created_at)}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => navigate(`/proposals/${proposal.id}`)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:shadow-md group"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                                </button>
                                <button
                                  onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:shadow-md group"
                                  title="Edit"
                                >
                                  <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                                </button>
                                <button
                                  onClick={() => handleDelete(proposal.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-all hover:shadow-md group"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-600" />
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
              {filteredProposals.length > 10 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate('/proposals')}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md font-medium text-sm"
                  >
                    View All {filteredProposals.length} Proposals
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        /* Empty State with enhanced design */
        <motion.div variants={fadeInVariants}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="py-16 text-center px-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Proposals Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Start your first Erasmus+ grant application in just 30 minutes with AI-powered assistance</p>
              <button
                onClick={() => navigate('/new-proposal')}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 mx-auto font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                Create Your First Proposal
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Stats Cards */}
      {proposals.length > 0 && (
        <motion.div variants={fadeInVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Proposals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalProposals || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {stats?.totalBudget > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Budget</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">€{(stats.totalBudget / 1000000).toFixed(1)}M</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          )}

          {stats?.averageDuration > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Duration</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.averageDuration}</p>
                  <p className="text-sm text-gray-600">months</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Charts Section - Collapsed by default, only show if meaningful data */}
      {proposals.length > 3 && (
        <motion.div variants={fadeInVariants}>
          <details className="group">
            <summary className="cursor-pointer py-4 flex items-center justify-between text-gray-700 hover:text-gray-900">
              <h2 className="text-lg font-semibold">Analytics & Insights</h2>
              <ChevronDown className="w-5 h-5 transform transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Budget Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Quarterly budget allocation and spending</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Focus</CardTitle>
            <CardDescription>Distribution across EU priorities</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
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
            )}
            {!metricsLoading && (
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
            )}
          </CardContent>
        </Card>
            </div>
          </details>
        </motion.div>
      )}

      {/* Quick Links with enhanced design */}
      <motion.div variants={fadeInVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <button
            onClick={() => navigate('/proposals')}
            className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
          >
            View All Proposals
          </button>
          <span className="text-gray-300 self-center">•</span>
          <button
            onClick={() => navigate('/partners')}
            className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
          >
            Partner Library
          </button>
          <span className="text-gray-300 self-center">•</span>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
          >
            Account Settings
          </button>
        </div>
      </motion.div>
    </motion.div>
    </div>
  );
};

export default Dashboard;