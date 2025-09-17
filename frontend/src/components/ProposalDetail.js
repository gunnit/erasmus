import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDateWithFullMonth } from '../utils/dateUtils';

const ProposalDetail = () => {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({});
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

  const handleExportPDF = async () => {
    try {
      toast.loading('Generating PDF...');
      
      // First, generate the PDF
      const response = await api.generateAnswers({
        ...proposal,
        generate_pdf: true
      });
      
      // Then download it
      if (response.application_id) {
        await api.exportToPDF(response.application_id);
        toast.success('PDF downloaded successfully');
      }
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handleSubmitProposal = async () => {
    try {
      await api.submitProposal(id);
      fetchProposal();
    } catch (error) {
      toast.error('Failed to submit proposal');
    }
  };

  const handleDeleteProposal = async () => {
    if (window.confirm('Are you sure you want to delete this proposal?')) {
      try {
        await api.deleteProposal(id);
        navigate('/dashboard');
      } catch (error) {
        toast.error('Failed to delete proposal');
      }
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-green-100 text-green-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || statusColors.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatQuestionTitle = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Eu /g, 'EU ')
      .replace(/Wp /g, 'WP ');
  };

  const renderQuestionAnswer = (question, answer, index) => {
    return (
      <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">
          {formatQuestionTitle(question)}
        </h4>
        <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
        {answer && answer.length > 500 && (
          <div className="mt-2 text-sm text-gray-400">
            Character count: {answer.length}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title, content, icon, color = 'blue') => {
    const isExpanded = expandedSections[title] !== false;
    
    return (
      <div className="mb-6">
        <button
          onClick={() => toggleSection(title)}
          className={`w-full flex items-center justify-between p-4 bg-${color}-50 rounded-lg hover:bg-${color}-100 transition`}
        >
          <div className="flex items-center">
            <div className={`p-2 bg-${color}-500 rounded-lg mr-3`}>
              {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <svg 
            className={`h-6 w-6 text-gray-600 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/dashboard" className="mr-4 text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Created: {formatDateWithFullMonth(proposal.created_at)} |
                  Updated: {formatDateWithFullMonth(proposal.updated_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(proposal.status)}
              <button
                onClick={() => navigate(`/proposals/${id}/edit`)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Edit Proposal
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Action Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              {proposal.status === 'draft' && (
                <button
                  onClick={handleSubmitProposal}
                  className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition flex items-center"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit Proposal
                </button>
              )}
              <button
                onClick={handleExportPDF}
                className="bg-indigo-500 text-white px-6 py-2 rounded-md hover:bg-indigo-600 transition flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </div>
            <button
              onClick={handleDeleteProposal}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Proposal
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'overview' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('full-application')}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'full-application' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Full Application
              </button>
              <button
                onClick={() => setActiveTab('raw-data')}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'raw-data' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Raw Data
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Key Information Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Project Title</h3>
                      <p className="mt-1 text-lg text-gray-900">{proposal.title}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                      <p className="mt-1 text-lg text-gray-900">
                        {proposal.duration_months ? `${proposal.duration_months} months` : 'Not specified'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                      <p className="mt-1 text-lg text-gray-900">
                        {proposal.budget ? `€${parseInt(proposal.budget).toLocaleString()}` : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">EU Priorities</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {proposal.priorities?.map((priority, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {priority}
                          </span>
                        )) || <span className="text-gray-400">None specified</span>}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Target Groups</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {proposal.target_groups?.map((group, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {group}
                          </span>
                        )) || <span className="text-gray-400">None specified</span>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {proposal.project_idea && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-500">Project Idea</h3>
                    <p className="mt-2 text-gray-700 leading-relaxed">{proposal.project_idea}</p>
                  </div>
                )}
              </div>

              {/* Partners Section */}
              {proposal.partners && proposal.partners.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Partner Organizations</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {proposal.partners.map((partner, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900">{partner.name || partner.organization}</h4>
                        <p className="text-sm text-gray-600 mt-1">{partner.country}</p>
                        <p className="text-sm text-gray-500 mt-1">{partner.role || partner.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Summary from Answers */}
              {proposal.answers?.project_summary && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Executive Summary</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {typeof proposal.answers.project_summary === 'object' 
                        ? proposal.answers.project_summary.summary 
                        : proposal.answers.project_summary}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Full Application Tab */}
          {activeTab === 'full-application' && (
            <div className="space-y-6">
              {proposal.answers ? (
                <>
                  {/* Project Summary Section */}
                  {proposal.answers.project_summary && renderSection(
                    'Project Summary',
                    Object.entries(proposal.answers.project_summary).map(([key, value], idx) => 
                      renderQuestionAnswer(key, value, idx)
                    ),
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}

                  {/* Relevance Section */}
                  {proposal.answers.relevance && renderSection(
                    'Relevance of the Project',
                    Object.entries(proposal.answers.relevance).map(([key, value], idx) => 
                      renderQuestionAnswer(key, value, idx)
                    ),
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>,
                    'purple'
                  )}

                  {/* Needs Analysis Section */}
                  {proposal.answers.needs_analysis && renderSection(
                    'Needs Analysis',
                    Object.entries(proposal.answers.needs_analysis).map(([key, value], idx) => 
                      renderQuestionAnswer(key, value, idx)
                    ),
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>,
                    'green'
                  )}

                  {/* Partnership Section */}
                  {proposal.answers.partnership && renderSection(
                    'Partnership and Cooperation',
                    Object.entries(proposal.answers.partnership).map(([key, value], idx) => 
                      renderQuestionAnswer(key, value, idx)
                    ),
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>,
                    'indigo'
                  )}

                  {/* Impact Section */}
                  {proposal.answers.impact && renderSection(
                    'Impact',
                    Object.entries(proposal.answers.impact).map(([key, value], idx) => 
                      renderQuestionAnswer(key, value, idx)
                    ),
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>,
                    'yellow'
                  )}

                  {/* Project Management Section */}
                  {proposal.answers.project_management && renderSection(
                    'Project Management',
                    Object.entries(proposal.answers.project_management).map(([key, value], idx) => 
                      renderQuestionAnswer(key, value, idx)
                    ),
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>,
                    'red'
                  )}

                  {/* Work Packages Section */}
                  {proposal.answers.work_packages && renderSection(
                    'Work Packages',
                    Object.entries(proposal.answers.work_packages).map(([key, value], idx) => 
                      renderQuestionAnswer(key, value, idx)
                    ),
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>,
                    'pink'
                  )}
                </>
              ) : (
                <div className="bg-white rounded-lg shadow p-8">
                  <p className="text-center text-gray-500">No generated answers available yet.</p>
                  <div className="text-center mt-4">
                    <button
                      onClick={() => navigate(`/proposals/${id}/edit`)}
                      className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition"
                    >
                      Generate Answers
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Raw Data Tab */}
          {activeTab === 'raw-data' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Raw Proposal Data</h2>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(proposal, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail;