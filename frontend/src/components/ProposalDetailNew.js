import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
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
  Briefcase
} from 'lucide-react';
import WorkplanViewer from './WorkplanViewer';

const ProposalDetailNew = () => {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
    } catch (error) {
      toast.error('Failed to load proposal');
      navigate('/dashboard');
    } finally {
      setLoading(false);
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
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${proposal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
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
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return CheckCircle;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Link to="/proposals" className="text-gray-500 hover:text-gray-700 mr-2">
                  Proposals
                </Link>
                <span className="text-gray-500 mx-2">/</span>
                <span className="text-gray-900">{proposal.title}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                  <StatusIcon className="h-4 w-4" />
                  {proposal.status || 'Draft'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created: {formatDate(proposal.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Updated: {formatDate(proposal.updated_at)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/proposals/${id}/answers`)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Edit Answers
              </button>
              <button
                onClick={handleExportPDF}
                disabled={generatingPdf}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export PDF
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/proposals/${id}/edit`)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit Details
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Progress</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Completion</span>
              <span className="text-lg font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress < 100 && (
              <p className="mt-3 text-sm text-gray-600">
                Complete all 27 questions to finish your application
              </p>
            )}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => navigate(`/proposals/${id}/answers`)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 text-lg font-medium"
              >
                {progress === 0 ? 'Start Generating Answers' : progress < 100 ? 'Continue Editing Answers' : 'Review Answers'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Overview
                </span>
              </button>
              <button
                onClick={() => setActiveTab('workplan')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'workplan'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Workplan
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Project Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Project Idea</label>
                  <p className="text-gray-900">{proposal.project_idea || 'Not specified'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Duration
                    </label>
                    <p className="text-gray-900">{proposal.duration_months || 24} months</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Budget
                    </label>
                    <p className="text-gray-900">€{Number(proposal.budget || 250000).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Priorities */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-gray-500" />
                Selected Priorities
              </h2>
              {proposal.priorities && proposal.priorities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {proposal.priorities.map((priority, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {priority}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No priorities selected</p>
              )}
            </div>
          </div>

          {/* Target Groups */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-gray-500" />
                Target Groups
              </h2>
              {proposal.target_groups && proposal.target_groups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {proposal.target_groups.map((group, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                    >
                      {typeof group === 'object' ? JSON.stringify(group) : group}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No target groups specified</p>
              )}
            </div>
          </div>

          {/* Partners */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                Partner Organizations
              </h2>
              {proposal.partners && proposal.partners.length > 0 ? (
                <ul className="space-y-2">
                  {proposal.partners.map((partner, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      <span className="text-gray-900 text-sm">
                        {typeof partner === 'object' ?
                          `${partner.name || 'Partner ' + (index + 1)}${partner.country ? ' (' + partner.country + ')' : ''}${partner.type ? ' - ' + partner.type : ''}`
                          : partner}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No partner organizations added</p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              Answer Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
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
                <p className="text-sm text-gray-600 mt-1">Answers Completed</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-600">
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
                <p className="text-sm text-gray-600 mt-1">Answers Remaining</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">6</p>
                <p className="text-sm text-gray-600 mt-1">Total Sections</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Next Steps</h3>
          <p className="text-blue-700 mb-4">
            {progress === 0
              ? "Start generating AI-powered answers for your Erasmus+ application."
              : progress < 100
              ? "Continue working on your application to complete all required sections."
              : "Review your completed application and export it as a PDF."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/proposals/${id}/answers`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {progress === 0 ? 'Start Application' : 'Continue Application'}
            </button>
            {progress === 100 && (
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>
    ) : activeTab === 'workplan' ? (
      <div className="bg-white rounded-lg shadow p-6">
        <WorkplanViewer
          proposalId={id}
          proposalData={proposal}
          onWorkplanGenerated={(workplan) => {
            setProposal(prev => ({ ...prev, workplan }));
            toast.success('Workplan generated successfully!');
          }}
        />
      </div>
    ) : null}
    </div>
  </div>
  );
};

export default ProposalDetailNew;