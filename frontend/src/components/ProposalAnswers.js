import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, Wand2, Save, FileText, ChevronRight, Info, Users, Target, Settings, ArrowLeft } from 'lucide-react';

const SECTIONS = [
  { key: 'project_summary', title: 'Project Summary', icon: FileText },
  { key: 'relevance', title: 'Relevance', icon: ChevronRight },
  { key: 'needs_analysis', title: 'Needs Analysis', icon: Info },
  { key: 'partnership', title: 'Partnership', icon: Users },
  { key: 'impact', title: 'Impact', icon: Target },
  { key: 'project_management', title: 'Project Management', icon: Settings }
];

const ProposalAnswers = () => {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('project_summary');
  const [sectionQuestions, setSectionQuestions] = useState({});
  const [generatingQuestion, setGeneratingQuestion] = useState(null);
  const [additionalContext, setAdditionalContext] = useState({});
  const [editedAnswers, setEditedAnswers] = useState({});
  const [savingAnswer, setSavingAnswer] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchProposal();
    loadAllSectionQuestions();
    fetchSubscriptionStatus();
  }, [id]);

  const fetchProposal = async () => {
    try {
      const data = await api.getProposal(id);
      setProposal(data);
      // Initialize edited answers with existing answers
      if (data.answers) {
        setEditedAnswers(data.answers);
      }
    } catch (error) {
      toast.error('Failed to load proposal');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/payments/subscription-status');
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscriptionStatus(null);
    }
  };

  const loadAllSectionQuestions = async () => {
    try {
      const questions = {};
      for (const section of SECTIONS) {
        const sectionData = await api.getSectionQuestions(section.key);
        questions[section.key] = sectionData;
      }
      setSectionQuestions(questions);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const handleGenerateAnswer = async (sectionKey, questionId, questionField) => {
    if (!proposal) return;

    // Check subscription status first
    if (!subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0) {
      toast.error('No AI generation credits available. Please upgrade your plan.');
      navigate('/pricing');
      return;
    }

    setGeneratingQuestion(`${sectionKey}_${questionId}`);

    try {
      // Prepare project context with all necessary data
      const projectContext = {
        title: proposal.title,
        project_idea: proposal.project_idea,
        priorities: proposal.priorities || [],
        target_groups: proposal.target_groups || [],
        partners: proposal.partners || [],
        duration_months: proposal.duration_months,
        budget: proposal.budget,
        answers: editedAnswers || {},
        // Include full project data if available
        ...(proposal.metadata?.project_full_data || {})
      };

      const response = await api.generateSingleAnswer({
        proposal_id: id,
        section: sectionKey,
        question_id: questionId,
        question_field: questionField,
        additional_context: additionalContext[`${sectionKey}_${questionId}`] || '',
        project_context: projectContext
      });

      // Update the answers
      const newAnswers = {
        ...editedAnswers,
        [sectionKey]: {
          ...(editedAnswers[sectionKey] || {}),
          [questionField]: response.answer
        }
      };

      setEditedAnswers(newAnswers);

      // Auto-save the answer
      await saveAnswer(sectionKey, questionField, response.answer, newAnswers);

      toast.success(`Answer generated (${response.generation_time.toFixed(1)}s)`);
    } catch (error) {
      console.error('Failed to generate answer:', error);
      toast.error('Failed to generate answer. Please try again.');
    } finally {
      setGeneratingQuestion(null);
    }
  };

  const saveAnswer = async (sectionKey, questionField, answer, allAnswers) => {
    setSavingAnswer(`${sectionKey}_${questionField}`);
    try {
      await api.updateProposal(id, {
        answers: allAnswers
      });
      // Update local proposal state
      setProposal(prev => ({
        ...prev,
        answers: allAnswers
      }));
    } catch (error) {
      console.error('Failed to save answer:', error);
      toast.error('Failed to save answer');
    } finally {
      setSavingAnswer(null);
    }
  };

  const handleAnswerEdit = (sectionKey, questionField, newValue) => {
    const newAnswers = {
      ...editedAnswers,
      [sectionKey]: {
        ...(editedAnswers[sectionKey] || {}),
        [questionField]: newValue
      }
    };
    setEditedAnswers(newAnswers);
  };

  const handleSaveAnswer = async (sectionKey, questionField) => {
    const answer = editedAnswers[sectionKey]?.[questionField] || '';
    await saveAnswer(sectionKey, questionField, answer, editedAnswers);
    toast.success('Answer saved successfully');
  };

  const renderQuestion = (section, question) => {
    const sectionKey = section.key;
    const questionId = question.id;
    const questionField = question.field;
    const isGenerating = generatingQuestion === `${sectionKey}_${questionId}`;
    const isSaving = savingAnswer === `${sectionKey}_${questionField}`;
    const answer = editedAnswers[sectionKey]?.[questionField] || '';
    const contextKey = `${sectionKey}_${questionId}`;

    return (
      <div key={questionId} className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
        {/* Question Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-800 mb-1">
              {question.question}
            </h4>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>ID: {questionId}</span>
              <span>Limit: {question.character_limit} chars</span>
              {question.evaluation_weight && (
                <span>Weight: {question.evaluation_weight}/10</span>
              )}
              {question.required && (
                <span className="text-red-500">Required</span>
              )}
            </div>
            {question.tips && question.tips.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-1">Tips:</p>
                <ul className="text-sm text-blue-600 list-disc list-inside">
                  {question.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Answer Textarea */}
        <div className="mb-4">
          <textarea
            value={answer}
            onChange={(e) => handleAnswerEdit(sectionKey, questionField, e.target.value)}
            placeholder={answer ? '' : 'No answer generated yet. Click "Generate Answer" to create one.'}
            className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          />
          {answer && (
            <div className="mt-1 text-sm text-gray-500 text-right">
              {answer.length} / {question.character_limit} characters
            </div>
          )}
        </div>

        {/* Additional Context Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Context (Optional)
          </label>
          <input
            type="text"
            value={additionalContext[contextKey] || ''}
            onChange={(e) => setAdditionalContext(prev => ({
              ...prev,
              [contextKey]: e.target.value
            }))}
            placeholder="Add specific details to improve the generated answer..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerateAnswer(sectionKey, questionId, questionField)}
            disabled={isGenerating || isSaving || !subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={!subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0 ? 'No AI generation credits available' : ''}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : !subscriptionStatus?.has_subscription || subscriptionStatus?.proposals_remaining <= 0 ? (
              <>
                <Wand2 className="h-4 w-4" />
                No Credits
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                {answer ? 'Regenerate Answer' : 'Generate Answer'}
              </>
            )}
          </button>

          {answer && (
            <button
              onClick={() => handleSaveAnswer(sectionKey, questionField)}
              disabled={isSaving || isGenerating}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Answer
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Proposal not found</h2>
          <Link to="/dashboard" className="mt-4 text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentSectionQuestions = sectionQuestions[activeSection];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to={`/proposals/${id}`} className="mr-4 text-gray-500 hover:text-gray-700 flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Overview</span>
              </Link>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Generate and Edit Answers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                {proposal.status || 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Section Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Sections</h3>
              <nav className="space-y-1">
                {SECTIONS.map(section => {
                  const sectionAnswers = editedAnswers[section.key] || {};
                  const questions = sectionQuestions[section.key]?.questions || [];
                  const answeredCount = Object.values(sectionAnswers).filter(a => a).length;
                  const totalQuestions = questions.length;

                  return (
                    <button
                      key={section.key}
                      onClick={() => setActiveSection(section.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        activeSection === section.key
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{section.title}</span>
                        {totalQuestions > 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            answeredCount === totalQuestions
                              ? 'bg-green-100 text-green-700'
                              : answeredCount > 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {answeredCount}/{totalQuestions}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Progress Summary */}
            <div className="bg-white rounded-lg shadow p-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Overall Progress</h3>
              {(() => {
                let totalAnswered = 0;
                let totalQuestions = 0;
                SECTIONS.forEach(section => {
                  const sectionAnswers = editedAnswers[section.key] || {};
                  const questions = sectionQuestions[section.key]?.questions || [];
                  totalAnswered += Object.values(sectionAnswers).filter(a => a).length;
                  totalQuestions += questions.length;
                });
                const percentage = totalQuestions > 0 ? (totalAnswered / totalQuestions * 100).toFixed(0) : 0;

                return (
                  <>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-medium">{totalAnswered}/{totalQuestions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{percentage}% complete</p>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {SECTIONS.find(s => s.key === activeSection)?.title}
              </h2>

              {currentSectionQuestions?.questions ? (
                <div className="space-y-4">
                  {currentSectionQuestions.questions.map(question =>
                    renderQuestion(
                      SECTIONS.find(s => s.key === activeSection),
                      question
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Loading questions...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalAnswers;