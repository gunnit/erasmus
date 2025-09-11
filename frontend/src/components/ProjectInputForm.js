import React, { useState } from 'react';
import toast from 'react-hot-toast';

const PRIORITIES = {
  horizontal: [
    { code: 'HP-01', name: 'Inclusion and Diversity', description: 'Social inclusion and outreach' },
    { code: 'HP-02', name: 'Digital Transformation', description: 'Digital readiness and capacity' },
    { code: 'HP-03', name: 'Environment and Climate', description: 'Fight against climate change' },
    { code: 'HP-04', name: 'Democratic Participation', description: 'Civic engagement' }
  ],
  sectorSpecific: [
    { code: 'AE-01', name: 'Key Competences', description: 'High-quality learning for adults' },
    { code: 'AE-02', name: 'Learning Pathways', description: 'Upskilling and transitions' },
    { code: 'AE-03', name: 'Professional Development', description: 'Educator competences' }
  ]
};

const ProjectInputForm = ({ onSubmit, initialData }) => {
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
    }
  };

  const removePartner = (index) => {
    if (formData.partner_organizations.length > 2) {
      const newPartners = formData.partner_organizations.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        partner_organizations: newPartners
      }));
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
        toast.error('Maximum 3 priorities can be selected');
        return prev;
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.project_idea.length < 200) {
      toast.error('Project idea must be at least 200 characters');
      return;
    }
    
    if (formData.selected_priorities.length === 0) {
      toast.error('Please select at least one priority');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Project Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              maxLength={200}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (months)</label>
            <input
              type="number"
              value={formData.duration_months}
              onChange={(e) => handleInputChange('duration_months', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min={12}
              max={36}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Budget (EUR)</label>
            <input
              type="number"
              value={formData.budget_eur}
              onChange={(e) => handleInputChange('budget_eur', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min={60000}
              max={400000}
              step={1000}
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Project Idea</label>
        <textarea
          value={formData.project_idea}
          onChange={(e) => handleInputChange('project_idea', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={6}
          placeholder="Describe your project idea in detail (minimum 200 characters)..."
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.project_idea.length}/200 characters minimum
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Organization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Organization Name"
            value={formData.lead_organization.name}
            onChange={(e) => handleLeadOrgChange('name', e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
          <select
            value={formData.lead_organization.type}
            onChange={(e) => handleLeadOrgChange('type', e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="NGO">NGO</option>
            <option value="University">University</option>
            <option value="SME">SME</option>
            <option value="Public Body">Public Body</option>
            <option value="School">School</option>
            <option value="Training Center">Training Center</option>
          </select>
          <input
            type="text"
            placeholder="Country"
            value={formData.lead_organization.country}
            onChange={(e) => handleLeadOrgChange('country', e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="City"
            value={formData.lead_organization.city}
            onChange={(e) => handleLeadOrgChange('city', e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="Relevant experience"
            value={formData.lead_organization.experience}
            onChange={(e) => handleLeadOrgChange('experience', e.target.value)}
            className="col-span-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={2}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Partner Organizations</h3>
          <button
            type="button"
            onClick={addPartner}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={formData.partner_organizations.length >= 10}
          >
            Add Partner
          </button>
        </div>
        
        {formData.partner_organizations.map((partner, index) => (
          <div key={index} className="mb-4 p-4 border border-gray-200 rounded">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Partner {index + 1}</h4>
              {formData.partner_organizations.length > 2 && (
                <button
                  type="button"
                  onClick={() => removePartner(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Organization Name"
                value={partner.name}
                onChange={(e) => handlePartnerChange(index, 'name', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <select
                value={partner.type}
                onChange={(e) => handlePartnerChange(index, 'type', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="NGO">NGO</option>
                <option value="University">University</option>
                <option value="SME">SME</option>
                <option value="Public Body">Public Body</option>
                <option value="School">School</option>
                <option value="Training Center">Training Center</option>
              </select>
              <input
                type="text"
                placeholder="Country"
                value={partner.country}
                onChange={(e) => handlePartnerChange(index, 'country', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Role in project"
                value={partner.role}
                onChange={(e) => handlePartnerChange(index, 'role', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Priorities (Select 1-3)
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Horizontal Priorities</h4>
            <div className="space-y-2">
              {PRIORITIES.horizontal.map(priority => (
                <label key={priority.code} className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.selected_priorities.includes(priority.code)}
                    onChange={() => handlePriorityToggle(priority.code)}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium">{priority.name}</span>
                    <p className="text-sm text-gray-500">{priority.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Adult Education Priorities</h4>
            <div className="space-y-2">
              {PRIORITIES.sectorSpecific.map(priority => (
                <label key={priority.code} className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.selected_priorities.includes(priority.code)}
                    onChange={() => handlePriorityToggle(priority.code)}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium">{priority.name}</span>
                    <p className="text-sm text-gray-500">{priority.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Target Groups</label>
        <textarea
          value={formData.target_groups}
          onChange={(e) => handleInputChange('target_groups', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
          placeholder="Describe your target groups..."
          required
        />
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Generate Application (€99)
        </button>
      </div>
    </form>
  );
};

export default ProjectInputForm;