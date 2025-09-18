import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FileText, ChevronDown, ChevronUp, Copy, Edit3, Save, X,
  Download, ArrowLeft, CheckCircle, AlertCircle, Info,
  Sparkles, Target, Users, Building2, TrendingUp, Globe,
  FileDown, Eye, Maximize2, Minimize2
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { cn } from '../lib/utils';
import MarkdownRenderer from './ui/MarkdownRenderer';

const SECTION_ICONS = {
  project_summary: FileText,
  relevance: Target,
  needs_analysis: Users,
  partnership: Building2,
  impact: TrendingUp,
  project_management: Globe
};

const SECTION_COLORS = {
  project_summary: 'from-blue-500 to-indigo-500',
  relevance: 'from-purple-500 to-pink-500',
  needs_analysis: 'from-green-500 to-emerald-500',
  partnership: 'from-orange-500 to-red-500',
  impact: 'from-teal-500 to-cyan-500',
  project_management: 'from-yellow-500 to-amber-500'
};

const AnswerReview = ({ answers, projectData, onEdit, onExport }) => {
  const [editingField, setEditingField] = useState(null);
  const [editedAnswers, setEditedAnswers] = useState({});
  const [expandedSections, setExpandedSections] = useState([]);
  const [fullscreenAnswer, setFullscreenAnswer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    // Initialize edited answers from the response
    if (answers) {
      if (answers.answers) {
        // If answers are in a flat structure
        const formattedAnswers = formatAnswersIntoSections(answers.answers);
        setEditedAnswers(formattedAnswers);
        setExpandedSections(Object.keys(formattedAnswers));
      } else if (answers.sections) {
        // If answers are already in sections
        setEditedAnswers(answers.sections);
        setExpandedSections(Object.keys(answers.sections));
      }
    }
  }, [answers]);

  const formatAnswersIntoSections = (flatAnswers) => {
    // Group answers by section based on question IDs
    const sections = {
      project_summary: [],
      relevance: [],
      needs_analysis: [],
      partnership: [],
      impact: [],
      project_management: []
    };

    // Define which questions belong to which section
    const questionSectionMap = {
      'title': 'project_summary',
      'acronym': 'project_summary',
      'summary': 'project_summary',
      'priorities_explanation': 'relevance',
      'topic_relevance': 'relevance',
      'objectives': 'relevance',
      'innovative_aspects': 'relevance',
      'expected_results': 'relevance',
      'horizontal_priorities': 'relevance',
      'target_groups': 'needs_analysis',
      'needs_identification': 'needs_analysis',
      'target_involvement': 'needs_analysis',
      'accessibility': 'needs_analysis',
      'partner_relevance': 'partnership',
      'partner_distribution': 'partnership',
      'new_partners': 'partnership',
      'project_impact': 'impact',
      'skills_development': 'impact',
      'sustainability': 'impact',
      'dissemination': 'impact',
      'implementation_plan': 'project_management',
      'methodology': 'project_management',
      'budget_allocation': 'project_management',
      'risk_management': 'project_management',
      'quality_assurance': 'project_management',
      'evaluation': 'project_management',
      'horizontal_aspects': 'project_management'
    };

    // Process each answer
    Object.entries(flatAnswers).forEach(([questionId, answerData]) => {
      const section = questionSectionMap[questionId] || 'project_summary';
      
      // Format the answer object
      const formattedAnswer = {
        question_id: questionId,
        field: questionId,
        answer: typeof answerData === 'string' ? answerData : answerData.answer || '',
        character_count: typeof answerData === 'string' 
          ? answerData.length 
          : (answerData.answer || '').length,
        character_limit: answerData.character_limit || 3000,
        quality_score: answerData.quality_score || 85
      };

      sections[section].push(formattedAnswer);
    });

    // Remove empty sections
    Object.keys(sections).forEach(key => {
      if (sections[key].length === 0) {
        delete sections[key];
      }
    });

    return sections;
  };

  const handleAnswerEdit = (sectionKey, fieldIndex, newAnswer) => {
    const newSections = { ...editedAnswers };
    if (newSections[sectionKey] && newSections[sectionKey][fieldIndex]) {
      newSections[sectionKey][fieldIndex].answer = newAnswer;
      newSections[sectionKey][fieldIndex].character_count = newAnswer.length;
      setEditedAnswers(newSections);
    }
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => 
      prev.includes(sectionKey) 
        ? prev.filter(s => s !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const toggleAllSections = () => {
    if (expandedSections.length === Object.keys(editedAnswers).length) {
      setExpandedSections([]);
    } else {
      setExpandedSections(Object.keys(editedAnswers));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const copyAllAnswers = () => {
    let allText = '';
    Object.entries(editedAnswers).forEach(([section, answers]) => {
      allText += `\n=== ${getSectionTitle(section)} ===\n\n`;
      answers.forEach(answer => {
        allText += `${getFieldLabel(answer.field)}:\n${answer.answer}\n\n`;
      });
    });
    navigator.clipboard.writeText(allText);
    toast.success('All answers copied to clipboard!');
  };

  const getSectionTitle = (sectionKey) => {
    const titles = {
      project_summary: 'Project Summary',
      relevance: 'Relevance of the Project',
      needs_analysis: 'Needs Analysis',
      partnership: 'Partnership & Cooperation',
      impact: 'Impact',
      project_management: 'Project Management'
    };
    return titles[sectionKey] || sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFieldLabel = (field) => {
    const labels = {
      title: 'Project Title',
      acronym: 'Project Acronym',
      summary: 'Project Summary',
      priorities_explanation: 'Priorities Explanation',
      topic_relevance: 'Topic Relevance',
      objectives: 'Project Objectives',
      innovative_aspects: 'Innovative Aspects',
      expected_results: 'Expected Results',
      horizontal_priorities: 'Horizontal Priorities',
      target_groups: 'Target Groups',
      needs_identification: 'Needs Identification',
      target_involvement: 'Target Group Involvement',
      accessibility: 'Accessibility Measures',
      partner_relevance: 'Partner Relevance',
      partner_distribution: 'Task Distribution',
      new_partners: 'New Partnerships',
      project_impact: 'Project Impact',
      skills_development: 'Skills Development',
      sustainability: 'Sustainability Plan',
      dissemination: 'Dissemination Strategy',
      implementation_plan: 'Implementation Plan',
      methodology: 'Methodology',
      budget_allocation: 'Budget Allocation',
      risk_management: 'Risk Management',
      quality_assurance: 'Quality Assurance',
      evaluation: 'Evaluation Methods',
      horizontal_aspects: 'Horizontal Aspects'
    };
    return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const calculateTotalWords = () => {
    let totalWords = 0;
    Object.values(editedAnswers).forEach(section => {
      section.forEach(answer => {
        totalWords += (answer.answer || '').split(/\s+/).length;
      });
    });
    return totalWords;
  };

  const calculateCompleteness = () => {
    let filled = 0;
    let total = 0;
    Object.values(editedAnswers).forEach(section => {
      section.forEach(answer => {
        total++;
        if (answer.answer && answer.answer.trim().length > 50) {
          filled++;
        }
      });
    });
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  const exportToJSON = () => {
    const exportData = {
      application_id: answers?.application_id,
      project_data: projectData,
      answers: editedAnswers,
      metadata: {
        generated_at: answers?.generated_at || new Date().toISOString(),
        estimated_score: answers?.estimated_score || calculateCompleteness(),
        total_words: calculateTotalWords()
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erasmus-application-${answers?.application_id || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Application exported as JSON');
  };

  if (!editedAnswers || Object.keys(editedAnswers).length === 0) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">No answers generated yet</h3>
        <p className="text-gray-600 mt-2">The AI is still processing your application.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Application Review
          </h2>
          <p className="mt-1 text-gray-600">
            Review and edit your AI-generated answers
          </p>
          {answers?.application_id && (
            <p className="text-sm text-gray-500 mt-1">
              Application ID: {answers.application_id}
            </p>
          )}
        </div>
        
        {/* Stats Card */}
        {showStats && (
          <Card className="w-full lg:w-auto">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={cn("text-2xl font-bold", getScoreColor(answers?.estimated_score || calculateCompleteness()))}>
                    {answers?.estimated_score || calculateCompleteness()}%
                  </div>
                  <p className="text-xs text-gray-600">Score</p>
                </div>
                <div className="text-center border-l border-r border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">
                    {Object.keys(editedAnswers).length}
                  </div>
                  <p className="text-xs text-gray-600">Sections</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {calculateTotalWords()}
                  </div>
                  <p className="text-xs text-gray-600">Words</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleAllSections}
                variant="outline"
                size="sm"
                icon={expandedSections.length === Object.keys(editedAnswers).length ? Minimize2 : Maximize2}
              >
                {expandedSections.length === Object.keys(editedAnswers).length ? 'Collapse All' : 'Expand All'}
              </Button>
              <Button
                onClick={copyAllAnswers}
                variant="outline"
                size="sm"
                icon={Copy}
              >
                Copy All
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        {Object.entries(editedAnswers).map(([sectionKey, sectionAnswers], sectionIndex) => {
          const SectionIcon = SECTION_ICONS[sectionKey] || FileText;
          const isExpanded = expandedSections.includes(sectionKey);
          
          return (
            <motion.div
              key={sectionKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <Card className="overflow-hidden">
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn("p-2 rounded-lg bg-gradient-to-r", SECTION_COLORS[sectionKey])}>
                      <SectionIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {getSectionTitle(sectionKey)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {sectionAnswers.length} questions answered
                      </p>
                    </div>
                  </div>
                  
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="p-6 space-y-6">
                        {sectionAnswers.map((answer, index) => {
                          const isEditing = editingField === `${sectionKey}-${index}`;
                          const isOverLimit = answer.character_count > answer.character_limit;
                          
                          // Filter by search term
                          if (searchTerm && !answer.answer.toLowerCase().includes(searchTerm.toLowerCase())) {
                            return null;
                          }
                          
                          return (
                            <motion.div
                              key={answer.question_id || index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="relative"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                              
                              <div className="pl-6">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-lg">
                                      {getFieldLabel(answer.field)}
                                    </h4>
                                    {answer.quality_score && (
                                      <div className="flex items-center mt-1 space-x-2">
                                        <Progress 
                                          value={answer.quality_score} 
                                          max={100} 
                                          size="sm" 
                                          variant={answer.quality_score >= 80 ? "success" : "warning"}
                                          className="w-24"
                                        />
                                        <span className="text-xs text-gray-600">
                                          Quality: {answer.quality_score}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    <span className={cn(
                                      "text-sm font-medium",
                                      isOverLimit ? "text-red-600" : "text-gray-500"
                                    )}>
                                      {answer.character_count}/{answer.character_limit} chars
                                    </span>
                                    
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => copyToClipboard(answer.answer)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Copy"
                                      >
                                        <Copy className="w-4 h-4 text-gray-600" />
                                      </button>
                                      
                                      <button
                                        onClick={() => setFullscreenAnswer(answer)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Fullscreen"
                                      >
                                        <Maximize2 className="w-4 h-4 text-gray-600" />
                                      </button>
                                      
                                      {!isEditing && (
                                        <button
                                          onClick={() => setEditingField(`${sectionKey}-${index}`)}
                                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                          title="Edit"
                                        >
                                          <Edit3 className="w-4 h-4 text-gray-600" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <textarea
                                      value={answer.answer}
                                      onChange={(e) => handleAnswerEdit(sectionKey, index, e.target.value)}
                                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                      rows={8}
                                    />
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        onClick={() => setEditingField(null)}
                                        variant="outline"
                                        size="sm"
                                        icon={X}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setEditingField(null);
                                          toast.success('Answer updated');
                                        }}
                                        variant="default"
                                        size="sm"
                                        icon={Save}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                                    <MarkdownRenderer content={answer.answer} />
                                    {isOverLimit && (
                                      <div className="mt-2 flex items-center text-red-600 text-sm">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        Exceeds character limit by {answer.character_count - answer.character_limit} characters
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Review Checklist */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
            Quality Review Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700">All answers within character limits</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700">EU priorities clearly addressed</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700">Budget justification provided</span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700">Partner roles defined</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700">Impact measures included</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700">Sustainability plan complete</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button
          onClick={onEdit}
          variant="outline"
          icon={ArrowLeft}
        >
          Back to Project Details
        </Button>
        
        <div className="flex space-x-3">
          <Button
            onClick={exportToJSON}
            variant="secondary"
            icon={FileDown}
          >
            Export JSON
          </Button>
          
          <Button
            onClick={onExport}
            variant="default"
            icon={Download}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Export to PDF
          </Button>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {fullscreenAnswer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setFullscreenAnswer(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {getFieldLabel(fullscreenAnswer.field)}
                </h3>
                <button
                  onClick={() => setFullscreenAnswer(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {fullscreenAnswer.answer}
                </p>
              </div>
              <div className="mt-6 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {fullscreenAnswer.character_count}/{fullscreenAnswer.character_limit} characters
                </span>
                <Button
                  onClick={() => {
                    copyToClipboard(fullscreenAnswer.answer);
                    setFullscreenAnswer(null);
                  }}
                  variant="default"
                  icon={Copy}
                >
                  Copy & Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnswerReview;