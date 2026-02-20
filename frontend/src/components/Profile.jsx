import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Building, MapPin, Calendar,
  Award, Briefcase, Globe, Edit3, Save, Camera,
  Linkedin, Twitter, FileText, Shield, Star, DollarSign, Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import { Progress } from './ui/Progress';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { fadeInVariants, staggerContainer } from '../lib/utils';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState({
    personalInfo: {
      fullName: user?.full_name || '',
      email: user?.email || '',
      phone: '',
      title: '',
      bio: '',
      avatar: null
    },
    organization: {
      name: user?.organization || '',
      type: 'NGO',
      address: '',
      city: '',
      country: '',
      website: '',
      description: ''
    },
    expertise: {
      areas: [],
      languages: [],
      experience: '',
      certifications: []
    },
    social: {
      linkedin: '',
      twitter: '',
      orcid: ''
    },
    stats: {
      proposalsCreated: 12,
      proposalsApproved: 8,
      totalFunding: 2400000,
      partnersConnected: 45,
      successRate: 75,
      profileCompletion: 85
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/');
      const data = response.data;
      setProfile(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: data.full_name || user?.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          bio: data.bio || ''
        },
        organization: {
          ...prev.organization,
          name: data.organization || user?.organization || '',
          country: data.country || ''
        },
        stats: {
          ...prev.stats,
          proposalsCreated: data.proposal_count || 0
        }
      }));
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/profile/', {
        full_name: profile.personalInfo.fullName,
        email: profile.personalInfo.email,
        organization: profile.organization.name,
        phone: profile.personalInfo.phone,
        bio: profile.personalInfo.bio,
        country: profile.organization.country
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('personalInfo', 'avatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-1">Manage your personal and organization information</p>
        </div>
        <Button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          variant="primary"
          disabled={loading}
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </motion.div>

      {/* Profile Completion */}
      <motion.div variants={fadeInVariants}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Completion</p>
                <p className="text-2xl font-bold">{profile.stats.profileCompletion}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Complete your profile to</p>
                <p className="text-sm font-medium text-blue-600">increase proposal success rate</p>
              </div>
            </div>
            <Progress value={profile.stats.profileCompletion} max={100} size="lg" animated />
            {profile.stats.profileCompletion < 100 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Add your expertise areas and social links to complete your profile
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info & Stats */}
        <motion.div variants={fadeInVariants} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-1">
                    {profile.personalInfo.avatar ? (
                      <img 
                        src={profile.personalInfo.avatar} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover bg-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>

              <Input
                label="Full Name"
                icon={User}
                value={profile.personalInfo.fullName}
                onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
                disabled={!isEditing}
              />
              <Input
                label="Email"
                type="email"
                icon={Mail}
                value={profile.personalInfo.email}
                onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                disabled={!isEditing}
              />
              <Input
                label="Phone"
                type="tel"
                icon={Phone}
                value={profile.personalInfo.phone}
                onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                disabled={!isEditing}
              />
              <Input
                label="Job Title"
                icon={Briefcase}
                value={profile.personalInfo.title}
                onChange={(e) => handleInputChange('personalInfo', 'title', e.target.value)}
                disabled={!isEditing}
                placeholder="Project Manager"
              />
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatCard 
                icon={FileText} 
                label="Proposals Created" 
                value={profile.stats.proposalsCreated}
                color="from-blue-500 to-indigo-600"
              />
              <StatCard 
                icon={Award} 
                label="Success Rate" 
                value={`${profile.stats.successRate}%`}
                color="from-green-500 to-emerald-600"
              />
              <StatCard 
                icon={DollarSign} 
                label="Total Funding" 
                value={`€${(profile.stats.totalFunding / 1000000).toFixed(1)}M`}
                color="from-purple-500 to-pink-600"
              />
              <StatCard 
                icon={Users} 
                label="Partners" 
                value={profile.stats.partnersConnected}
                color="from-orange-500 to-red-600"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Middle & Right Columns - Organization & Other Info */}
        <motion.div variants={fadeInVariants} className="lg:col-span-2 space-y-6">
          {/* Organization Information */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Organization Name"
                  icon={Building}
                  value={profile.organization.name}
                  onChange={(e) => handleInputChange('organization', 'name', e.target.value)}
                  disabled={!isEditing}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Type
                  </label>
                  <select
                    value={profile.organization.type}
                    onChange={(e) => handleInputChange('organization', 'type', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    <option value="NGO">NGO</option>
                    <option value="University">University</option>
                    <option value="Company">Company</option>
                    <option value="Government">Government</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Input
                  label="City"
                  icon={MapPin}
                  value={profile.organization.city}
                  onChange={(e) => handleInputChange('organization', 'city', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Country"
                  icon={Globe}
                  value={profile.organization.country}
                  onChange={(e) => handleInputChange('organization', 'country', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <Input
                label="Website"
                type="text"
                icon={Globe}
                value={profile.organization.website}
                onChange={(e) => handleInputChange('organization', 'website', e.target.value)}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val && !/^https?:\/\//i.test(val)) {
                    handleInputChange('organization', 'website', 'https://' + val);
                  }
                }}
                disabled={!isEditing}
                placeholder="www.example.org"
              />
              <Textarea
                label="Organization Description"
                value={profile.organization.description}
                onChange={(e) => handleInputChange('organization', 'description', e.target.value)}
                disabled={!isEditing}
                rows={4}
                placeholder="Brief description of your organization..."
              />
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Bio</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={profile.personalInfo.bio}
                onChange={(e) => handleInputChange('personalInfo', 'bio', e.target.value)}
                disabled={!isEditing}
                rows={5}
                placeholder="Tell us about your experience and expertise in Erasmus+ projects..."
              />
            </CardContent>
          </Card>

          {/* Expertise & Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Expertise & Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Areas of Expertise
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Education', 'Digital Skills', 'Social Inclusion', 'Environment', 'Youth', 'Innovation'].map(area => (
                    <button
                      key={area}
                      onClick={() => {
                        if (isEditing) {
                          const areas = profile.expertise.areas.includes(area)
                            ? profile.expertise.areas.filter(a => a !== area)
                            : [...profile.expertise.areas, area];
                          handleInputChange('expertise', 'areas', areas);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        profile.expertise.areas.includes(area)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      } ${isEditing ? 'cursor-pointer hover:bg-blue-200' : 'cursor-default'}`}
                      disabled={!isEditing}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>
                <div className="flex flex-wrap gap-2">
                  {['English', 'French', 'German', 'Spanish', 'Italian', 'Polish'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        if (isEditing) {
                          const languages = profile.expertise.languages.includes(lang)
                            ? profile.expertise.languages.filter(l => l !== lang)
                            : [...profile.expertise.languages, lang];
                          handleInputChange('expertise', 'languages', languages);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        profile.expertise.languages.includes(lang)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      } ${isEditing ? 'cursor-pointer hover:bg-green-200' : 'cursor-default'}`}
                      disabled={!isEditing}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Years of Experience"
                value={profile.expertise.experience}
                onChange={(e) => handleInputChange('expertise', 'experience', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g., 5+ years in EU project management"
              />
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social & Professional Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="LinkedIn"
                icon={Linkedin}
                value={profile.social.linkedin}
                onChange={(e) => handleInputChange('social', 'linkedin', e.target.value)}
                disabled={!isEditing}
                placeholder="https://linkedin.com/in/yourprofile"
              />
              <Input
                label="Twitter"
                icon={Twitter}
                value={profile.social.twitter}
                onChange={(e) => handleInputChange('social', 'twitter', e.target.value)}
                disabled={!isEditing}
                placeholder="@yourhandle"
              />
              <Input
                label="ORCID"
                icon={Shield}
                value={profile.social.orcid}
                onChange={(e) => handleInputChange('social', 'orcid', e.target.value)}
                disabled={!isEditing}
                placeholder="0000-0000-0000-0000"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;