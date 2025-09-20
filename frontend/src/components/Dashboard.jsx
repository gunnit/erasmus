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
  Award, Briefcase, Globe, Sparkles, ChevronDown
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

      console.log('Proposals response:', proposalsResponse);
      console.log('Stats response:', statsResponse);
      console.log('Budget metrics:', budgetResponse);
      console.log('Priority metrics:', priorityResponse);
      console.log('Performance metrics:', performanceResponse);

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
      console.error('Dashboard fetch error:', error);
      console.error('Error details:', error.response?.data);

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
      case 'approved': return 'from-green-500 to-emerald-500';
      case 'complete': return 'from-purple-500 to-purple-600';
      case 'working':
      case 'pending': return 'from-yellow-500 to-orange-500';
      case 'rejected': return 'from-red-500 to-rose-500';
      case 'draft':
      default: return 'from-gray-500 to-gray-600';
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header with Subscription Status and Primary Action */}
      <motion.div variants={fadeInVariants} className="space-y-6">
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage your Erasmus+ proposals</p>
          </div>
        </div>

        {/* Priority Action Zone - Subscription Status + Primary CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscription Status - Now at top priority */}
          <SubscriptionStatus />

          {/* Primary Action Card */}
          <Card className="h-full">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    if (primaryAction.proposalId) {
                      navigate(`/proposals/${primaryAction.proposalId}`);
                    } else {
                      navigate('/new-proposal');
                    }
                  }}
                  size="lg"
                  icon={primaryAction.proposalId ? ArrowRight : Plus}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {primaryAction.text}
                </Button>
                {primaryAction.subtext && (
                  <p className="text-sm text-gray-600 text-center">
                    {primaryAction.subtext}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Active Work Section - Proposals Table (moved up) */}
      {proposals.length > 0 ? (
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Your Proposals</CardTitle>
                  <CardDescription>{filteredProposals.length} total proposals</CardDescription>
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
                    <option value="draft">Draft</option>
                    <option value="pending">In Progress</option>
                    <option value="approved">Approved</option>
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Completion</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Budget</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Modified</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
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
                              <div className="flex items-center">
                                <div className={cn(
                                  "p-1 rounded-lg bg-gradient-to-r",
                                  getStatusColor(proposal.status)
                                )}>
                                  <StatusIcon className="w-4 h-4 text-white" />
                                </div>
                                <span className="ml-2 text-sm font-medium capitalize">
                                  {proposal.status === 'draft' ? 'Draft' :
                                   proposal.status === 'working' ? 'In Progress' :
                                   proposal.status === 'complete' ? 'Complete' :
                                   proposal.status === 'submitted' ? 'Submitted' :
                                   proposal.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <Progress value={completionPercentage} max={100} size="sm" className="w-20" />
                                <span className="text-sm text-gray-600">{completionPercentage}%</span>
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
              {filteredProposals.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => navigate('/proposals')}
                    variant="outline"
                    size="sm"
                  >
                    View All {filteredProposals.length} Proposals
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Proposals Yet</h3>
              <p className="text-gray-600 mb-6">Start your first Erasmus+ grant application in just 30 minutes</p>
              <Button
                onClick={() => navigate('/new-proposal')}
                size="lg"
                icon={Plus}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Create Your First Proposal
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Simplified Stats Cards - Only show real data */}
      {proposals.length > 0 && (
        <motion.div variants={fadeInVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Proposals</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalProposals || 0}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {stats?.totalBudget > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Budget</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">€{(stats.totalBudget / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Euro className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats?.averageDuration > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Duration</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageDuration}</p>
                    <p className="text-xs text-gray-500 mt-1">months</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Clock className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
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

      {/* Quick Links - Simplified */}
      <motion.div variants={fadeInVariants} className="border-t pt-6">
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <button
            onClick={() => navigate('/proposals')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            View All Proposals
          </button>
          <span className="text-gray-300">•</span>
          <button
            onClick={() => navigate('/resources')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Learning Resources
          </button>
          <span className="text-gray-300">•</span>
          <button
            onClick={() => navigate('/profile')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Account Settings
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;