import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Search, Filter, Calendar, DollarSign,
  Clock, CheckCircle, AlertCircle, Eye, Edit3, Trash2,
  Download, ChevronRight, Users, Target
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Skeleton, SkeletonCard } from './ui/Skeleton';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn, fadeInVariants, staggerContainer } from '../lib/utils';
import { formatDateWithFullMonth } from '../utils/dateUtils';

const ProposalsList = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const data = await api.getProposals(0, 100);
      setProposals(Array.isArray(data.proposals) ? data.proposals : []);
    } catch (error) {
      toast.error('Failed to load proposals');
      setProposals([]);
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
      case 'complete':
        return CheckCircle;
      case 'working':
      case 'in_progress':
        return Clock;
      case 'draft':
      default:
        return AlertCircle;
    }
  };

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter(proposal => {
      const matchesSearch = proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           proposal.project_idea?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'budget':
          return (b.budget || 0) - (a.budget || 0);
        default:
          return 0;
      }
    });

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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Your Proposals
              </h1>
              <p className="text-gray-600 mt-1">Manage and track all your Erasmus+ grant applications</p>
            </div>
            <button
              onClick={() => navigate('/new-proposal')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <Plus className="h-4 w-4" />
              New Proposal
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search with enhanced design */}
      <motion.div variants={fadeInVariants}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="working">In Progress</option>
                <option value="complete">Complete</option>
                <option value="submitted">Submitted</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="budget">Budget (High-Low)</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Proposals List */}
      <motion.div variants={fadeInVariants}>
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="py-16 text-center px-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No proposals found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters to find what you\'re looking for'
                  : 'Get started by creating your first Erasmus+ grant proposal'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => navigate('/new-proposal')}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 mx-auto font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Proposal
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProposals.map((proposal) => {
              const StatusIcon = getStatusIcon(proposal.status);
              return (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex-shrink-0">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer"
                                  onClick={() => navigate(`/proposals/${proposal.id}`)}>
                                {proposal.title || 'Untitled Proposal'}
                              </h3>
                              <p className="text-gray-600 line-clamp-2 mb-4">
                                {proposal.project_idea || 'No description available'}
                              </p>
                              
                              {/* Metadata */}
                              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Created {formatDateWithFullMonth(proposal.created_at)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4" />
                                  <span>€{proposal.budget?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{proposal.duration_months || 0} months</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{proposal.partners?.length || 0} partners</span>
                                </div>
                              </div>

                              {/* Priorities */}
                              {proposal.priorities && proposal.priorities.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {proposal.priorities.slice(0, 3).map((priority, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                    >
                                      {priority}
                                    </span>
                                  ))}
                                  {proposal.priorities.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                      +{proposal.priorities.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex flex-col items-end space-y-3 ml-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(proposal.status)} shadow-sm`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {proposal.status === 'complete' ? 'Complete' :
                             proposal.status === 'working' ? 'In Progress' :
                             proposal.status === 'draft' ? 'Draft' :
                             proposal.status === 'submitted' ? 'Submitted' :
                             proposal.status || 'Draft'}
                          </span>
                          
                          <div className="flex space-x-2">
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
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
    </div>
  );
};

export default ProposalsList;