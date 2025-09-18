import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Loader2, Save, ArrowLeft, Plus, Trash2,
  Target, Users, Globe, Calendar, Euro, Building2,
  CheckCircle, AlertCircle, Briefcase, MapPin,
  Cloud, CloudOff, Info, Edit3, FileText
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { cn } from '../lib/utils';

const PRIORITIES = {
  horizontal: [
    { code: 'HP-01', name: 'Inclusion and Diversity', icon: Users, color: 'from-purple-500 to-pink-500', description: 'Social inclusion and outreach' },
    { code: 'HP-02', name: 'Digital Transformation', icon: Globe, color: 'from-blue-500 to-cyan-500', description: 'Digital readiness and capacity' },
    { code: 'HP-03', name: 'Environment and Climate', icon: Target, color: 'from-green-500 to-emerald-500', description: 'Fight against climate change' },
    { code: 'HP-04', name: 'Democratic Participation', icon: CheckCircle, color: 'from-orange-500 to-red-500', description: 'Civic engagement' }
  ],
  sectorSpecific: [
    { code: 'AE-01', name: 'Key Competences', icon: Briefcase, color: 'from-indigo-500 to-purple-500', description: 'High-quality learning for adults' },
    { code: 'AE-02', name: 'Learning Pathways', icon: ArrowLeft, color: 'from-teal-500 to-blue-500', description: 'Upskilling and transitions' },
    { code: 'AE-03', name: 'Professional Development', icon: Building2, color: 'from-rose-500 to-orange-500', description: 'Educator competences' }
  ]
};

const ORGANIZATION_TYPES = [
  { value: 'NGO', label: 'Non-Governmental Organization' },
  { value: 'PUBLIC', label: 'Public Institution' },
  { value: 'PRIVATE', label: 'Private Company' },
  { value: 'EDUCATION', label: 'Educational Institution' },
  { value: 'RESEARCH', label: 'Research Center' },
  { value: 'SOCIAL', label: 'Social Enterprise' }
];

const ProposalEdit = () => {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [formData, setFormData] = useState({
    title: '',
    project_idea: '',
    budget_eur: 250000,
    duration_months: 24,
    lead_organization: {
      name: '',
      type: 'NGO',
      country: '',
      city: '',
      experience: ''
    },
    partner_organizations: [
      { name: '', type: 'NGO', country: '', role: '' },
      { name: '', type: 'NGO', country: '', role: '' }
    ],
    selected_priorities: [],
    target_groups: ''
  });

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchProposal();
    fetchSubscriptionStatus();
  }, [id]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

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

      // Map the data to our form structure
      setFormData({
        title: data.title || '',
        project_idea: data.project_idea || '',
        budget_eur: data.budget || 250000,
        duration_months: data.duration_months || 24,
        lead_organization: data.lead_organization || {
          name: '',
          type: 'NGO',
          country: '',
          city: '',
          experience: ''
        },
        partner_organizations: data.partner_organizations || [
          { name: '', type: 'NGO', country: '', role: '' },
          { name: '', type: 'NGO', country: '', role: '' }
        ],
        selected_priorities: data.priorities || [],
        target_groups: Array.isArray(data.target_groups)
          ? data.target_groups.join(', ')
          : data.target_groups || ''
      });
    } catch (error) {
      toast.error('Failed to load proposal');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = async (data) => {
    if (!id) return;

    try {
      setSaveStatus('saving');

      // Prepare data for API
      const saveData = {
        ...data,
        budget: data.budget_eur,
        priorities: data.selected_priorities,
        target_groups: typeof data.target_groups === 'string'
          ? data.target_groups.split(',').map(item => item.trim()).filter(item => item)
          : data.target_groups
      };

      await api.updateProposal(id, saveData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const triggerAutoSave = (newData) => {
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save
    setSaveStatus('pending');
    const timeout = setTimeout(() => {
      handleAutoSave(newData);
    }, 1500); // Save after 1.5 seconds of inactivity

    setSaveTimeout(timeout);
  };

  const handleInputChange = (field, value) => {
    const newData = {
      ...formData,
      [field]: value
    };
    setFormData(newData);
    triggerAutoSave(newData);
  };

  const handleLeadOrgChange = (field, value) => {
    const newData = {
      ...formData,
      lead_organization: {
        ...formData.lead_organization,
        [field]: value
      }
    };
    setFormData(newData);
    triggerAutoSave(newData);
  };

  const handlePartnerChange = (index, field, value) => {
    const newPartners = [...formData.partner_organizations];
    newPartners[index] = {
      ...newPartners[index],
      [field]: value
    };
    const newData = {
      ...formData,
      partner_organizations: newPartners
    };
    setFormData(newData);
    triggerAutoSave(newData);
  };

  const addPartner = () => {
    if (formData.partner_organizations.length < 10) {
      const newData = {
        ...formData,
        partner_organizations: [
          ...formData.partner_organizations,
          { name: '', type: 'NGO', country: '', role: '' }
        ]
      };
      setFormData(newData);
      triggerAutoSave(newData);
      toast.success('Partner added');
    } else {
      toast.error('Maximum 10 partners allowed');
    }
  };

  const removePartner = (index) => {
    if (formData.partner_organizations.length > 2) {
      const newPartners = formData.partner_organizations.filter((_, i) => i !== index);
      const newData = {
        ...formData,
        partner_organizations: newPartners
      };
      setFormData(newData);
      triggerAutoSave(newData);
      toast.success('Partner removed');
    } else {
      toast.error('Minimum 2 partners required');
    }
  };

  const handlePriorityToggle = (priorityCode) => {
    const isSelected = formData.selected_priorities.includes(priorityCode);
    let newPriorities;

    if (isSelected) {
      newPriorities = formData.selected_priorities.filter(p => p !== priorityCode);
    } else {
      if (formData.selected_priorities.length >= 3) {
        toast.error('Maximum 3 priorities allowed');
        return;
      }
      newPriorities = [...formData.selected_priorities, priorityCode];
    }

    const newData = {
      ...formData,
      selected_priorities: newPriorities
    };
    setFormData(newData);
    triggerAutoSave(newData);
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
        const newData = {
          ...formData,
          project_idea: response.description
        };
        setFormData(newData);
        triggerAutoSave(newData);
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
      // Prepare data for API
      const saveData = {
        title: formData.title,
        project_idea: formData.project_idea,
        budget: formData.budget_eur,
        duration_months: formData.duration_months,
        lead_organization: formData.lead_organization,
        partner_organizations: formData.partner_organizations,
        priorities: formData.selected_priorities,
        target_groups: typeof formData.target_groups === 'string'
          ? formData.target_groups.split(',').map(item => item.trim()).filter(item => item)
          : formData.target_groups
      };

      await api.updateProposal(id, saveData);
      toast.success('Proposal updated successfully');
      navigate(`/proposals/${id}`);
    } catch (error) {
      toast.error('Failed to update proposal');
    } finally {
      setSaving(false);
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'saved':
        return <Cloud className="w-4 h-4" />;
      case 'error':
        return <CloudOff className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      case 'pending':
        return 'Unsaved changes';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                to={`/proposals/${id}`}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-gray-700" />
                <h1 className="text-xl font-semibold text-gray-900">Edit Proposal</h1>
              </div>
            </div>

            {/* Auto-save indicator */}
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getSaveStatusIcon()}
                <span>{getSaveStatusText()}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Form Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Overview Section */}
          <Card gradient hover={false}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Project Overview
              </CardTitle>
              <CardDescription>Core information about your Erasmus+ project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="Project Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder="Enter a descriptive title for your project"
                icon={FileText}
              />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Project Idea
                  </label>
                  <Button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription || (!formData.title && !formData.project_idea) || !subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0}
                    variant="outline"
                    size="sm"
                    icon={isGeneratingDescription ? Loader2 : Wand2}
                    className={isGeneratingDescription ? 'animate-pulse' : ''}
                  >
                    {isGeneratingDescription ? 'Generating...' : 'AI Enhance'}
                  </Button>
                </div>
                <Textarea
                  value={formData.project_idea}
                  onChange={(e) => handleInputChange('project_idea', e.target.value)}
                  rows={6}
                  required
                  placeholder="Describe your project idea, objectives, and expected outcomes..."
                />
                {subscriptionStatus && !subscriptionStatus.has_subscription && (
                  <p className="mt-1 text-sm text-orange-600">
                    No AI credits available. <Link to="/pricing" className="underline">Get a subscription</Link> to use AI features.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Duration
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <select
                      value={formData.duration_months}
                      onChange={(e) => handleInputChange('duration_months', parseInt(e.target.value))}
                      className="flex-1 h-11 px-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="12">12 months</option>
                      <option value="18">18 months</option>
                      <option value="24">24 months</option>
                      <option value="30">30 months</option>
                      <option value="36">36 months</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Budget
                  </label>
                  <div className="flex items-center gap-2">
                    <Euro className="w-5 h-5 text-gray-400" />
                    <select
                      value={formData.budget_eur}
                      onChange={(e) => handleInputChange('budget_eur', parseInt(e.target.value))}
                      className="flex-1 h-11 px-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="60000">€60,000 (Small-scale)</option>
                      <option value="120000">€120,000</option>
                      <option value="250000">€250,000</option>
                      <option value="400000">€400,000 (Maximum)</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Organization Section */}
          <Card gradient hover={false}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Lead Organization
              </CardTitle>
              <CardDescription>Your organization will coordinate the project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Organization Name"
                  value={formData.lead_organization.name}
                  onChange={(e) => handleLeadOrgChange('name', e.target.value)}
                  required
                  icon={Building2}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Organization Type
                  </label>
                  <select
                    value={formData.lead_organization.type}
                    onChange={(e) => handleLeadOrgChange('type', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ORGANIZATION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Country"
                  value={formData.lead_organization.country}
                  onChange={(e) => handleLeadOrgChange('country', e.target.value)}
                  required
                  icon={Globe}
                />

                <Input
                  label="City"
                  value={formData.lead_organization.city}
                  onChange={(e) => handleLeadOrgChange('city', e.target.value)}
                  icon={MapPin}
                />
              </div>

              <Textarea
                label="Relevant Experience"
                value={formData.lead_organization.experience}
                onChange={(e) => handleLeadOrgChange('experience', e.target.value)}
                rows={3}
                placeholder="Describe your organization's relevant experience..."
              />
            </CardContent>
          </Card>

          {/* Partner Organizations Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Partner Organizations ({formData.partner_organizations.length})
              </h3>
              <Button
                type="button"
                onClick={addPartner}
                variant="outline"
                size="sm"
                icon={Plus}
              >
                Add Partner
              </Button>
            </div>

            <AnimatePresence>
              {formData.partner_organizations.map((partner, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  layout
                >
                  <Card className="relative">
                    <CardContent className="pt-6">
                      <div className="absolute top-4 right-4">
                        <Button
                          type="button"
                          onClick={() => removePartner(index)}
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          className="text-red-500 hover:text-red-700"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label={`Partner ${index + 1} Name`}
                          value={partner.name}
                          onChange={(e) => handlePartnerChange(index, 'name', e.target.value)}
                          icon={Building2}
                        />

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Organization Type
                          </label>
                          <select
                            value={partner.type}
                            onChange={(e) => handlePartnerChange(index, 'type', e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {ORGANIZATION_TYPES.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <Input
                          label="Country"
                          value={partner.country}
                          onChange={(e) => handlePartnerChange(index, 'country', e.target.value)}
                          icon={Globe}
                        />

                        <Input
                          label="Role in Project"
                          value={partner.role}
                          onChange={(e) => handlePartnerChange(index, 'role', e.target.value)}
                          placeholder="e.g., Training provider, Technical expert"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* EU Priorities Section */}
          <Card gradient hover={false}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Target className="w-5 h-5 mr-2" />
                EU Priorities
              </CardTitle>
              <CardDescription>Select 1-3 EU priorities that align with your project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium">
                        Selected: {formData.selected_priorities.length}/3 priorities
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Choose priorities that best match your project objectives and expected outcomes
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Horizontal Priorities
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PRIORITIES.horizontal.map((priority) => {
                      const Icon = priority.icon;
                      const isSelected = formData.selected_priorities.includes(priority.code);

                      return (
                        <motion.button
                          key={priority.code}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handlePriorityToggle(priority.code)}
                          className={cn(
                            "relative p-4 rounded-xl border-2 transition-all text-left",
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "p-2 rounded-lg bg-gradient-to-r",
                              priority.color
                            )}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{priority.name}</p>
                              <p className="text-sm text-gray-600 mt-1">{priority.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{priority.code}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-blue-500 absolute top-4 right-4" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Adult Education Priorities
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PRIORITIES.sectorSpecific.map((priority) => {
                      const Icon = priority.icon;
                      const isSelected = formData.selected_priorities.includes(priority.code);

                      return (
                        <motion.button
                          key={priority.code}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handlePriorityToggle(priority.code)}
                          className={cn(
                            "relative p-4 rounded-xl border-2 transition-all text-left",
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "p-2 rounded-lg bg-gradient-to-r",
                              priority.color
                            )}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{priority.name}</p>
                              <p className="text-sm text-gray-600 mt-1">{priority.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{priority.code}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-blue-500 absolute top-4 right-4" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Groups Section */}
          <Card gradient hover={false}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Target Groups
              </CardTitle>
              <CardDescription>Who will benefit from your project?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                label="Target Groups"
                value={formData.target_groups}
                onChange={(e) => handleInputChange('target_groups', e.target.value)}
                rows={3}
                placeholder="e.g., Adult learners with fewer opportunities, Educators in vocational training, Policy makers in education sector..."
              />
              <p className="mt-2 text-sm text-gray-500">
                Separate multiple target groups with commas. Be specific about the beneficiaries of your project.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center py-4">
            <Link
              to={`/proposals/${id}`}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            >
              Cancel
            </Link>

            <div className="flex gap-4 items-center">
              {saveStatus !== 'idle' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {getSaveStatusIcon()}
                  <span>{getSaveStatusText()}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={saving}
                icon={saving ? Loader2 : Save}
                variant="primary"
                size="lg"
                className={saving ? 'animate-pulse' : ''}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalEdit;