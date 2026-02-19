import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Loader2, CheckCircle, AlertCircle, XCircle,
  RefreshCw, X, FileText, Target, Users,
  TrendingUp, Settings, Briefcase
} from 'lucide-react';
import api from '../services/api';
import { Button } from './ui/Button';

const SECTIONS = [
  { key: 'project_summary', name: 'Project Summary', icon: FileText, questions: 3 },
  { key: 'relevance', name: 'Relevance', icon: Target, questions: 6 },
  { key: 'needs_analysis', name: 'Needs Analysis', icon: Users, questions: 4 },
  { key: 'partnership', name: 'Partnership', icon: Briefcase, questions: 3 },
  { key: 'impact', name: 'Impact', icon: TrendingUp, questions: 4 },
  { key: 'project_management', name: 'Project Management', icon: Settings, questions: 7 }
];

const SimpleGenerationModal = ({
  projectData,
  isOpen,
  onClose,
  onComplete,
  onSectionComplete // Called after each section completes for auto-save
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [completedSections, setCompletedSections] = useState([]);
  const [failedSections, setFailedSections] = useState([]);
  const [sectionAnswers, setSectionAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [sectionStartTime, setSectionStartTime] = useState(null);
  const [generationStartTime, setGenerationStartTime] = useState(null);

  // Force re-render every 2 seconds to update progress bar smoothly during generation
  const [, setTick] = useState(0);
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => setTick(t => t + 1), 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  useEffect(() => {
    if (isOpen && projectData && currentSectionIndex === -1) {
      // Start generation when modal opens
      startGeneration();
    }
  }, [isOpen, projectData]);

  const startGeneration = async () => {
    console.log('Starting section-by-section generation');
    setCurrentSectionIndex(0);
    setCompletedSections([]);
    setFailedSections([]);
    setSectionAnswers({});
    setError(null);
    setIsCancelled(false);
    setGenerationStartTime(Date.now());
    setSectionStartTime(Date.now());

    // Start generating first section
    generateNextSection(0, {});
  };

  const generateNextSection = async (sectionIndex, previousAnswers) => {
    if (isCancelled || sectionIndex >= SECTIONS.length) {
      return;
    }

    const section = SECTIONS[sectionIndex];
    console.log(`Generating section ${sectionIndex + 1}/${SECTIONS.length}: ${section.name}`);

    setCurrentSectionIndex(sectionIndex);
    setIsGenerating(true);
    setError(null);
    setSectionStartTime(Date.now());

    try {
      // Generate this section
      const response = await api.generateSection(
        section.key,
        projectData,
        previousAnswers
      );

      if (response.success && response.answers) {
        console.log(`Section ${section.name} generated successfully with ${Object.keys(response.answers).length} answers`);

        // Add to completed sections
        setCompletedSections(prev => [...prev, section.key]);

        // Store answers
        const updatedAnswers = { ...previousAnswers, [section.key]: response.answers };
        setSectionAnswers(updatedAnswers);

        // Auto-save after each section if callback provided
        if (onSectionComplete) {
          console.log(`Auto-saving section ${section.name}`);
          await onSectionComplete(section.key, response.answers, updatedAnswers);
        }

        // Check if we're done
        if (sectionIndex === SECTIONS.length - 1) {
          // All sections complete!
          console.log('All sections generated successfully');
          handleCompletion(updatedAnswers);
        } else {
          // Continue to next section
          setTimeout(() => {
            generateNextSection(sectionIndex + 1, updatedAnswers);
          }, 500); // Small delay between sections
        }
      } else {
        throw new Error(response.error || `Failed to generate section ${section.name}`);
      }
    } catch (error) {
      console.error(`Error generating section ${section.name}:`, error);
      setFailedSections(prev => [...prev, section.key]);
      setError(`Failed to generate ${section.name}: ${error.message}`);
      setIsGenerating(false);

      // Don't continue to next section on failure
      toast.error(`Failed to generate ${section.name}. You can retry this section.`);
    }
  };

  const retrySection = async (sectionIndex) => {
    const section = SECTIONS[sectionIndex];
    console.log(`Retrying section ${section.name}`);

    // Remove from failed sections
    setFailedSections(prev => prev.filter(s => s !== section.key));

    // Get all previous answers up to this point
    const previousAnswers = {};
    for (let i = 0; i < sectionIndex; i++) {
      const prevSection = SECTIONS[i];
      if (sectionAnswers[prevSection.key]) {
        previousAnswers[prevSection.key] = sectionAnswers[prevSection.key];
      }
    }

    // Retry generation from this section
    generateNextSection(sectionIndex, previousAnswers);
  };

  const handleCompletion = (allAnswers) => {
    setIsGenerating(false);

    // Format the response to match expected structure
    const formattedResponse = {
      sections: allAnswers,
      answers: allAnswers,
      success: true
    };

    console.log('Generation complete, calling onComplete with:', formattedResponse);

    if (onComplete) {
      onComplete(formattedResponse);
    }

    toast.success('All sections generated successfully!');
  };

  const cancelGeneration = () => {
    console.log('Cancelling generation');
    setIsCancelled(true);
    setIsGenerating(false);
    onClose();
  };

  const getProgress = () => {
    const completed = completedSections.length;
    const total = SECTIONS.length;
    // When generating, add partial progress for the current section
    if (isGenerating && currentSectionIndex >= 0 && currentSectionIndex < total) {
      const baseProgress = (completed / total) * 100;
      const sectionProgress = sectionStartTime ? Math.min(((Date.now() - sectionStartTime) / 30000) * (100 / total), (100 / total) * 0.9) : 0;
      return Math.round(baseProgress + sectionProgress);
    }
    return Math.round((completed / total) * 100);
  };

  const getTimeEstimate = () => {
    const completed = completedSections.length;
    if (completed === 0 || !generationStartTime) {
      // Default estimate: ~30 seconds per section
      const remainingSections = SECTIONS.length - completed;
      return Math.ceil((remainingSections * 30) / 60);
    }
    const elapsed = (Date.now() - generationStartTime) / 1000; // seconds
    const avgTimePerSection = elapsed / completed;
    const remainingSections = SECTIONS.length - completed - (isGenerating ? 0 : 0);
    const remainingSeconds = remainingSections * avgTimePerSection;
    if (remainingSeconds < 60) return 'less than 1';
    return Math.ceil(remainingSeconds / 60);
  };

  const getSectionStatus = (sectionIndex) => {
    const section = SECTIONS[sectionIndex];
    if (completedSections.includes(section.key)) return 'completed';
    if (failedSections.includes(section.key)) return 'failed';
    if (currentSectionIndex === sectionIndex && isGenerating) return 'in_progress';
    return 'pending';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Generating Application
              </h2>
              {!completedSections.includes(SECTIONS[SECTIONS.length - 1].key) && (
                <button
                  onClick={cancelGeneration}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Overall Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-500">{getProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgress()}%` }}
                  />
                </div>
                {isGenerating && currentSectionIndex >= 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-blue-600 font-medium">
                      Generating section {currentSectionIndex + 1} of {SECTIONS.length}: {SECTIONS[currentSectionIndex]?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      Estimated time remaining: ~{getTimeEstimate()} minute{getTimeEstimate() !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {completedSections.length === SECTIONS.length && (
                  <p className="text-xs text-green-600 font-medium mt-2">All sections complete!</p>
                )}
              </div>

              {/* Section Progress */}
              <div className="space-y-3">
                {SECTIONS.map((section, index) => {
                  const Icon = section.icon;
                  const status = getSectionStatus(index);

                  return (
                    <div
                      key={section.key}
                      className={`p-4 rounded-lg border transition-all ${
                        status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : status === 'in_progress'
                          ? 'bg-blue-50 border-blue-200 animate-pulse'
                          : status === 'failed'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            status === 'completed'
                              ? 'bg-green-100'
                              : status === 'in_progress'
                              ? 'bg-blue-100'
                              : status === 'failed'
                              ? 'bg-red-100'
                              : 'bg-gray-100'
                          }`}>
                            <Icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{section.name}</h3>
                            <p className="text-sm text-gray-500">{section.questions} questions</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {status === 'completed' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {status === 'in_progress' && (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          )}
                          {status === 'failed' && (
                            <>
                              <XCircle className="h-5 w-5 text-red-500" />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retrySection(index)}
                                disabled={isGenerating}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {status === 'pending' && (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">Generation Error</h4>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {completedSections.length === SECTIONS.length && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900">Generation Complete!</h4>
                      <p className="text-sm text-green-700 mt-1">
                        All {SECTIONS.length} sections have been successfully generated.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              {completedSections.length === SECTIONS.length ? (
                <Button onClick={onClose}>
                  Continue to Review
                </Button>
              ) : failedSections.length > 0 && !isGenerating ? (
                <>
                  <Button variant="outline" onClick={cancelGeneration}>
                    Cancel
                  </Button>
                  <Button onClick={startGeneration}>
                    Restart All
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={cancelGeneration} disabled={!isGenerating}>
                  Cancel Generation
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SimpleGenerationModal;