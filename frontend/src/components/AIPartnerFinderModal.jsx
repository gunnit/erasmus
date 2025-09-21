import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Search, Globe, Building2, Users, Target,
  ChevronRight, Loader2, Check, AlertCircle, MapPin,
  BookOpen, Plus, FileText, Star, Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

const PARTNER_TYPES = [
  { value: 'NGO', label: 'NGO', icon: Users },
  { value: 'PUBLIC_INSTITUTION', label: 'Public Institution', icon: Building2 },
  { value: 'PRIVATE_COMPANY', label: 'Private Company', icon: Building2 },
  { value: 'EDUCATIONAL_INSTITUTION', label: 'Educational Institution', icon: BookOpen },
  { value: 'RESEARCH_CENTER', label: 'Research Center', icon: Target },
  { value: 'SOCIAL_ENTERPRISE', label: 'Social Enterprise', icon: Users }
];

const EU_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
  'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
  'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia',
  'Slovenia', 'Spain', 'Sweden', 'Norway', 'Iceland', 'Liechtenstein',
  'North Macedonia', 'Serbia', 'Turkey'
];

export const AIPartnerFinderModal = ({ isOpen, onClose, onPartnersSaved, userId }) => {
  const [searchMode, setSearchMode] = useState('criteria'); // 'criteria' or 'proposal'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Criteria search state
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [expertiseAreas, setExpertiseAreas] = useState([]);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [customRequirements, setCustomRequirements] = useState('');
  const [numPartners, setNumPartners] = useState(5);

  // Proposal search state
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Results state
  const [suggestedPartners, setSuggestedPartners] = useState([]);
  const [selectedPartners, setSelectedPartners] = useState(new Set());
  const [savingPartners, setSavingPartners] = useState(false);

  // Gap analysis state
  const [gapAnalysis, setGapAnalysis] = useState(null);

  useEffect(() => {
    if (isOpen && searchMode === 'proposal') {
      fetchUserProposals();
    }
  }, [isOpen, searchMode]);

  const fetchUserProposals = async () => {
    setLoadingProposals(true);
    try {
      const response = await api.get('/proposals/');
      setProposals(response.data);
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
      setError('Failed to load proposals');
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleAddExpertise = () => {
    if (expertiseInput.trim() && !expertiseAreas.includes(expertiseInput.trim())) {
      setExpertiseAreas([...expertiseAreas, expertiseInput.trim()]);
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (area) => {
    setExpertiseAreas(expertiseAreas.filter(a => a !== area));
  };

  const handleToggleType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleToggleCountry = (country) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter(c => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSuggestedPartners([]);
    setSelectedPartners(new Set());

    try {
      let requestData;

      if (searchMode === 'criteria') {
        requestData = {
          search_mode: 'criteria',
          criteria: {
            partner_types: selectedTypes.length > 0 ? selectedTypes : null,
            countries: selectedCountries.length > 0 ? selectedCountries : null,
            expertise_areas: expertiseAreas.length > 0 ? expertiseAreas : null,
            custom_requirements: customRequirements || null,
            project_field: 'Adult Education'
          },
          num_partners: numPartners
        };
      } else {
        if (!selectedProposal) {
          setError('Please select a proposal');
          setLoading(false);
          return;
        }
        requestData = {
          search_mode: 'proposal',
          proposal_id: selectedProposal.id,
          num_partners: numPartners
        };

        // Also fetch gap analysis
        try {
          const gapResponse = await api.post(`/partners/analyze-gaps`, null, {
            params: { proposal_id: selectedProposal.id }
          });
          setGapAnalysis(gapResponse.data.analysis);
        } catch (err) {
          console.log('Gap analysis not available');
        }
      }

      const response = await api.post('/partners/ai-find', requestData);

      if (response.data.success && response.data.partners) {
        setSuggestedPartners(response.data.partners);
      } else {
        setError('No partners found matching your criteria');
      }
    } catch (error) {
      console.error('Partner search error:', error);
      setError(error.response?.data?.detail || 'Failed to find partners. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePartner = (partnerId) => {
    const newSelected = new Set(selectedPartners);
    if (newSelected.has(partnerId)) {
      newSelected.delete(partnerId);
    } else {
      newSelected.add(partnerId);
    }
    setSelectedPartners(newSelected);
  };

  const handleSaveSelected = async () => {
    if (selectedPartners.size === 0) {
      setError('Please select at least one partner to save');
      return;
    }

    setSavingPartners(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const partnersToSave = suggestedPartners
        .filter(p => selectedPartners.has(p.temp_id))
        .map(p => {
          const { temp_id, is_ai_generated, matched_for_proposal, proposal_title, ...partnerData } = p;
          return partnerData;
        });

      const response = await api.post('/partners/save-suggestions', {
        partners: partnersToSave
      });

      if (response.data.success) {
        const savedCount = response.data.saved_count;
        const skippedCount = response.data.skipped_count;

        let message = `Successfully saved ${savedCount} partner${savedCount !== 1 ? 's' : ''}`;
        if (skippedCount > 0) {
          message += ` (${skippedCount} skipped - already exists)`;
        }

        setSuccessMessage(message);

        // Clear selections
        setSelectedPartners(new Set());
        setSuggestedPartners([]);

        // Notify parent component
        if (onPartnersSaved) {
          onPartnersSaved(response.data.saved_partners);
        }

        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Save partners error:', error);
      setError(error.response?.data?.detail || 'Failed to save partners');
    } finally {
      setSavingPartners(false);
    }
  };

  const handleReset = () => {
    setSelectedTypes([]);
    setSelectedCountries([]);
    setExpertiseAreas([]);
    setCustomRequirements('');
    setSelectedProposal(null);
    setSuggestedPartners([]);
    setSelectedPartners(new Set());
    setError(null);
    setSuccessMessage(null);
    setGapAnalysis(null);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI Partner Finder</h2>
                <p className="text-blue-100 text-sm">Discover perfect partners for your Erasmus+ project</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setSearchMode('criteria')}
              className={cn(
                "flex-1 px-6 py-3 font-medium transition-colors relative",
                searchMode === 'criteria'
                  ? "text-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                Search by Criteria
              </span>
              {searchMode === 'criteria' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setSearchMode('proposal')}
              className={cn(
                "flex-1 px-6 py-3 font-medium transition-colors relative",
                searchMode === 'proposal'
                  ? "text-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Match to Proposal
              </span>
              {searchMode === 'proposal' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Form */}
          {!loading && suggestedPartners.length === 0 && (
            <div className="space-y-6">
              {searchMode === 'criteria' ? (
                <>
                  {/* Partner Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Partner Types (select any)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {PARTNER_TYPES.map(type => {
                        const Icon = type.icon;
                        const isSelected = selectedTypes.includes(type.value);
                        return (
                          <button
                            key={type.value}
                            onClick={() => handleToggleType(type.value)}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all flex items-center gap-2",
                              isSelected
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{type.label}</span>
                            {isSelected && <Check className="w-4 h-4 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Countries */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Countries (optional)
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-lg">
                      {EU_COUNTRIES.map(country => {
                        const isSelected = selectedCountries.includes(country);
                        return (
                          <button
                            key={country}
                            onClick={() => handleToggleCountry(country)}
                            className={cn(
                              "px-3 py-1 rounded-full text-sm transition-all",
                              isSelected
                                ? "bg-blue-500 text-white"
                                : "bg-white border border-gray-300 hover:border-blue-400"
                            )}
                          >
                            {country}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expertise Areas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Required Expertise Areas
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={expertiseInput}
                        onChange={(e) => setExpertiseInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())}
                        placeholder="Add expertise area..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddExpertise}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {expertiseAreas.map(area => (
                        <span
                          key={area}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
                        >
                          {area}
                          <button
                            onClick={() => handleRemoveExpertise(area)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Custom Requirements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Requirements (optional)
                    </label>
                    <textarea
                      value={customRequirements}
                      onChange={(e) => setCustomRequirements(e.target.value)}
                      placeholder="Describe any specific requirements for partners..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Proposal Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select a Proposal
                    </label>
                    {loadingProposals ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      </div>
                    ) : proposals.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">No proposals found. Create a proposal first.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {proposals.map(proposal => (
                          <button
                            key={proposal.id}
                            onClick={() => setSelectedProposal(proposal)}
                            className={cn(
                              "w-full text-left p-4 rounded-lg border-2 transition-all",
                              selectedProposal?.id === proposal.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {proposal.project_idea}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>{proposal.duration_months} months</span>
                                  <span>{proposal.budget}</span>
                                  <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              {selectedProposal?.id === proposal.id && (
                                <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gap Analysis Preview */}
                  {gapAnalysis && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Partnership Gap Analysis
                      </h4>
                      <div className="text-sm text-yellow-800 space-y-1">
                        {gapAnalysis.geographic_gaps && (
                          <p>• Geographic: {gapAnalysis.geographic_gaps}</p>
                        )}
                        {gapAnalysis.expertise_gaps && (
                          <p>• Expertise: {gapAnalysis.expertise_gaps}</p>
                        )}
                        {gapAnalysis.recommendations && (
                          <p>• {gapAnalysis.recommendations[0]}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Number of Partners */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Partners to Find
                </label>
                <select
                  value={numPartners}
                  onChange={(e) => setNumPartners(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n} partner{n !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600">AI is finding perfect partners for you...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
            </div>
          )}

          {/* Results */}
          {!loading && suggestedPartners.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Suggested Partners ({suggestedPartners.length})
                </h3>
                <button
                  onClick={() => {
                    const allIds = new Set(suggestedPartners.map(p => p.temp_id));
                    setSelectedPartners(selectedPartners.size === suggestedPartners.length ? new Set() : allIds);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedPartners.size === suggestedPartners.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {suggestedPartners.map(partner => {
                  const isSelected = selectedPartners.has(partner.temp_id);
                  return (
                    <motion.div
                      key={partner.temp_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "border-2 rounded-xl overflow-hidden transition-all cursor-pointer",
                        isSelected
                          ? "border-blue-500 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => handleTogglePartner(partner.temp_id)}
                    >
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {partner.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {partner.type}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                <MapPin className="w-3 h-3" />
                                {partner.country}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Compatibility Score */}
                            <div className="text-center">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-gray-900">
                                  {partner.compatibility_score || 75}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">Match</p>
                            </div>
                            {/* Selection Checkbox */}
                            <div className={cn(
                              "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300"
                            )}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {partner.description}
                        </p>

                        {/* Website */}
                        {partner.website && (
                          <div className="text-xs text-gray-500 mb-3">
                            <Globe className="w-3 h-3 inline mr-1" />
                            {partner.website}
                          </div>
                        )}

                        {/* Expertise */}
                        {partner.expertise_areas && partner.expertise_areas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {partner.expertise_areas.slice(0, 3).map((area, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {area}
                              </span>
                            ))}
                            {partner.expertise_areas.length > 3 && (
                              <span className="px-2 py-1 text-xs text-gray-500">
                                +{partner.expertise_areas.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Match Reason */}
                        {partner.match_reason && (
                          <div className="pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Why this partner: </span>
                              {partner.match_reason}
                            </p>
                          </div>
                        )}

                        {/* Project Contribution (for proposal-based search) */}
                        {partner.project_contribution && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700">
                              <span className="font-medium">Contribution: </span>
                              {partner.project_contribution}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {suggestedPartners.length > 0 && (
                <>
                  <span>{selectedPartners.size} of {suggestedPartners.length} selected</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {suggestedPartners.length > 0 && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  New Search
                </button>
              )}

              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>

              {suggestedPartners.length === 0 ? (
                <button
                  onClick={handleSearch}
                  disabled={loading || (searchMode === 'proposal' && !selectedProposal)}
                  className={cn(
                    "px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                    "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
                    "hover:from-blue-600 hover:to-indigo-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  Find Partners
                </button>
              ) : (
                <button
                  onClick={handleSaveSelected}
                  disabled={selectedPartners.size === 0 || savingPartners}
                  className={cn(
                    "px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                    "bg-gradient-to-r from-green-500 to-green-600 text-white",
                    "hover:from-green-600 hover:to-green-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {savingPartners ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Save Selected Partners
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};