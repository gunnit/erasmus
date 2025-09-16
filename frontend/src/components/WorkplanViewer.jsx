import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Briefcase, Calendar, Users, Target, CheckCircle, Edit3, Save, X,
  ChevronDown, ChevronRight, Loader2, Wand2, Download, Plus, Trash2,
  Clock, User, FileText, AlertCircle, Info
} from 'lucide-react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

const WorkplanViewer = ({ proposalId, proposalData, onWorkplanGenerated }) => {
  const [workplan, setWorkplan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [expandedWP, setExpandedWP] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [editedWorkplan, setEditedWorkplan] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    if (proposalId) {
      fetchWorkplan();
    }
  }, [proposalId]);

  const fetchWorkplan = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/form/workplan/${proposalId}`);
      if (response.data.success && response.data.workplan) {
        setWorkplan(response.data.workplan);
        setEditedWorkplan(response.data.workplan);
        // Expand first work package by default
        if (response.data.workplan.work_packages?.length > 0) {
          setExpandedWP({ [response.data.workplan.work_packages[0].id]: true });
        }
      }
    } catch (error) {
      // Workplan doesn't exist yet, that's okay
      console.log('No workplan found');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWorkplan = async () => {
    try {
      setGenerating(true);
      const response = await api.post('/form/workplan/generate', {
        proposal_id: proposalId,
        regenerate: workplan !== null
      });

      if (response.data.success) {
        setWorkplan(response.data.workplan);
        setEditedWorkplan(response.data.workplan);
        toast.success('Workplan generated successfully!');
        if (onWorkplanGenerated) {
          onWorkplanGenerated(response.data.workplan);
        }
        // Expand first work package
        if (response.data.workplan.work_packages?.length > 0) {
          setExpandedWP({ [response.data.workplan.work_packages[0].id]: true });
        }
      }
    } catch (error) {
      console.error('Failed to generate workplan:', error);
      toast.error('Failed to generate workplan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveWorkplan = async () => {
    try {
      const response = await api.put(`/form/workplan/${proposalId}`, editedWorkplan);
      if (response.data.success) {
        setWorkplan(editedWorkplan);
        setEditMode(false);
        toast.success('Workplan saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save workplan:', error);
      toast.error('Failed to save workplan. Please try again.');
    }
  };

  const toggleWP = (wpId) => {
    setExpandedWP(prev => ({
      ...prev,
      [wpId]: !prev[wpId]
    }));
  };

  const getWorkPackageColor = (wpId) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500'
    ];
    const index = parseInt(wpId.replace('WP', '')) - 1;
    return colors[index % colors.length];
  };

  const renderWorkPackage = (wp) => {
    const isExpanded = expandedWP[wp.id];
    const colorClass = getWorkPackageColor(wp.id);

    return (
      <motion.div
        key={wp.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="overflow-hidden">
          {/* Work Package Header */}
          <div
            className={cn(
              "bg-gradient-to-r p-4 text-white cursor-pointer",
              colorClass
            )}
            onClick={() => toggleWP(wp.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <span className="font-bold text-lg">{wp.id}</span>
                <h3 className="text-xl font-semibold">{wp.title}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {wp.lead_partner}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  M{wp.start_month}-M{wp.end_month}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {wp.effort_pm} PM
                </span>
              </div>
            </div>
          </div>

          {/* Work Package Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                {/* Objectives */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Objectives
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {wp.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>

                {/* Activities */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-500" />
                    Activities
                  </h4>
                  <div className="space-y-3">
                    {wp.activities.map((activity) => (
                      <div key={activity.id} className="border-l-4 border-green-200 pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{activity.id}:</span>
                            <span className="ml-2 text-gray-800">{activity.name}</span>
                            {activity.description && (
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.responsible}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              M{activity.start_month}-M{activity.end_month}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deliverables */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Deliverables
                  </h4>
                  <div className="space-y-3">
                    {wp.deliverables.map((deliverable) => (
                      <div key={deliverable.id} className="border-l-4 border-purple-200 pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{deliverable.id}:</span>
                            <span className="ml-2 text-gray-800">{deliverable.title}</span>
                            {deliverable.description && (
                              <p className="text-sm text-gray-600 mt-1">{deliverable.description}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {deliverable.responsible}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Month {deliverable.due_month}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  const renderPartnerAllocation = () => {
    if (!workplan?.partner_allocation) return null;

    const partners = Object.keys(workplan.partner_allocation);
    const workPackages = workplan.work_packages.map(wp => wp.id);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Partner Effort Allocation (Person-Months)
          </CardTitle>
          <CardDescription>
            Distribution of effort across work packages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  {workPackages.map(wpId => (
                    <th key={wpId} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {wpId}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partners.map(partner => {
                  const partnerAllocation = workplan.partner_allocation[partner];
                  const total = Object.values(partnerAllocation).reduce((sum, val) => sum + val, 0);

                  return (
                    <tr key={partner}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {partner}
                      </td>
                      {workPackages.map(wpId => (
                        <td key={wpId} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {partnerAllocation[wpId] || 0}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                        {total.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMilestones = () => {
    if (!workplan?.timeline?.milestones) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Project Milestones
          </CardTitle>
          <CardDescription>
            Key project checkpoints and deliverables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>

            {/* Milestones */}
            <div className="space-y-6">
              {workplan.timeline.milestones.map((milestone, idx) => (
                <div key={milestone.id} className="flex gap-4">
                  <div className="relative">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                      idx === 0 ? "bg-green-500" :
                      idx === workplan.timeline.milestones.length - 1 ? "bg-red-500" :
                      "bg-blue-500"
                    )}>
                      M{milestone.month}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                    <p className="text-sm text-gray-500">Work Package: {milestone.work_package}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!workplan && !generating) {
    return (
      <Card className="text-center p-12">
        <div className="max-w-md mx-auto">
          <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Workplan Generated Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Generate a comprehensive workplan with work packages, activities, and partner allocations based on your proposal.
          </p>
          <Button
            onClick={handleGenerateWorkplan}
            disabled={!proposalId}
            className="mx-auto"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Generate Workplan
          </Button>
        </div>
      </Card>
    );
  }

  if (generating) {
    return (
      <Card className="text-center p-12">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Generating Workplan...
        </h3>
        <p className="text-gray-600">
          Creating work packages, activities, and timelines based on your proposal.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Workplan</h2>
          <p className="text-gray-600 mt-1">
            {workplan?.metadata?.total_work_packages} Work Packages •
            {workplan?.metadata?.total_deliverables} Deliverables •
            {workplan?.metadata?.total_duration_months} Months
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateWorkplan}
            disabled={generating}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          {editMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setEditedWorkplan(workplan);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveWorkplan}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setEditMode(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'allocation', 'milestones'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm",
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab === 'overview' && 'Work Packages'}
              {tab === 'allocation' && 'Partner Allocation'}
              {tab === 'milestones' && 'Milestones'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div>
            {workplan?.work_packages?.map(wp => renderWorkPackage(wp))}
          </div>
        )}
        {activeTab === 'allocation' && renderPartnerAllocation()}
        {activeTab === 'milestones' && renderMilestones()}
      </div>
    </div>
  );
};

export default WorkplanViewer;