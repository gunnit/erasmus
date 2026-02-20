import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Target, Users, Globe, Calendar, Euro, Building2,
  Plus, Trash2, ChevronRight, Info, Sparkles,
  CheckCircle, AlertCircle, Briefcase, MapPin, Save, Cloud, CloudOff,
  Loader2, Wand2, Leaf, Vote, TrendingUp, BookOpen,
  GraduationCap, Shield, Heart, Search, Check, Library, X, Filter,
  Hash, FileText, ExternalLink, ClipboardList, BarChart3, Package
} from 'lucide-react';
import api from '../services/api';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { cn } from '../lib/utils';
import { ERASMUS_PRIORITIES_2025, PRIORITY_RULES } from '../config/erasmusPriorities';
import { validateProposalForm } from '../utils/validation';
import styles from './ProjectInputForm.module.css';

// Using priorities from centralized configuration
const PRIORITIES = ERASMUS_PRIORITIES_2025;

const ORGANIZATION_TYPES = [
  { value: 'NGO', label: 'Non-Governmental Organization' },
  { value: 'PUBLIC', label: 'Public Institution' },
  { value: 'PRIVATE', label: 'Private Company' },
  { value: 'EDUCATION', label: 'Educational Institution' },
  { value: 'RESEARCH', label: 'Research Center' },
  { value: 'SOCIAL', label: 'Social Enterprise' }
];

const ProjectInputForm = ({ onSubmit, initialData, onToggleProgressive, useProgressive = true, proposalId, onAutoSave }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const saveTimeoutRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [partnerSuggestions, setPartnerSuggestions] = useState([]);
  const [searchingPartners, setSearchingPartners] = useState(false);
  const [activePartnerSearch, setActivePartnerSearch] = useState(null);
  const [showPartnerLibraryModal, setShowPartnerLibraryModal] = useState(false);
  const [libraryPartners, setLibraryPartners] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [selectedLibraryPartners, setSelectedLibraryPartners] = useState([]);
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [libraryFilterType, setLibraryFilterType] = useState('');
  const [libraryFilterCountry, setLibraryFilterCountry] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState(initialData || {
    title: '',
    project_idea: '',
    duration_months: 24,
    budget_eur: 250000,
    lead_organization: {
      name: '',
      type: 'NGO',
      country: '',
      city: '',
      experience: '',
      pic_oid: '',
      previous_eu_projects: '',
      annual_budget: '',
      staff_count: '',
      website: ''
    },
    expected_partners: 2,
    partner_types_description: '',
    partner_organizations: [],  // Kept for backward compatibility, populated later if needed
    selected_priorities: [],
    target_groups: '',
    // Enhanced target groups
    primary_target_group: '',
    primary_target_count: '',
    secondary_target_group: '',
    secondary_target_count: '',
    // Evidence & Data section
    existing_research: '',
    previous_project_results: '',
    target_group_data: '',
    planned_deliverables: '',
    // Priority additions
    platform_usage: [],
    open_licence: false
  });

  const sections = [
    { id: 'basic', title: 'Project Overview', icon: Sparkles },
    { id: 'organizations', title: 'Partnership', icon: Building2 },
    { id: 'evidence', title: 'Evidence & Data', icon: ClipboardList },
    { id: 'priorities', title: 'EU Priorities', icon: Target },
    { id: 'details', title: 'Final Details', icon: CheckCircle }
  ];

  // Fetch subscription status on mount
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await api.get('/payments/subscription-status');
        setSubscriptionStatus(response.data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setSubscriptionStatus(null);
      }
    };
    fetchSubscriptionStatus();
  }, []);

  // Cleanup save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Trigger auto-save with debounce
    if (onAutoSave && proposalId) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      setSaveStatus('pending');
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave({ ...formData, [field]: value });
      }, 1500); // Save after 1.5 seconds of inactivity
    }
  };

  const handleAutoSave = async (data) => {
    if (!proposalId || !onAutoSave) return;

    try {
      setSaveStatus('saving');
      await onAutoSave(proposalId, data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
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

    // Trigger auto-save
    if (onAutoSave && proposalId) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaveStatus('pending');
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(newData);
      }, 1500);
    }
  };

  const handlePartnerChange = async (index, field, value) => {
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

    // Search for partner suggestions when typing name
    if (field === 'name' && value.length > 2) {
      setActivePartnerSearch(index);
      setSearchingPartners(true);
      try {
        const response = await api.get('/partners/search', {
          params: {
            q: value,
            limit: 5,
            country: newPartners[index].country || undefined
          }
        });
        setPartnerSuggestions(response.data);
      } catch (error) {
        console.error('Failed to search partners:', error);
        setPartnerSuggestions([]);
      } finally {
        setSearchingPartners(false);
      }
    } else if (field === 'name' && value.length <= 2) {
      setPartnerSuggestions([]);
      setActivePartnerSearch(null);
    }

    // Trigger auto-save
    if (onAutoSave && proposalId) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaveStatus('pending');
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(newData);
      }, 1500);
    }
  };

  const selectPartnerFromLibrary = (index, partner) => {
    const newPartners = [...formData.partner_organizations];
    newPartners[index] = {
      name: partner.name,
      type: partner.type.replace('_', ''),
      country: partner.country || '',
      role: partner.description || '',
      library_id: partner.id,  // Track the library partner ID
      previous_eu_projects: '',
      is_newcomer: false,
      specific_role: '',
      website: partner.website || ''
    };
    const newData = {
      ...formData,
      partner_organizations: newPartners
    };
    setFormData(newData);
    setPartnerSuggestions([]);
    setActivePartnerSearch(null);
    toast.success(`Selected ${partner.name} from partner library`);
  };

  const addPartner = () => {
    if (formData.partner_organizations.length < 10) {
      setFormData(prev => ({
        ...prev,
        partner_organizations: [
          ...prev.partner_organizations,
          { name: '', type: 'NGO', country: '', role: '', previous_eu_projects: '', is_newcomer: false, specific_role: '', website: '' }
        ]
      }));
      toast.success('Partner added');
    } else {
      toast.error('Maximum 10 partners allowed');
    }
  };

  const removePartner = (index) => {
    if (formData.partner_organizations.length > 2) {
      const newPartners = formData.partner_organizations.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        partner_organizations: newPartners
      }));
      toast.success('Partner removed');
    } else {
      toast.error('Minimum 2 partners required');
    }
  };

  const handlePriorityToggle = (priorityCode) => {
    setFormData(prev => {
      const isSelected = prev.selected_priorities.includes(priorityCode);
      let newData;
      if (isSelected) {
        newData = {
          ...prev,
          selected_priorities: prev.selected_priorities.filter(p => p !== priorityCode)
        };
      } else if (prev.selected_priorities.length < 3) {
        newData = {
          ...prev,
          selected_priorities: [...prev.selected_priorities, priorityCode]
        };
      } else {
        toast.error('Maximum 3 priorities allowed');
        return prev;
      }

      // Trigger auto-save
      if (onAutoSave && proposalId && newData !== prev) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaveStatus('pending');
        saveTimeoutRef.current = setTimeout(() => {
          handleAutoSave(newData);
        }, 1500);
      }

      return newData;
    });
  };

  const validateSection = (sectionIndex) => {
    const validation = validateProposalForm(formData);
    setValidationErrors(validation.errors);

    switch (sectionIndex) {
      case 0: // Basic info
        const basicErrors = ['title', 'project_idea', 'duration_months', 'budget_eur'];
        const hasBasicErrors = basicErrors.some(key => validation.errors[key]);
        if (hasBasicErrors) {
          const errorMessages = basicErrors
            .filter(key => validation.errors[key])
            .map(key => validation.errors[key]);
          toast.error(errorMessages[0] || 'Please fill in all required fields');
          return false;
        }
        return true;
      case 1: // Organizations
        const orgErrors = Object.keys(validation.errors).filter(key =>
          key.includes('organization') || key.includes('partner')
        );
        if (orgErrors.length > 0) {
          toast.error(validation.errors[orgErrors[0]] || 'Please complete organization details');
          return false;
        }
        return true;
      case 2: // Evidence & Data - all optional, always passes
        return true;
      case 3: // Priorities
        if (validation.errors.selected_priorities) {
          toast.error(validation.errors.selected_priorities);
          return false;
        }
        return true;
      case 4: // Final details
        if (validation.errors.target_groups) {
          toast.error(validation.errors.target_groups);
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNextSection = () => {
    if (validateSection(currentSection)) {
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1);
      }
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title && !formData.project_idea) {
      toast.error('Please enter a project title or some initial description');
      return;
    }

    // Check subscription status first
    if (!subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0) {
      toast.error('No AI generation credits available. Please upgrade your plan.');
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await api.generateProjectDescription(
        formData.title || '',
        formData.project_idea || ''
      );
      if (response.success && response.description) {
        handleInputChange('project_idea', response.description);
        toast.success('Project description generated successfully!');
      } else {
        toast.error('Failed to generate description');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description. Please try again.');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateSection(currentSection)) {
      onSubmit(formData);
    } else {
      toast.error('Please complete all required fields');
    }
  };

  // Partner Library Modal Functions
  const fetchLibraryPartners = async () => {
    setLoadingLibrary(true);
    try {
      const params = {
        per_page: 50,
        ...(librarySearchQuery && { search: librarySearchQuery }),
        ...(libraryFilterType && { partner_type: libraryFilterType }),
        ...(libraryFilterCountry && { country: libraryFilterCountry })
      };

      const response = await api.get('/partners/', { params });
      setLibraryPartners(response.data.partners || []);
    } catch (error) {
      console.error('Failed to fetch library partners:', error);
      toast.error('Failed to load partner library');
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    if (showPartnerLibraryModal) {
      fetchLibraryPartners();
    }
  }, [showPartnerLibraryModal, librarySearchQuery, libraryFilterType, libraryFilterCountry]);

  const togglePartnerSelection = (partner) => {
    setSelectedLibraryPartners(prev => {
      const isSelected = prev.some(p => p.id === partner.id);
      if (isSelected) {
        return prev.filter(p => p.id !== partner.id);
      } else {
        return [...prev, partner];
      }
    });
  };

  const addSelectedPartnersToForm = () => {
    const newPartners = selectedLibraryPartners.map(partner => ({
      name: partner.name,
      type: partner.type.replace('_', ''),
      country: partner.country || '',
      role: partner.description || '',
      library_id: partner.id,
      previous_eu_projects: '',
      is_newcomer: false,
      specific_role: '',
      website: partner.website || ''
    }));

    const currentCount = formData.partner_organizations.length;
    const availableSlots = 10 - currentCount;
    const partnersToAdd = newPartners.slice(0, availableSlots);

    if (partnersToAdd.length > 0) {
      setFormData(prev => ({
        ...prev,
        partner_organizations: [...prev.partner_organizations, ...partnersToAdd]
      }));
      toast.success(`Added ${partnersToAdd.length} partner(s)`);

      if (partnersToAdd.length < newPartners.length) {
        toast.warning(`Only added ${partnersToAdd.length} partners (max 10 allowed)`);
      }
    }

    setShowPartnerLibraryModal(false);
    setSelectedLibraryPartners([]);
  };

  const renderSectionContent = () => {
    switch (currentSection) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Input
              label="Project Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Write a concise, descriptive title for your project"
              required
              icon={Sparkles}
              helper="A clear, memorable title that communicates your project's purpose"
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Project Idea / Description <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDescription || (!formData.title && !formData.project_idea) || !subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0}
                  className="flex items-center gap-2"
                  title={!subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0 ? 'No AI generation credits available' : ''}
                >
                  {isGeneratingDescription ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : !subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0 ? (
                    <>
                      <Wand2 className="w-4 h-4" />
                      No Credits
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      AI Generate
                    </>
                  )}
                </Button>
              </div>

              {/* Guidance box */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800 space-y-1">
                    <p className="font-medium">Tips for a better AI-generated application:</p>
                    <ul className="list-disc ml-4 space-y-0.5">
                      <li>Describe your project in detail: target groups, geographic context, specific challenges, expected outcomes</li>
                      <li>The more detail you provide, the better the AI-generated answers will be</li>
                      <li>Include specific partner expertise areas and their countries for better results</li>
                    </ul>
                  </div>
                </div>
              </div>

              <textarea
                value={formData.project_idea}
                onChange={(e) => handleInputChange('project_idea', e.target.value)}
                placeholder="Describe your innovative project idea in detail... Or enter a title above and click 'AI Generate' for assistance."
                rows={8}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              {(() => {
                const wordCount = formData.project_idea ? formData.project_idea.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
                const isLow = wordCount > 0 && wordCount < 50;
                const isInRange = wordCount >= 500 && wordCount <= 1000;
                return (
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm",
                      isLow ? "text-amber-600 font-medium" : isInRange ? "text-green-600" : "text-gray-500"
                    )}>
                      {wordCount} words {isInRange ? "(good length)" : "(500-1000 recommended)"}
                    </p>
                    {isLow && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Add more detail for better AI results
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Duration (months)
                </label>
                <select
                  value={formData.duration_months}
                  onChange={(e) => handleInputChange('duration_months', parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {[...Array(25)].map((_, i) => {
                    const months = i + 12;
                    return <option key={months} value={months}>{months} months</option>;
                  })}
                </select>
                <p className="text-sm text-gray-500">Select project duration (12-36 months)</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Euro className="h-4 w-4 text-gray-500" />
                  Budget (EUR)
                </label>
                <select
                  value={formData.budget_eur}
                  onChange={(e) => handleInputChange('budget_eur', parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value={120000}>€120,000</option>
                  <option value={250000}>€250,000</option>
                  <option value={400000}>€400,000</option>
                </select>
                <p className="text-sm text-gray-500">Choose one of the three available budget levels</p>
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Lead Organization */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="PIC/OID Number (if known)"
                    value={formData.lead_organization.pic_oid || ''}
                    onChange={(e) => handleLeadOrgChange('pic_oid', e.target.value)}
                    placeholder="e.g., 999999999"
                    icon={Hash}
                    helper="Your organization's Participant Identification Code"
                  />

                  <Input
                    label="Organization Website"
                    value={formData.lead_organization.website || ''}
                    onChange={(e) => handleLeadOrgChange('website', e.target.value)}
                    placeholder="https://www.example.org"
                    icon={ExternalLink}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Annual Budget (approximate)"
                    type="number"
                    value={formData.lead_organization.annual_budget || ''}
                    onChange={(e) => handleLeadOrgChange('annual_budget', e.target.value)}
                    placeholder="e.g., 500000"
                    icon={Euro}
                    helper="Helps demonstrate organizational capacity"
                  />

                  <Input
                    label="Number of Staff"
                    type="number"
                    value={formData.lead_organization.staff_count || ''}
                    onChange={(e) => handleLeadOrgChange('staff_count', e.target.value)}
                    placeholder="e.g., 25"
                    icon={Users}
                    helper="Full-time equivalent staff count"
                  />
                </div>

                <Textarea
                  label="Previous EU/Erasmus+ Projects"
                  value={formData.lead_organization.previous_eu_projects || ''}
                  onChange={(e) => handleLeadOrgChange('previous_eu_projects', e.target.value)}
                  rows={3}
                  placeholder="List previous projects: name, year, reference number (e.g., 2023-1-IT02-KA220-ADU-000123456)"
                  helper="Demonstrates track record - include project name, year, and reference number if available"
                />
              </CardContent>
            </Card>

            {/* Partnership Planning (Simplified) */}
            <Card gradient hover={false}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Partnership Planning
                </CardTitle>
                <CardDescription>Tell us about your partnership plans (you can add specific partners later)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    How many partner organizations do you plan to involve?
                  </label>
                  <select
                    value={formData.expected_partners || 2}
                    onChange={(e) => handleInputChange('expected_partners', parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value={2}>2 partners</option>
                    <option value={3}>3 partners</option>
                    <option value={4}>4 partners</option>
                    <option value={5}>5 partners</option>
                    <option value={6}>6 partners</option>
                    <option value={7}>7+ partners</option>
                  </select>
                  <p className="text-sm text-gray-500">This is just an estimate - you can modify it during proposal development</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    What types of partners are you considering?
                  </label>
                  <textarea
                    value={formData.partner_types_description || ''}
                    onChange={(e) => handleInputChange('partner_types_description', e.target.value)}
                    placeholder="e.g., Universities, Adult education centers, NGOs working with migrants, VET providers..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-sm text-gray-500">
                    Briefly describe the types of organizations you want to partner with and their potential expertise
                  </p>
                </div>

                {/* Structured partner country/expertise fields */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    Partner Countries
                  </label>
                  <input
                    type="text"
                    value={formData.partner_countries || ''}
                    onChange={(e) => handleInputChange('partner_countries', e.target.value)}
                    placeholder="e.g., Italy, Germany, Spain, Greece"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-sm text-gray-500">
                    List the countries where you expect partners to be based (comma-separated)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    Partner Expertise Areas
                  </label>
                  <input
                    type="text"
                    value={formData.partner_expertise_areas || ''}
                    onChange={(e) => handleInputChange('partner_expertise_areas', e.target.value)}
                    placeholder="e.g., Digital literacy, Adult education, Migration support, Environmental training"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-sm text-gray-500">
                    Key expertise areas your partners should bring to the project (comma-separated)
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">Partner details can be added later</p>
                      <p className="text-blue-700">
                        You'll be able to search for and add specific partner organizations from your library
                        during the proposal development process. This initial information helps generate better content.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPartnerLibraryModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all font-medium"
                >
                  <Library className="w-5 h-5" />
                  Browse Partner Library
                </button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 2: // Evidence & Data
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-900 font-medium">
                    Strengthen your application with evidence
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    All fields are optional, but providing real data and sources significantly improves AI-generated content quality and evaluation scores.
                  </p>
                </div>
              </div>
            </div>

            <Textarea
              label="Existing Research / Data Supporting the Need"
              value={formData.existing_research || ''}
              onChange={(e) => handleInputChange('existing_research', e.target.value)}
              rows={4}
              placeholder="e.g., According to Eurostat (2024), 42% of adults in the EU lack basic digital skills. The OECD PIAAC survey shows..."
              helper="Cite real reports, statistics, or studies that justify your project's need. This prevents the AI from fabricating data."
            />

            <Textarea
              label="Results from Your Previous Relevant Projects"
              value={formData.previous_project_results || ''}
              onChange={(e) => handleInputChange('previous_project_results', e.target.value)}
              rows={4}
              placeholder="e.g., In our 2023 project 'DigiAdult' (2021-1-IT02-KA220-ADU-000035412), we trained 200 adult learners and achieved a 78% completion rate..."
              helper="Include measurable outcomes from past projects. Evaluators value demonstrated track record."
            />

            <Textarea
              label="Specific Data About Your Target Groups"
              value={formData.target_group_data || ''}
              onChange={(e) => handleInputChange('target_group_data', e.target.value)}
              rows={4}
              placeholder="e.g., 500 low-skilled adults aged 25-64 in the Puglia region; 60% female; 30% migrants; unemployment rate in target area is 18.2% (ISTAT 2024)"
              helper="Provide numbers, demographics, geographic scope, and data sources for your target groups."
            />

            <Textarea
              label="Planned Concrete Outputs / Deliverables"
              value={formData.planned_deliverables || ''}
              onChange={(e) => handleInputChange('planned_deliverables', e.target.value)}
              rows={4}
              placeholder="e.g., 1) Online learning platform with 12 modules, 2) Toolkit for educators (PDF + interactive), 3) Policy recommendation report, 4) Training curriculum for 3 target languages"
              helper="List the tangible outputs your project will produce (toolkits, curricula, platforms, reports, etc.)."
            />
          </motion.div>
        );

      case 3: // EU Priorities
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">
                    {PRIORITY_RULES.requirementText}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Selected: {formData.selected_priorities.length}/{PRIORITY_RULES.maxSelection} priorities
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {PRIORITY_RULES.evaluationNote}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mr-2">4 priorities</span>
                  Horizontal Priorities (Apply to All Sectors)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRIORITIES.horizontal.map((priority) => {
                    const Icon = priority.icon;
                    const isSelected = formData.selected_priorities.includes(priority.code);

                    return (
                      <motion.button
                        key={priority.code}
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
                            <h4 className="font-medium text-gray-900">{priority.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{priority.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{priority.code}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full mr-2">8 priorities</span>
                  Adult Education Sector-Specific Priorities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRIORITIES.adultEducation.map((priority) => {
                    const Icon = priority.icon;
                    const isSelected = formData.selected_priorities.includes(priority.code);

                    return (
                      <motion.button
                        key={priority.code}
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
                            <h4 className="font-medium text-gray-900">{priority.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{priority.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{priority.code}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Selected: {formData.selected_priorities.length} / 3 priorities
                </p>
                <div className="flex space-x-2 mt-2 justify-center">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        i <= formData.selected_priorities.length
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* EU Platform Usage */}
            <Card gradient hover={false}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  EU Platform Dissemination
                </CardTitle>
                <CardDescription>Select platforms you plan to use for dissemination (improves scoring)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { value: 'EPALE', label: 'EPALE', description: 'Electronic Platform for Adult Learning in Europe' },
                    { value: 'eTwinning', label: 'eTwinning', description: 'Community for schools and educators in Europe' },
                    { value: 'European Youth Portal', label: 'European Youth Portal', description: 'EU platform for young people' }
                  ].map((platform) => (
                    <label
                      key={platform.value}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                        (formData.platform_usage || []).includes(platform.value)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={(formData.platform_usage || []).includes(platform.value)}
                        onChange={(e) => {
                          const current = formData.platform_usage || [];
                          if (e.target.checked) {
                            handleInputChange('platform_usage', [...current, platform.value]);
                          } else {
                            handleInputChange('platform_usage', current.filter(p => p !== platform.value));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{platform.label}</p>
                        <p className="text-xs text-gray-500">{platform.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <label
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                    formData.open_licence
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formData.open_licence || false}
                    onChange={(e) => handleInputChange('open_licence', e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 mt-0.5"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Commit to Open Licence (Creative Commons)</p>
                    <p className="text-xs text-gray-500">Publishing results under open licence is valued by evaluators and supports wider dissemination</p>
                  </div>
                </label>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 4: // Final Details
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Structured Target Groups */}
            <Card gradient hover={false}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Target Groups
                </CardTitle>
                <CardDescription>Define your primary and secondary beneficiaries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  label="Target Groups Description"
                  value={formData.target_groups}
                  onChange={(e) => handleInputChange('target_groups', e.target.value)}
                  placeholder="Describe your primary and secondary target groups in detail..."
                  rows={4}
                  required
                  helper="Include demographics, needs, geographic scope, and how you will reach them"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Primary Target Group"
                    value={formData.primary_target_group || ''}
                    onChange={(e) => handleInputChange('primary_target_group', e.target.value)}
                    placeholder="e.g., Low-skilled adults aged 25-64"
                    icon={Target}
                    helper="Main direct beneficiaries of the project"
                  />
                  <Input
                    label="Estimated Direct Beneficiaries"
                    type="number"
                    value={formData.primary_target_count || ''}
                    onChange={(e) => handleInputChange('primary_target_count', e.target.value)}
                    placeholder="e.g., 500"
                    icon={BarChart3}
                    helper="Number of people directly reached"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Secondary Target Group"
                    value={formData.secondary_target_group || ''}
                    onChange={(e) => handleInputChange('secondary_target_group', e.target.value)}
                    placeholder="e.g., Educators, trainers, policy makers"
                    icon={Target}
                    helper="Indirect beneficiaries or multipliers"
                  />
                  <Input
                    label="Estimated Indirect Beneficiaries"
                    type="number"
                    value={formData.secondary_target_count || ''}
                    onChange={(e) => handleInputChange('secondary_target_count', e.target.value)}
                    placeholder="e.g., 2000"
                    icon={BarChart3}
                    helper="Number of people indirectly reached"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl">Project Summary</CardTitle>
                <CardDescription>Review your project details before submission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Title</p>
                    <p className="font-medium">{formData.title || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-medium">{formData.duration_months} months</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Budget</p>
                    <p className="font-medium">€{formData.budget_eur.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Partners</p>
                    <p className="font-medium">{(formData.expected_partners || 2) + 1} organizations (estimated)</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Selected Priorities</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.selected_priorities.map(code => {
                      const priority = [...PRIORITIES.horizontal, ...PRIORITIES.adultEducation]
                        .find(p => p.code === code);
                      return priority ? (
                        <span
                          key={code}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {priority.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {formData.planned_deliverables && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Planned Deliverables</p>
                    <p className="text-sm text-gray-800">{formData.planned_deliverables.substring(0, 150)}{formData.planned_deliverables.length > 150 ? '...' : ''}</p>
                  </div>
                )}

                {(formData.platform_usage || []).length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">EU Platforms</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.platform_usage.map(platform => (
                        <span
                          key={platform}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-900 font-medium">
                  Ready to generate your application!
                </p>
              </div>
              <p className="text-xs text-green-700 mt-2 ml-7">
                Our AI will create comprehensive, evaluation-optimized answers for all 27 questions
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      {/* Save Status Indicator */}
      {proposalId && (
        <div className="fixed top-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg shadow-md",
              saveStatus === 'idle' && "bg-gray-100 text-gray-600",
              saveStatus === 'pending' && "bg-yellow-100 text-yellow-700",
              saveStatus === 'saving' && "bg-blue-100 text-blue-700",
              saveStatus === 'saved' && "bg-green-100 text-green-700",
              saveStatus === 'error' && "bg-red-100 text-red-700"
            )}
          >
            {saveStatus === 'idle' && <Cloud className="w-4 h-4" />}
            {saveStatus === 'pending' && <Cloud className="w-4 h-4 animate-pulse" />}
            {saveStatus === 'saving' && <Save className="w-4 h-4 animate-spin" />}
            {saveStatus === 'saved' && <CheckCircle className="w-4 h-4" />}
            {saveStatus === 'error' && <CloudOff className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {saveStatus === 'idle' && 'Draft saved'}
              {saveStatus === 'pending' && 'Changes pending...'}
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'error' && 'Save failed'}
            </span>
          </motion.div>
        </div>
      )}

      {/* Section Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = currentSection === index;
            const isCompleted = currentSection > index;
            
            return (
              <React.Fragment key={section.id}>
                <motion.div
                  className="flex flex-col items-center"
                  animate={{ scale: isActive ? 1.1 : 1 }}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
                      : isCompleted
                      ? "bg-green-500"
                      : "bg-gray-200"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6",
                      isActive || isCompleted ? "text-white" : "text-gray-500"
                    )} />
                  </div>
                  <p className={cn(
                    "mt-2 text-xs font-medium",
                    isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                  )}>
                    {section.title}
                  </p>
                </motion.div>
                
                {index < sections.length - 1 && (
                  <div className="flex-1 h-1 bg-gray-200 mx-2">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {renderSectionContent()}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          onClick={handlePreviousSection}
          variant="outline"
          disabled={currentSection === 0}
        >
          Previous
        </Button>
        
        {currentSection === sections.length - 1 ? (
          <div className="flex items-center space-x-4">
            {onToggleProgressive && (
              <div className="flex items-center space-x-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useProgressive}
                    onChange={(e) => onToggleProgressive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Progressive Generation</span>
                </label>
              </div>
            )}
            <Button
              onClick={handleSubmit}
              variant="default"
              size="lg"
              icon={Sparkles}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Generate Full Application with AI
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleNextSection}
            variant="default"
            icon={ChevronRight}
            iconPosition="right"
          >
            Next
          </Button>
        )}
      </div>

      {/* Partner Library Modal */}
      {showPartnerLibraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Library className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Partner Library</h2>
                  {selectedLibraryPartners.length > 0 && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {selectedLibraryPartners.length} selected
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowPartnerLibraryModal(false);
                    setSelectedLibraryPartners([]);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search partners..."
                    value={librarySearchQuery}
                    onChange={(e) => setLibrarySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={libraryFilterType}
                  onChange={(e) => setLibraryFilterType(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {ORGANIZATION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Filter by country..."
                  value={libraryFilterCountry}
                  onChange={(e) => setLibraryFilterCountry(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Partner List */}
            <div className={`p-6 overflow-y-auto ${styles.partnerLibraryList}`}>
              {loadingLibrary ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : libraryPartners.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No partners found in your library</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {libraryPartners.map((partner) => {
                    const isSelected = selectedLibraryPartners.some(p => p.id === partner.id);
                    const isAlreadyInForm = formData.partner_organizations.some(
                      p => p.library_id === partner.id
                    );

                    return (
                      <div
                        key={partner.id}
                        onClick={() => !isAlreadyInForm && togglePartnerSelection(partner)}
                        className={cn(
                          "p-4 rounded-lg border-2 transition cursor-pointer",
                          isAlreadyInForm
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                            : isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {partner.type.replace('_', ' ')} • {partner.country}
                            </p>
                            {partner.description && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                {partner.description}
                              </p>
                            )}
                            {partner.affinity_score && (
                              <div className="mt-2">
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  Affinity: {partner.affinity_score}%
                                </span>
                              </div>
                            )}
                            {isAlreadyInForm && (
                              <p className="text-xs text-gray-400 mt-2">Already in proposal</p>
                            )}
                          </div>
                          {!isAlreadyInForm && (
                            <div className={cn(
                              "w-5 h-5 rounded border-2 ml-3 flex-shrink-0",
                              isSelected
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300"
                            )}>
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedLibraryPartners.length > 0
                  ? `${selectedLibraryPartners.length} partner(s) selected`
                  : "Select partners to add to your proposal"}
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowPartnerLibraryModal(false);
                    setSelectedLibraryPartners([]);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addSelectedPartnersToForm}
                  variant="default"
                  disabled={selectedLibraryPartners.length === 0}
                  icon={Plus}
                >
                  Add {selectedLibraryPartners.length || ''} Partner{selectedLibraryPartners.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectInputForm;