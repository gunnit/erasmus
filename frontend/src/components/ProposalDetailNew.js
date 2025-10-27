import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDateWithFullMonth } from '../utils/dateUtils';
import ReactMarkdown from 'react-markdown';
// Import priority helper functions
import { getPriorityByCode, getPriorityType } from '../config/erasmusPriorities';
import {
  Loader2,
  FileText,
  Download,
  Edit3,
  Trash2,
  Clock,
  Calendar,
  Users,
  Target,
  DollarSign,
  Award,
  BarChart3,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Wand2,
  Briefcase,
  BarChart2,
  Info,
  ChevronRight,
  Building2,
  Globe2,
  TrendingUp,
  FileCheck,
  Sparkles
} from 'lucide-react';
import WorkplanViewer from './WorkplanViewer';
import QualityScoreCard from './QualityScoreCard';
import ConversationalAI from './ConversationalAI';

const ProposalDetailNew = () => {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [qualityScore, setQualityScore] = useState(null);
  const [calculatingScore, setCalculatingScore] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      const data = await api.getProposal(id);
      setProposal(data);

      // Fetch quality score if available
      if (data.quality_score !== null) {
        fetchQualityScore(false);
      }
    } catch (error) {
      toast.error('Failed to load proposal');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchQualityScore = async (recalculate = false) => {
    try {
      const score = await api.getQualityScore(id, recalculate);
      setQualityScore(score);
    } catch (error) {
      console.error('Failed to fetch quality score:', error);
    }
  };

  const handleCalculateScore = async () => {
    setCalculatingScore(true);
    try {
      const score = await api.calculateQualityScore(id);
      setQualityScore(score);

      // Update proposal with new score
      setProposal(prev => ({
        ...prev,
        quality_score: score.overall_score
      }));

      toast.success('Quality score calculated successfully');
    } catch (error) {
      toast.error('Failed to calculate quality score');
    } finally {
      setCalculatingScore(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this proposal?')) return;

    setDeleting(true);
    try {
      await api.deleteProposal(id);
      toast.success('Proposal deleted successfully');
      navigate('/proposals');
    } catch (error) {
      toast.error('Failed to delete proposal');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportPDF = async () => {
    setGeneratingPdf(true);
    try {
      const blob = await api.getProposalPDF(id);

      // Validate blob type
      if (!blob || blob.type !== 'application/pdf') {
        throw new Error('Invalid file type received. Expected PDF.');
      }

      // Validate blob size (should be > 0)
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${proposal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);

      let errorMessage = 'Failed to export PDF';

      if (error.response?.status === 404) {
        errorMessage = 'PDF not found. Please regenerate your proposal answers first.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error while generating PDF. Please try again in a moment.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You don\'t have permission to export this proposal.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const calculateProgress = () => {
    if (!proposal?.answers) return 0;

    let totalAnswered = 0;
    let totalQuestions = 27; // Total questions in the form

    Object.values(proposal.answers).forEach(section => {
      if (typeof section === 'object') {
        totalAnswered += Object.values(section).filter(a => a).length;
      }
    });

    return Math.round((totalAnswered / totalQuestions) * 100);
  };

  const formatDate = (dateString) => {
    return formatDateWithFullMonth(dateString);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Proposal not found</h2>
          <Link to="/dashboard" className="mt-4 text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const StatusIcon = getStatusIcon(proposal.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20">
      {/* Header with improved design */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* Breadcrumb with improved styling */}
              <nav className="flex items-center mb-3 text-sm">
                <Link to="/proposals" className="text-gray-500 hover:text-blue-600 transition-colors flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Proposals
                </Link>
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                <span className="text-gray-900 font-medium">{proposal.title}</span>
              </nav>

              {/* Title and metadata with enhanced styling */}
              <h1 className="text-2xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {proposal.title}
              </h1>

              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(proposal.status)} shadow-sm`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {proposal.status === 'complete' ? 'Complete' :
                   proposal.status === 'working' ? 'In Progress' :
                   proposal.status === 'draft' ? 'Draft' :
                   proposal.status === 'submitted' ? 'Submitted' :
                   proposal.status || 'Draft'}
                </span>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(proposal.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(proposal.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons with improved styling */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/proposals/${id}/answers`)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm font-medium"
              >
                <Sparkles className="h-4 w-4" />
                Edit Answers
              </button>
              <button
                onClick={handleExportPDF}
                disabled={generatingPdf}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-all hover:shadow-md"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/proposals/${id}/edit`)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-all hover:shadow-md"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-all hover:shadow-md"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with improved layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Progress Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl mb-6 overflow-hidden relative">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Application Progress</h2>
                <p className="text-blue-100 text-sm">
                  {progress === 100 ? 'Your application is complete!' :
                   progress === 0 ? 'Ready to start your application' :
                   `${Math.round((progress / 100) * 27)} of 27 questions completed`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold text-white">{progress}%</span>
                <p className="text-blue-100 text-xs mt-1">Complete</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="w-full bg-white/20 rounded-full h-4 backdrop-blur-sm">
                <div
                  className="bg-white h-4 rounded-full transition-all duration-500 shadow-sm flex items-center justify-end pr-2"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 0 && progress < 100 && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => navigate(`/proposals/${id}/answers`)}
                className="px-8 py-3.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 flex items-center gap-2 text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Sparkles className="h-5 w-5" />
                {progress === 0 ? 'Start Generating Answers' : progress < 100 ? 'Continue Application' : 'Review Answers'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50/50">
            <nav className="flex px-2 py-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'overview'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  Overview
                </span>
              </button>
              <button
                onClick={() => setActiveTab('workplan')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'workplan'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Workplan
                </span>
              </button>
              <button
                onClick={() => setActiveTab('quality')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'quality'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Quality Score
                  {proposal?.quality_score && (
                    <span className={`ml-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                      proposal.quality_score >= 75
                        ? 'bg-green-100 text-green-700'
                        : proposal.quality_score >= 60
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {Math.round(proposal.quality_score)}
                    </span>
                  )}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content with enhanced styling */}
        {activeTab === 'overview' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{proposal.duration_months || 24}</p>
                <p className="text-sm text-gray-500">months</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">€{(Number(proposal.budget || 250000) / 1000).toFixed(0)}K</p>
                <p className="text-sm text-gray-500">total funding</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-8 w-8 text-purple-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Partners</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {(proposal.library_partners?.length || 0) + (proposal.partners?.length || 0)}
                </p>
                <p className="text-sm text-gray-500">organizations</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-8 w-8 text-orange-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Priorities</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{proposal.priorities?.length || 0}</p>
                <p className="text-sm text-gray-500">selected</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Information with enhanced card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Project Information
                    </h2>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                      title="Edit project details in dashboard"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Details
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Idea</label>
                      <div className="mt-2 text-gray-900 prose prose-sm max-w-none bg-gray-50 rounded-lg p-4">
                        {proposal.project_idea ? (
                          <ReactMarkdown>{proposal.project_idea}</ReactMarkdown>
                        ) : (
                          <p className="text-gray-400 italic">No project idea specified</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priorities with enhanced design */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    Selected Priorities
                  </h2>
                </div>
                <div className="p-6">
                  {proposal.priorities && proposal.priorities.length > 0 ? (
                    <div className="space-y-2">
                      {proposal.priorities.map((priorityCode, index) => {
                        const priority = typeof getPriorityByCode === 'function' ? getPriorityByCode(priorityCode) : null;
                        const priorityType = typeof getPriorityType === 'function' ? getPriorityType(priorityCode) : '';
                        return (
                          <div
                            key={index}
                            className="group px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-all cursor-default"
                            title={priority?.description || ''}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">
                                {priority?.name || priorityCode}
                              </span>
                              {priorityType && (
                                <span className="px-2 py-1 bg-white text-xs font-medium text-purple-600 rounded-full">
                                  {priorityType}
                                </span>
                              )}
                            </div>
                            {priority?.description && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {priority.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No priorities selected</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Groups with enhanced design */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Target Groups
                  </h2>
                </div>
                <div className="p-6">
                  {proposal.target_groups && proposal.target_groups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {proposal.target_groups.map((group, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-all"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <span className="text-gray-900 font-medium">
                            {typeof group === 'string' ? group : group?.name || `Target Group ${index + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No target groups specified</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Partners with enhanced design */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Partner Organizations
                  </h2>
                </div>
                <div className="p-6">
                  {/* Library Partners */}
                  {proposal.library_partners && proposal.library_partners.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        From Partner Library
                      </h3>
                      <div className="space-y-3">
                        {proposal.library_partners.map((partner) => (
                          <div key={partner.id} className="group p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-cyan-100 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {partner.name}
                                </h4>
                                <div className="flex items-center gap-3 mt-2 text-sm">
                                  {partner.country && (
                                    <span className="flex items-center gap-1 text-gray-600">
                                      <Globe2 className="h-3.5 w-3.5" />
                                      {partner.country}
                                    </span>
                                  )}
                                  {partner.type && (
                                    <span className="px-2 py-0.5 bg-white text-xs font-medium text-blue-600 rounded-full">
                                      {partner.type.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {partner.affinity_score && (
                                <div className="flex-shrink-0 ml-4">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {partner.affinity_score}%
                                    </div>
                                    <div className="text-xs text-gray-500">Affinity</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legacy Partners */}
                  {proposal.partners && proposal.partners.length > 0 ? (
                    <div>
                      {proposal.library_partners && proposal.library_partners.length > 0 && (
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Other Partners</h3>
                      )}
                      <div className="space-y-2">
                        {proposal.partners.map((partner, index) => {
                          const isInLibrary = proposal.library_partners?.some(
                            lp => lp.name === (typeof partner === 'string' ? partner : partner?.name)
                          );
                          if (isInLibrary) return null;

                          return (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <span className="text-gray-900 font-medium">
                                {typeof partner === 'string'
                                  ? partner
                                  : `${partner?.name || 'Partner ' + (index + 1)}${partner?.country ? ' (' + partner.country + ')' : ''}${partner?.type ? ' - ' + partner.type : ''}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : !proposal.library_partners || proposal.library_partners.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No partner organizations added</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Statistics with enhanced design */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Application Statistics
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <FileCheck className="h-10 w-10 text-blue-500" />
                      </div>
                      <p className="text-4xl font-bold text-blue-600">
                        {(() => {
                          let count = 0;
                          if (proposal.answers) {
                            Object.values(proposal.answers).forEach(section => {
                              if (typeof section === 'object') {
                                count += Object.values(section).filter(a => a).length;
                              }
                            });
                          }
                          return count;
                        })()}
                      </p>
                      <p className="text-sm font-medium text-blue-700 mt-2">Completed</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <FileCheck className="h-32 w-32 text-blue-600" />
                    </div>
                  </div>

                  <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200 hover:from-orange-100 hover:to-red-100 transition-all">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="h-10 w-10 text-orange-500" />
                      </div>
                      <p className="text-4xl font-bold text-orange-600">
                        {27 - (() => {
                          let count = 0;
                          if (proposal.answers) {
                            Object.values(proposal.answers).forEach(section => {
                              if (typeof section === 'object') {
                                count += Object.values(section).filter(a => a).length;
                              }
                            });
                          }
                          return count;
                        })()}
                      </p>
                      <p className="text-sm font-medium text-orange-700 mt-2">Remaining</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <Clock className="h-32 w-32 text-orange-600" />
                    </div>
                  </div>

                  <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-all">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <BarChart3 className="h-10 w-10 text-green-500" />
                      </div>
                      <p className="text-4xl font-bold text-green-600">6</p>
                      <p className="text-sm font-medium text-green-700 mt-2">Sections</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <BarChart3 className="h-32 w-32 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps with enhanced design */}
            <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  Next Steps
                </h3>
                <p className="text-blue-100 mb-6 text-base">
                  {progress === 0
                    ? "Ready to start? Let AI generate comprehensive answers for your Erasmus+ application in minutes."
                    : progress < 100
                    ? `You're ${progress}% complete! Continue working on your application to finish all required sections.`
                    : "Congratulations! Your application is complete. Review and export it as a PDF."}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/proposals/${id}/answers`)}
                    className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <Sparkles className="h-5 w-5" />
                    {progress === 0 ? 'Start Application' : 'Continue Application'}
                  </button>
                  {progress === 100 && (
                    <button
                      onClick={handleExportPDF}
                      className="px-6 py-3 bg-blue-700/30 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-blue-700/40 flex items-center gap-2 font-semibold transition-all"
                    >
                      <Download className="h-5 w-5" />
                      Export PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'workplan' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <WorkplanViewer
              proposalId={id}
              proposalData={proposal}
              onWorkplanGenerated={(workplan) => {
                setProposal(prev => ({ ...prev, workplan }));
                toast.success('Workplan generated successfully!');
              }}
            />
          </div>
        ) : activeTab === 'quality' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quality Score Card with enhanced design */}
            <div className="lg:col-span-2">
              {qualityScore ? (
                <QualityScoreCard
                  score={qualityScore}
                  loading={calculatingScore}
                />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Quality Assessment</h3>
                  </div>
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-6">
                      <TrendingUp className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">
                      Quality Score Not Calculated
                    </h4>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Analyze your proposal against official Erasmus+ evaluation criteria to identify strengths and areas for improvement
                    </p>
                    <button
                      onClick={handleCalculateScore}
                      disabled={calculatingScore || !proposal?.answers}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                      {calculatingScore ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          Calculating Score...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-5 w-5 mr-2" />
                          Calculate Quality Score
                        </>
                      )}
                    </button>
                    {!proposal?.answers && (
                      <p className="text-red-500 text-sm mt-6 bg-red-50 border border-red-200 rounded-lg px-4 py-2 inline-block">
                        ⚠️ Answers must be generated before calculating the quality score
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions and Info with enhanced design */}
            <div className="space-y-4">
              {/* Recalculate Button */}
              {qualityScore && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">Actions</h3>
                  </div>
                  <div className="p-4">
                    <button
                      onClick={handleCalculateScore}
                      disabled={calculatingScore}
                      className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:shadow-md transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {calculatingScore ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Recalculating...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Recalculate Score
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Scoring Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Scoring Details</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Version</span>
                    <span className="text-sm font-medium text-gray-900">1.0</span>
                  </div>
                  {qualityScore?.calculated_at && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDateWithFullMonth(qualityScore.calculated_at)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Pass Threshold</span>
                    <span className="text-sm font-medium text-green-600">60/100</span>
                  </div>
                </div>
              </div>

              {/* Help */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Evaluation Criteria
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Your proposal is assessed against official Erasmus+ standards:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-blue-900">Relevance</span>
                    <span className="text-sm font-bold text-blue-600">30%</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-blue-900">Partnership</span>
                    <span className="text-sm font-bold text-blue-600">20%</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-blue-900">Impact</span>
                    <span className="text-sm font-bold text-blue-600">25%</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-blue-900">Management</span>
                    <span className="text-sm font-bold text-blue-600">25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Conversational AI Assistant */}
      <ConversationalAI
        projectContext={{
          title: proposal?.title,
          field: proposal?.field,
          project_idea: proposal?.project_idea,
          priorities: proposal?.priorities,
          target_groups: proposal?.target_groups,
          partners: proposal?.partners || proposal?.library_partners,
          budget: proposal?.budget,
          duration: proposal?.duration
        }}
        currentAnswers={proposal?.answers}
        proposalId={proposal?.id}
      />
    </div>
  );
};

export default ProposalDetailNew;