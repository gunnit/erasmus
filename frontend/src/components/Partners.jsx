import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Filter, Globe, Building2, Mail, Phone,
  MapPin, ExternalLink, RefreshCw, Award, Edit, Trash2, X,
  Loader2, ChevronDown, AlertCircle, CheckCircle, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

const PARTNER_TYPES = [
  { value: 'NGO', label: 'NGO' },
  { value: 'PUBLIC_INSTITUTION', label: 'Public Institution' },
  { value: 'PRIVATE_COMPANY', label: 'Private Company' },
  { value: 'EDUCATIONAL_INSTITUTION', label: 'Educational Institution' },
  { value: 'RESEARCH_CENTER', label: 'Research Center' },
  { value: 'SOCIAL_ENTERPRISE', label: 'Social Enterprise' }
];

export const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [crawling, setCrawling] = useState(false);
  const [notification, setNotification] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPartners, setTotalPartners] = useState(0);

  useEffect(() => {
    fetchPartners();
  }, [currentPage, searchQuery, filterType, filterCountry]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 12,
        ...(searchQuery && { search: searchQuery }),
        ...(filterType && { partner_type: filterType }),
        ...(filterCountry && { country: filterCountry })
      };

      const response = await api.get('/partners/', { params });
      setPartners(response.data.partners);
      setTotalPages(response.data.total_pages);
      setTotalPartners(response.data.total);
    } catch (error) {
      showNotification('Failed to fetch partners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddPartner = () => {
    setEditingPartner(null);
    setShowAddModal(true);
  };

  const handleEditPartner = (partner) => {
    setEditingPartner(partner);
    setShowAddModal(true);
  };

  const handleDeletePartner = async (partnerId) => {
    if (window.confirm('Are you sure you want to delete this partner?')) {
      try {
        await api.delete(`/partners/${partnerId}`);
        showNotification('Partner deleted successfully');
        fetchPartners();
      } catch (error) {
        showNotification('Failed to delete partner', 'error');
      }
    }
  };

  const handleCrawlWebsite = async (partner) => {
    if (!partner.website) {
      showNotification('Partner has no website URL', 'error');
      return;
    }

    setCrawling(true);
    try {
      const response = await api.post(`/partners/${partner.id}/crawl`);
      showNotification('Website crawled successfully');

      // Update partner in list
      setPartners(partners.map(p =>
        p.id === partner.id ? response.data : p
      ));

      // If viewing details, update selected partner
      if (selectedPartner?.id === partner.id) {
        setSelectedPartner(response.data);
      }
    } catch (error) {
      showNotification('Failed to crawl website', 'error');
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Partners Library
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your partner organizations for Erasmus+ projects
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddPartner}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Partner
          </motion.button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Partners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPartners}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search partners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {PARTNER_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter by country..."
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Partners Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No partners found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || filterType || filterCountry
              ? 'Try adjusting your filters'
              : 'Start by adding your first partner organization'}
          </p>
          {!searchQuery && !filterType && !filterCountry && (
            <button
              onClick={handleAddPartner}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              Add First Partner
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  {/* Partner Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {partner.name}
                      </h3>
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                        {PARTNER_TYPES.find(t => t.value === partner.type)?.label || partner.type}
                      </span>
                    </div>

                    {partner.affinity_score && (
                      <div className="flex items-center gap-1">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {partner.affinity_score.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Partner Info */}
                  <div className="space-y-2 mb-4">
                    {partner.country && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Globe className="w-4 h-4" />
                        <span>{partner.country}</span>
                      </div>
                    )}

                    {partner.website && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <ExternalLink className="w-4 h-4" />
                        <a
                          href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-500 truncate"
                        >
                          {partner.website}
                        </a>
                      </div>
                    )}

                    {partner.contact_info?.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{partner.contact_info.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {partner.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {partner.description}
                    </p>
                  )}

                  {/* Expertise Areas */}
                  {partner.expertise_areas && partner.expertise_areas.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {partner.expertise_areas.slice(0, 3).map((area, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          >
                            {area}
                          </span>
                        ))}
                        {partner.expertise_areas.length > 3 && (
                          <span className="px-2 py-1 text-xs text-gray-500">
                            +{partner.expertise_areas.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setSelectedPartner(partner)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => handleEditPartner(partner)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {partner.website && (
                      <button
                        onClick={() => handleCrawlWebsite(partner)}
                        disabled={crawling}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors"
                      >
                        <RefreshCw className={cn("w-4 h-4", crawling && "animate-spin")} />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeletePartner(partner.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <PartnerModal
            partner={editingPartner}
            onClose={() => setShowAddModal(false)}
            onSave={() => {
              fetchPartners();
              setShowAddModal(false);
            }}
            onCrawl={handleCrawlWebsite}
          />
        )}
      </AnimatePresence>

      {/* Partner Details Modal */}
      <AnimatePresence>
        {selectedPartner && (
          <PartnerDetailsModal
            partner={selectedPartner}
            onClose={() => setSelectedPartner(null)}
            onEdit={() => {
              handleEditPartner(selectedPartner);
              setSelectedPartner(null);
            }}
            onCrawl={handleCrawlWebsite}
          />
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-20 right-4 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3",
              notification.type === 'error'
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            )}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Partner Add/Edit Modal Component
const PartnerModal = ({ partner, onClose, onSave, onCrawl }) => {
  const [formData, setFormData] = useState({
    name: partner?.name || '',
    type: partner?.type || 'NGO',
    country: partner?.country || '',
    website: partner?.website || '',
    description: partner?.description || '',
    expertise_areas: partner?.expertise_areas || [],
    contact_info: partner?.contact_info || {}
  });
  const [saving, setSaving] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (partner) {
        await api.put(`/partners/${partner.id}`, formData);
      } else {
        await api.post('/partners/', formData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save partner:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExpertise = () => {
    if (expertiseInput.trim()) {
      setFormData(prev => ({
        ...prev,
        expertise_areas: [...prev.expertise_areas, expertiseInput.trim()]
      }));
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (index) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas.filter((_, i) => i !== index)
    }));
  };

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
        className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {partner ? 'Edit Partner' : 'Add New Partner'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Partner Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PARTNER_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Germany"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.org"
              />
              {formData.website && partner && (
                <button
                  type="button"
                  onClick={() => onCrawl(partner)}
                  className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Crawl
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the organization..."
            />
          </div>

          {/* Expertise Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Areas of Expertise
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add expertise area..."
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.expertise_areas.map((area, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-1"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => handleRemoveExpertise(index)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact Information
            </label>

            <input
              type="email"
              value={formData.contact_info.email || ''}
              onChange={(e) => setFormData({
                ...formData,
                contact_info: { ...formData.contact_info, email: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email address"
            />

            <input
              type="tel"
              value={formData.contact_info.phone || ''}
              onChange={(e) => setFormData({
                ...formData,
                contact_info: { ...formData.contact_info, phone: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Phone number"
            />

            <input
              type="text"
              value={formData.contact_info.address || ''}
              onChange={(e) => setFormData({
                ...formData,
                contact_info: { ...formData.contact_info, address: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Address"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {partner ? 'Update Partner' : 'Add Partner'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Partner Details Modal Component
const PartnerDetailsModal = ({ partner, onClose, onEdit, onCrawl }) => {
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
        className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {partner.name}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Type</h3>
              <p className="text-gray-900 dark:text-white">
                {PARTNER_TYPES.find(t => t.value === partner.type)?.label || partner.type}
              </p>
            </div>

            {partner.country && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Country</h3>
                <p className="text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {partner.country}
                </p>
              </div>
            )}

            {partner.website && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Website</h3>
                <a
                  href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {partner.website}
                </a>
              </div>
            )}

            {partner.affinity_score !== null && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Project Affinity</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      style={{ width: `${partner.affinity_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{partner.affinity_score.toFixed(0)}%</span>
                </div>
                {partner.affinity_explanation && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {partner.affinity_explanation}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {partner.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
              <p className="text-gray-900 dark:text-white">{partner.description}</p>
            </div>
          )}

          {/* Expertise Areas */}
          {partner.expertise_areas && partner.expertise_areas.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Areas of Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {partner.expertise_areas.map((area, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {partner.contact_info && Object.keys(partner.contact_info).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Contact Information</h3>
              <div className="space-y-2">
                {partner.contact_info.email && (
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${partner.contact_info.email}`} className="hover:underline">
                      {partner.contact_info.email}
                    </a>
                  </div>
                )}
                {partner.contact_info.phone && (
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{partner.contact_info.phone}</span>
                  </div>
                )}
                {partner.contact_info.address && (
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{partner.contact_info.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Crawled Data */}
          {partner.last_crawled && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last crawled: {new Date(partner.last_crawled).toLocaleString()}
                </p>
                {partner.website && (
                  <button
                    onClick={() => onCrawl(partner)}
                    className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Data
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <p>Created: {new Date(partner.created_at).toLocaleString()}</p>
            <p>Last updated: {new Date(partner.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};