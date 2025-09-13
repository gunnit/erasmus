import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const ProgressiveGenerationModal = ({ 
  projectData, 
  isOpen, 
  onClose, 
  onComplete,
  useProgressive = true 
}) => {
  const [sessionId, setSessionId] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [completedSections, setCompletedSections] = useState([]);
  const [failedSections, setFailedSections] = useState([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const eventSourceRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen && projectData) {
      if (useProgressive) {
        startProgressiveGeneration();
      } else {
        generateAllAtOnce();
      }
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, projectData, useProgressive]);

  const startProgressiveGeneration = async () => {
    try {
      setStatus('starting');
      setError(null);
      
      // Start generation session
      const response = await api.startProgressiveGeneration(projectData);
      setSessionId(response.session_id);
      
      // Start streaming progress
      eventSourceRef.current = api.streamProgress(
        response.session_id,
        handleProgressUpdate,
        handleStreamError
      );
      
      setStatus('in_progress');
    } catch (error) {
      console.error('Failed to start generation:', error);
      setError('Failed to start generation. Please try again.');
      setStatus('failed');
    }
  };

  const generateAllAtOnce = async () => {
    try {
      setStatus('in_progress');
      setError(null);
      setProgress(10);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 2000);
      
      const response = await api.generateAnswers(projectData);
      
      clearInterval(progressInterval);
      setProgress(100);
      setAnswers(response.sections || {});
      setCompletedSections(SECTIONS.map(s => s.key));
      setStatus('completed');
      
      if (onComplete) {
        onComplete(response);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Generation failed. Please try again.');
      setStatus('failed');
    }
  };

  const handleProgressUpdate = (data) => {
    if (data.error) {
      setError(data.error);
      setStatus('failed');
      return;
    }

    setCurrentSection(data.current_section);
    setCompletedSections(data.completed_sections || []);
    setProgress(data.progress_percentage || 0);
    setStatus(data.status);
    setError(data.error_message);

    if (data.status === 'completed') {
      fetchCompleteAnswers();
    }
  };

  const handleStreamError = (error) => {
    console.error('Stream error:', error);

    // Don't treat as error if generation is already complete
    if (status === 'completed' || status === 'failed') {
      return;
    }

    // Close the current event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Try to fetch status via polling as fallback
    if (sessionId && status === 'in_progress') {
      console.log('SSE connection lost, switching to polling...');
      pollForStatus();
    }
  };

  const pollForStatus = async () => {
    if (!sessionId) return;

    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.getGenerationStatus(sessionId);
        handleProgressUpdate(response);

        if (response.status === 'completed' || response.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } catch (error) {
        console.error('Poll error:', error);
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        // Don't set error state here, just stop polling
      }
    }, 2000);
  };

  const fetchCompleteAnswers = async () => {
    if (!sessionId) return;

    try {
      const response = await api.getGenerationStatus(sessionId);
      setAnswers(response.answers);
      
      if (onComplete) {
        onComplete({
          sections: response.answers,
          session_id: sessionId
        });
      }
    } catch (error) {
      console.error('Failed to fetch complete answers:', error);
    }
  };

  const retrySection = async (sectionKey) => {
    if (!sessionId) return;

    try {
      setFailedSections(prev => prev.filter(s => s !== sectionKey));
      const response = await api.generateSection(sessionId, sectionKey, true);
      
      if (response.status === 'success') {
        setCompletedSections(prev => [...prev, sectionKey]);
        setAnswers(prev => ({
          ...prev,
          [sectionKey]: response.answers
        }));
      }
    } catch (error) {
      console.error('Retry failed:', error);
      setFailedSections(prev => [...prev, sectionKey]);
    }
  };

  const cancelGeneration = async () => {
    if (sessionId) {
      try {
        await api.cancelGeneration(sessionId);
      } catch (error) {
        console.error('Failed to cancel:', error);
      }
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    onClose();
  };

  const getSectionStatus = (sectionKey) => {
    if (completedSections.includes(sectionKey)) return 'completed';
    if (failedSections.includes(sectionKey)) return 'failed';
    if (currentSection === sectionKey) return 'in_progress';
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
                {useProgressive ? 'Generating Application (Progressive)' : 'Generating Application'}
              </h2>
              {status !== 'completed' && (
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
                  <span className="text-sm text-gray-500">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Section Progress */}
              {useProgressive && (
                <div className="space-y-3">
                  {SECTIONS.map((section, index) => {
                    const Icon = section.icon;
                    const sectionStatus = getSectionStatus(section.key);
                    
                    return (
                      <div
                        key={section.key}
                        className={`p-4 rounded-lg border transition-all ${
                          sectionStatus === 'completed' 
                            ? 'bg-green-50 border-green-200'
                            : sectionStatus === 'in_progress'
                            ? 'bg-blue-50 border-blue-200'
                            : sectionStatus === 'failed'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              sectionStatus === 'completed' 
                                ? 'bg-green-100'
                                : sectionStatus === 'in_progress'
                                ? 'bg-blue-100'
                                : sectionStatus === 'failed'
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
                            {sectionStatus === 'completed' && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {sectionStatus === 'in_progress' && (
                              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                            )}
                            {sectionStatus === 'failed' && (
                              <>
                                <XCircle className="h-5 w-5 text-red-500" />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => retrySection(section.key)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {sectionStatus === 'pending' && (
                              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

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
              {status === 'completed' && (
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
              {status === 'completed' ? (
                <Button onClick={onClose}>
                  Continue to Review
                </Button>
              ) : status === 'failed' ? (
                <>
                  <Button variant="outline" onClick={cancelGeneration}>
                    Cancel
                  </Button>
                  <Button onClick={startProgressiveGeneration}>
                    Retry All
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={cancelGeneration}>
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

export default ProgressiveGenerationModal;