import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Target, Users, Globe, Calendar, Euro, Building2, 
  Plus, Trash2, ChevronRight, Info, Sparkles, 
  CheckCircle, AlertCircle, Briefcase, MapPin
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
    { code: 'AE-02', name: 'Learning Pathways', icon: ChevronRight, color: 'from-teal-500 to-blue-500', description: 'Upskilling and transitions' },
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

const ProjectInputForm = ({ onSubmit, initialData }) => {
  const [currentSection, setCurrentSection] = useState(0);
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
      experience: ''
    },
    partner_organizations: [
      { name: '', type: 'NGO', country: '', role: '' },
      { name: '', type: 'NGO', country: '', role: '' }
    ],
    selected_priorities: [],
    target_groups: ''
  });

  const sections = [
    { id: 'basic', title: 'Project Overview', icon: Sparkles },
    { id: 'organizations', title: 'Partnership', icon: Building2 },
    { id: 'priorities', title: 'EU Priorities', icon: Target },
    { id: 'details', title: 'Final Details', icon: CheckCircle }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLeadOrgChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      lead_organization: {
        ...prev.lead_organization,
        [field]: value
      }
    }));
  };

  const handlePartnerChange = (index, field, value) => {
    const newPartners = [...formData.partner_organizations];
    newPartners[index] = {
      ...newPartners[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      partner_organizations: newPartners
    }));
  };

  const addPartner = () => {
    if (formData.partner_organizations.length < 10) {
      setFormData(prev => ({
        ...prev,
        partner_organizations: [
          ...prev.partner_organizations,
          { name: '', type: 'NGO', country: '', role: '' }
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
      if (isSelected) {
        return {
          ...prev,
          selected_priorities: prev.selected_priorities.filter(p => p !== priorityCode)
        };
      } else if (prev.selected_priorities.length < 3) {
        return {
          ...prev,
          selected_priorities: [...prev.selected_priorities, priorityCode]
        };
      } else {
        toast.error('Maximum 3 priorities allowed');
        return prev;
      }
    });
  };

  const validateSection = (sectionIndex) => {
    switch (sectionIndex) {
      case 0:
        return formData.title && formData.project_idea;
      case 1:
        return formData.lead_organization.name && formData.lead_organization.country;
      case 2:
        return formData.selected_priorities.length >= 1;
      case 3:
        return formData.target_groups;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateSection(currentSection)) {
      onSubmit(formData);
    } else {
      toast.error('Please complete all required fields');
    }
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
              placeholder="Enter a compelling project title"
              required
              icon={Sparkles}
              helper="Choose a title that clearly communicates your project's purpose"
            />

            <Textarea
              label="Project Idea"
              value={formData.project_idea}
              onChange={(e) => handleInputChange('project_idea', e.target.value)}
              placeholder="Describe your innovative project idea in detail..."
              rows={8}
              required
              helper="Explain the main concept, objectives, and expected impact (500-1000 words recommended)"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Duration (months)"
                type="number"
                value={formData.duration_months}
                onChange={(e) => handleInputChange('duration_months', parseInt(e.target.value))}
                min="12"
                max="36"
                icon={Calendar}
                helper="Typically 12-36 months"
              />

              <Input
                label="Budget (EUR)"
                type="number"
                value={formData.budget_eur}
                onChange={(e) => handleInputChange('budget_eur', parseInt(e.target.value))}
                min="60000"
                max="400000"
                icon={Euro}
                helper="€60,000 - €400,000"
              />
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
              </CardContent>
            </Card>

            {/* Partner Organizations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Partner Organizations ({formData.partner_organizations.length})
                </h3>
                <Button
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
          </motion.div>
        );

      case 2:
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
                    Select 1-3 EU priorities that align with your project
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Choose priorities that best match your project objectives and expected outcomes
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Horizontal Priorities
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
                  Sector-Specific Priorities (Adult Education)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRIORITIES.sectorSpecific.map((priority) => {
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
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Textarea
              label="Target Groups"
              value={formData.target_groups}
              onChange={(e) => handleInputChange('target_groups', e.target.value)}
              placeholder="Describe your primary and secondary target groups..."
              rows={6}
              required
              helper="Include demographics, needs, and expected number of beneficiaries"
            />

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
                    <p className="font-medium">{formData.partner_organizations.length + 1} organizations</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Selected Priorities</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.selected_priorities.map(code => {
                      const priority = [...PRIORITIES.horizontal, ...PRIORITIES.sectorSpecific]
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
          <Button
            onClick={handleSubmit}
            variant="default"
            size="lg"
            icon={Sparkles}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Generate Application
          </Button>
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
    </div>
  );
};

export default ProjectInputForm;