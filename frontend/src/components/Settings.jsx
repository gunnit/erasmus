import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Bell, Shield, Globe, Palette, Save, 
  Mail, Phone, Building, MapPin, CreditCard,
  Key, Eye, EyeOff, Check, X, Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import api from '../services/api';
import toast from 'react-hot-toast';
import { fadeInVariants, staggerContainer } from '../lib/utils';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    general: {
      organization: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      language: 'en',
      timezone: 'Europe/Brussels'
    },
    notifications: {
      emailNotifications: true,
      proposalUpdates: true,
      deadlineReminders: true,
      partnerRequests: false,
      newsletter: true,
      reminderDays: 7
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorEnabled: false
    },
    preferences: {
      theme: 'light',
      defaultCurrency: 'EUR',
      autoSave: true,
      autoSaveInterval: 5,
      showTips: true,
      compactView: false
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async (section) => {
    setLoading(true);
    try {
      await api.put(`/settings/${section}`, settings[section]);
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`);
      fetchSettings();
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette }
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInVariants}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInVariants} className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Update your organization and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Organization Name"
                  icon={Building}
                  value={settings.general.organization}
                  onChange={(e) => handleInputChange('general', 'organization', e.target.value)}
                  placeholder="Your organization name"
                />
                <Input
                  label="Email Address"
                  type="email"
                  icon={Mail}
                  value={settings.general.email}
                  onChange={(e) => handleInputChange('general', 'email', e.target.value)}
                  placeholder="contact@organization.com"
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  icon={Phone}
                  value={settings.general.phone}
                  onChange={(e) => handleInputChange('general', 'phone', e.target.value)}
                  placeholder="+32 123 456 789"
                />
                <Input
                  label="Country"
                  icon={Globe}
                  value={settings.general.country}
                  onChange={(e) => handleInputChange('general', 'country', e.target.value)}
                  placeholder="Belgium"
                />
              </div>
              <Textarea
                label="Address"
                icon={MapPin}
                value={settings.general.address}
                onChange={(e) => handleInputChange('general', 'address', e.target.value)}
                placeholder="Street address, city, postal code"
                rows={3}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.general.language}
                    onChange={(e) => handleInputChange('general', 'language', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Europe/Brussels">Brussels (GMT+1)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (GMT+1)</option>
                    <option value="Europe/Berlin">Berlin (GMT+1)</option>
                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave('general')}
                  disabled={loading}
                  variant="primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { key: 'proposalUpdates', label: 'Proposal Updates', desc: 'Get notified about proposal status changes' },
                  { key: 'deadlineReminders', label: 'Deadline Reminders', desc: 'Reminders for upcoming deadlines' },
                  { key: 'partnerRequests', label: 'Partner Requests', desc: 'Notifications about partnership opportunities' },
                  { key: 'newsletter', label: 'Newsletter', desc: 'Receive our monthly newsletter' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleInputChange('notifications', item.key, !settings.notifications[item.key])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications[item.key] ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Reminder Settings</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm text-blue-700">Send reminders</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.notifications.reminderDays}
                        onChange={(e) => handleInputChange('notifications', 'reminderDays', e.target.value)}
                        className="w-16 px-2 py-1 text-center rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-700">days before deadline</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave('notifications')}
                  disabled={loading}
                  variant="primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={Key}
                  value={settings.security.currentPassword}
                  onChange={(e) => handleInputChange('security', 'currentPassword', e.target.value)}
                  placeholder="Enter current password"
                />
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={Key}
                  value={settings.security.newPassword}
                  onChange={(e) => handleInputChange('security', 'newPassword', e.target.value)}
                  placeholder="Enter new password"
                />
                <Input
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={Key}
                  value={settings.security.confirmPassword}
                  onChange={(e) => handleInputChange('security', 'confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPassword ? 'Hide' : 'Show'} passwords</span>
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    onClick={() => handleInputChange('security', 'twoFactorEnabled', !settings.security.twoFactorEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.security.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSave('security')}
                  disabled={loading}
                  variant="primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Preferences Settings */}
      {activeTab === 'preferences' && (
        <motion.div variants={fadeInVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.preferences.theme}
                    onChange={(e) => handleInputChange('preferences', 'theme', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Currency
                  </label>
                  <select
                    value={settings.preferences.defaultCurrency}
                    onChange={(e) => handleInputChange('preferences', 'defaultCurrency', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'autoSave', label: 'Auto-save', desc: 'Automatically save your work' },
                  { key: 'showTips', label: 'Show Tips', desc: 'Display helpful tips and hints' },
                  { key: 'compactView', label: 'Compact View', desc: 'Use a more condensed layout' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleInputChange('preferences', item.key, !settings.preferences[item.key])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.preferences[item.key] ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.preferences[item.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {settings.preferences.autoSave && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-700">Auto-save every</span>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.preferences.autoSaveInterval}
                      onChange={(e) => handleInputChange('preferences', 'autoSaveInterval', e.target.value)}
                      className="w-16 px-2 py-1 text-center rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-700">minutes</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave('preferences')}
                  disabled={loading}
                  variant="primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Settings;