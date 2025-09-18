import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Wand2, Loader2 } from 'lucide-react';

const ProposalEdit = () => {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    project_idea: '',
    budget: '',
    duration_months: '',
    priorities: [],
    target_groups: []
  });
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchProposal();
    fetchSubscriptionStatus();
  }, [id]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/payments/subscription-status');
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    }
  };

  const fetchProposal = async () => {
    try {
      const data = await api.getProposal(id);
      setProposal(data);
      setFormData({
        title: data.title || '',
        project_idea: data.project_idea || '',
        budget: data.budget || '',
        duration_months: data.duration_months || '',
        priorities: data.priorities || [],
        target_groups: data.target_groups || []
      });
    } catch (error) {
      toast.error('Failed to load proposal');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(item => item)
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.title && !formData.project_idea) {
      toast.error('Please enter a project title or some initial description');
      return;
    }

    if (!subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0) {
      toast.error('No AI generation credits available. Please upgrade your subscription.');
      navigate('/pricing');
      return;
    }

    setIsGeneratingDescription(true);

    try {
      const response = await api.generateProjectDescription(
        formData.title,
        formData.project_idea || ''
      );

      if (response.success && response.description) {
        setFormData(prev => ({
          ...prev,
          project_idea: response.description
        }));
        toast.success('Description enhanced with AI!');
      } else {
        toast.error('Failed to generate description');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      if (error.response?.status === 403) {
        toast.error('No AI generation credits available');
        navigate('/pricing');
      } else {
        toast.error('Failed to generate description. Please try again.');
      }
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.updateProposal(id, formData);
      toast.success('Proposal updated successfully');
      navigate(`/proposals/${id}`);
    } catch (error) {
      toast.error('Failed to update proposal');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to={`/proposals/${id}`} className="mr-4 text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Proposal</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Edit Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Project Idea */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Project Idea *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDescription || (!formData.title && !formData.project_idea) || !subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0}
                  className="px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title={!subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0 ? 'No AI generation credits available' : 'Enhance description with AI'}
                >
                  {isGeneratingDescription ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      AI Generate
                    </>
                  )}
                </button>
              </div>
              <textarea
                name="project_idea"
                value={formData.project_idea}
                onChange={handleChange}
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your project idea... Or enter a title above and click 'AI Generate' for assistance."
                required
              />
              {subscriptionStatus && !subscriptionStatus.has_subscription && (
                <p className="mt-1 text-sm text-orange-600">
                  No AI credits available. <Link to="/pricing" className="underline">Get a subscription</Link> to use AI features.
                </p>
              )}
              {subscriptionStatus?.has_subscription && subscriptionStatus.proposals_remaining <= 0 && (
                <p className="mt-1 text-sm text-orange-600">
                  No generations remaining. <Link to="/pricing" className="underline">Upgrade your plan</Link> to continue using AI.
                </p>
              )}
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget
              </label>
              <select
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select budget range</option>
                <option value="60000">€60,000 (Small-scale)</option>
                <option value="120000">€120,000</option>
                <option value="250000">€250,000</option>
                <option value="400000">€400,000 (Maximum)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (months)
              </label>
              <input
                type="number"
                name="duration_months"
                value={formData.duration_months}
                onChange={handleChange}
                min="12"
                max="36"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12-36 months"
              />
            </div>

            {/* Priorities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EU Priorities (comma-separated)
              </label>
              <input
                type="text"
                value={formData.priorities.join(', ')}
                onChange={(e) => handleArrayChange('priorities', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Digital transformation, Inclusion and diversity"
              />
              <p className="mt-1 text-sm text-gray-500">
                Common priorities: Digital transformation, Green transition, Inclusion and diversity
              </p>
            </div>

            {/* Target Groups */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Groups (comma-separated)
              </label>
              <input
                type="text"
                value={formData.target_groups.join(', ')}
                onChange={(e) => handleArrayChange('target_groups', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Adult learners, Educators, Policy makers"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end">
            <div className="space-x-4">
              <Link
                to={`/proposals/${id}`}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition inline-block"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalEdit;