import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, FileText, Users, Award, Globe, Calendar,
  Target, Rocket, Search, Filter, Download, ExternalLink,
  Video, ChevronRight, Info, TrendingUp, CheckCircle,
  Star, Lightbulb, FileCheck, School, Briefcase
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';

const ErasmusResources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedSection, setExpandedSection] = useState(null);

  // Resource categories
  const resourceCategories = [
    { id: 'all', name: 'All Resources', icon: BookOpen },
    { id: 'guides', name: 'Official Guides', icon: FileText },
    { id: 'templates', name: 'Templates & Forms', icon: FileCheck },
    { id: 'webinars', name: 'Webinars & Training', icon: Video },
    { id: 'examples', name: 'Success Stories', icon: Star },
    { id: 'tools', name: 'Tools & Platforms', icon: Rocket },
    { id: 'criteria', name: 'Evaluation Criteria', icon: Target }
  ];

  // Main resources data
  const resources = [
    {
      id: 1,
      category: 'guides',
      title: 'Erasmus+ Programme Guide 2025',
      description: 'The complete official guide for all Erasmus+ actions including KA220-ADU adult education partnerships.',
      link: 'https://erasmus-plus.ec.europa.eu/erasmus-programme-guide',
      downloadLink: 'https://erasmus-plus.ec.europa.eu/sites/default/files/2024-11/erasmus-programme-guide-2025_en.pdf',
      type: 'official',
      lastUpdated: 'January 2025',
      version: 'Version 2',
      importance: 'essential'
    },
    {
      id: 2,
      category: 'templates',
      title: 'KA220-ADU Application Template',
      description: 'Official template for Cooperation partnerships in adult education (KA220-ADU) applications.',
      link: 'https://erasmus-plus.ec.europa.eu/document/template-application-form-cooperation-partnerships-in-adult-education-ka220-adu',
      type: 'template',
      importance: 'essential'
    },
    {
      id: 3,
      category: 'tools',
      title: 'EPALE Platform',
      description: 'Electronic Platform for Adult Learning in Europe - connect with professionals, find resources, and share best practices.',
      link: 'https://epale.ec.europa.eu/en',
      type: 'platform',
      features: ['Resource Library', 'Community Forums', 'Webinars', 'Partner Search']
    },
    {
      id: 4,
      category: 'examples',
      title: 'Erasmus+ Project Results Platform',
      description: 'Database of over 74,000 funded projects with detailed descriptions, methodologies, and outcomes.',
      link: 'https://erasmus-plus.ec.europa.eu/projects',
      type: 'database',
      importance: 'high'
    },
    {
      id: 5,
      category: 'criteria',
      title: 'Evaluation Criteria Guide',
      description: 'Detailed breakdown of the 4 evaluation criteria for KA220-ADU applications with scoring guidelines.',
      type: 'guide',
      internalContent: true
    },
    {
      id: 6,
      category: 'webinars',
      title: 'AI in Adult Education Webinar Series',
      description: 'EPALE webinar series on using AI tools and workflows in adult education.',
      link: 'https://epale.ec.europa.eu/en/content/epale-webinars-2024-ai-adult-education',
      type: 'webinar'
    },
    {
      id: 7,
      category: 'tools',
      title: 'Erasmus+ Budget Calculator',
      description: 'Calculate your KA220 project budget with predefined lump sums (€120,000, €250,000, or €400,000).',
      link: 'https://erasmusbudgetcalculator.com/',
      type: 'tool'
    },
    {
      id: 8,
      category: 'templates',
      title: 'Sample Applications 2022',
      description: 'Real examples of successful KA220-ADU applications from 2022 call.',
      link: 'https://erasmus-plus.ec.europa.eu/document/call-2022-cooperation-partnerships-in-adult-education-ka220-adu-applications-sample',
      downloadLink: 'https://erasmus-plus.ec.europa.eu/sites/default/files/2021-11/Call_2022_Cooperation_partnerships_in_adult_education_KA220-ADU_applications_sample.pdf',
      type: 'example'
    },
    {
      id: 9,
      category: 'guides',
      title: 'Expert Quality Assessment Guide 2024',
      description: 'Guide for evaluators - understand what experts look for in applications.',
      link: 'https://www.leargas.ie/resource/erasmus-guide-for-experts-on-quality-assessment-2024/',
      type: 'guide',
      importance: 'high'
    },
    {
      id: 10,
      category: 'tools',
      title: 'Funding & Tenders Portal',
      description: 'Official EU portal for finding calls, submitting applications, and managing projects.',
      link: 'https://webgate.ec.europa.eu/app-forms/af-ui-opportunities/',
      type: 'platform'
    }
  ];

  // Evaluation criteria details
  const evaluationCriteria = [
    {
      criterion: 'Relevance',
      maxPoints: 25,
      minRequired: 12.5,
      description: 'How well the proposal addresses the priorities and objectives of the action',
      keyAspects: [
        'Alignment with EU priorities',
        'Clear needs analysis',
        'Target groups definition',
        'Innovation and complementarity'
      ]
    },
    {
      criterion: 'Quality of Project Design',
      maxPoints: 30,
      minRequired: 15,
      description: 'Coherence and overall quality of the project design and implementation',
      keyAspects: [
        'Clear objectives and measurable indicators',
        'Appropriate methodology',
        'Work plan and timeline',
        'Risk management',
        'Budget cost-effectiveness'
      ]
    },
    {
      criterion: 'Partnership Quality',
      maxPoints: 20,
      minRequired: 10,
      description: 'Quality of partnership and cooperation arrangements',
      keyAspects: [
        'Partner competencies and experience',
        'Task distribution',
        'Cooperation mechanisms',
        'Geographic and sectoral balance'
      ]
    },
    {
      criterion: 'Impact',
      maxPoints: 25,
      minRequired: 12.5,
      description: 'Potential impact and dissemination of results',
      keyAspects: [
        'Impact on participants and organizations',
        'Dissemination strategy',
        'Sustainability measures',
        'Open access to materials',
        'Wider societal benefits'
      ]
    }
  ];

  // Key dates and deadlines
  const keyDates = [
    { date: 'March 5, 2025', event: 'Round 1 Application Deadline', status: 'past' },
    { date: 'August 2025', event: 'Results Announcement Round 1', status: 'past' },
    { date: 'October 1, 2025', event: 'Round 2 Application Deadline', status: 'upcoming' },
    { date: 'December 2025 - January 2026', event: 'Evaluation Period Round 2', status: 'future' },
    { date: 'February 2026', event: 'Results Announcement Round 2', status: 'future' },
    { date: 'March 2026', event: 'Round 1 Application Deadline (Next Year)', status: 'future' }
  ];

  // EU Priorities for 2025
  const euPriorities = [
    {
      title: 'Inclusion and Diversity',
      description: 'Promoting equal opportunities and inclusive practices in all forms of education',
      icon: Users
    },
    {
      title: 'Digital Transformation',
      description: 'Enhancing digital skills and integrating digital technologies in education',
      icon: Globe
    },
    {
      title: 'Green Transition',
      description: 'Environmental sustainability and climate action through education',
      icon: Lightbulb
    },
    {
      title: 'Participation in Democratic Life',
      description: 'Active citizenship, common values, and civic engagement',
      icon: School
    }
  ];

  // Success stories
  const successStories = [
    {
      title: 'Digital Skills for Seniors',
      country: 'Italy',
      budget: '€250,000',
      impact: '500+ seniors trained in digital competencies',
      year: 2024
    },
    {
      title: 'NO LIMIT - Arts for Disabilities',
      country: 'Spain',
      budget: '€400,000',
      impact: 'Empowered 200+ adults with disabilities through arts',
      year: 2023
    },
    {
      title: 'Active Citizenship Ambassadors',
      country: 'Germany',
      budget: '€120,000',
      impact: 'Engaged 150+ women over 50 in volunteering',
      year: 2024
    }
  ];

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-20"
      >
        <div className="absolute inset-0 bg-mesh-gradient opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeIn} className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              Erasmus+ Learning Resources
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Your comprehensive guide to KA220-ADU adult education partnerships -
              from official documentation to success stories and practical tools
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.a
                href="https://erasmus-plus.ec.europa.eu/erasmus-programme-guide"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Programme Guide 2025
              </motion.a>
              <motion.a
                href="https://epale.ec.europa.eu/en"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors flex items-center gap-2"
              >
                <Globe className="w-5 h-5" />
                EPALE Platform
              </motion.a>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Quick Stats */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">€120K-400K</div>
              <div className="text-sm text-gray-600 mt-2">Funding Available</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">60/100</div>
              <div className="text-sm text-gray-600 mt-2">Min. Score Required</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">12-36</div>
              <div className="text-sm text-gray-600 mt-2">Months Duration</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">3+</div>
              <div className="text-sm text-gray-600 mt-2">Partners Required</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Filter className="text-gray-400 w-5 h-5 mt-3" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {resourceCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resource Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {resourceCategories.slice(1).map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Resources Grid */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Essential Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(resource => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  {resource.importance === 'essential' && (
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3" />
                        Essential
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-semibold mb-2">{resource.title}</h3>
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  {resource.version && (
                    <p className="text-sm text-gray-500 mb-2">
                      {resource.version} • Updated {resource.lastUpdated}
                    </p>
                  )}
                  {resource.features && (
                    <div className="mb-4">
                      {resource.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {resource.link && (
                      <a
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Resource
                      </a>
                    )}
                    {resource.downloadLink && (
                      <a
                        href={resource.downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                    {resource.internalContent && (
                      <button
                        onClick={() => setExpandedSection('criteria')}
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        <Info className="w-4 h-4" />
                        View Details
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Evaluation Criteria Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Evaluation Criteria & Scoring
        </h2>
        <p className="text-gray-600 mb-8">
          To be eligible for funding, your project must score at least 60/100 total points,
          with minimum 50% in each criterion.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {evaluationCriteria.map((criterion, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{criterion.criterion}</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{criterion.maxPoints}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Minimum Required</span>
                    <span className="font-medium">{criterion.minRequired} points</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                      style={{ width: `${(criterion.minRequired / criterion.maxPoints) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{criterion.description}</p>
                <div className="space-y-2">
                  {criterion.keyAspects.map((aspect, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-sm text-gray-700">{aspect}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* EU Priorities */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            2025 EU Priorities for Adult Education
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {euPriorities.map((priority, index) => {
              const Icon = priority.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{priority.title}</h3>
                    <p className="text-sm text-gray-600">{priority.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Success Stories from Funded Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {successStories.map((story, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8 text-yellow-500" />
                  <span className="text-sm text-gray-500">{story.year}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{story.title}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Country:</span>
                    <span className="font-medium">{story.country}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium text-green-600">{story.budget}</span>
                  </div>
                </div>
                <p className="text-sm text-blue-600 font-medium">{story.impact}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Key Dates Timeline */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Important Dates & Deadlines
          </h2>
          <div className="space-y-4">
            {keyDates.map((date, index) => (
              <div key={index} className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
                <Calendar className="w-6 h-6 text-blue-600" />
                <div className="flex-1">
                  <div className="font-semibold">{date.event}</div>
                  <div className="text-sm text-gray-600">{date.date}</div>
                </div>
                {date.status === 'upcoming' && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 text-sm rounded-full">
                    Upcoming
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="https://erasmus-plus.ec.europa.eu/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Project Results Platform</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </a>
          <a
            href="https://webgate.ec.europa.eu/app-forms/af-ui-opportunities/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-green-600" />
              <span className="font-medium">Funding & Tenders Portal</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </a>
          <a
            href="https://epale.ec.europa.eu/en/partner-requests/erasmus-strategic-partnerships-adult-education-ka220-adu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Partner Search</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </a>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Apply for Erasmus+ Funding?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Use our AI-powered system to generate your complete KA220-ADU application in just 30 minutes
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <motion.a
                  href="/"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
                >
                  Start Your Application
                </motion.a>
                <motion.a
                  href="https://erasmus-plus.ec.europa.eu/document/erasmus-programme-guide-2025-version-2"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-400 transition-colors"
                >
                  Download Programme Guide
                </motion.a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ErasmusResources;