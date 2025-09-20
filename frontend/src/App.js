import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard.jsx';
import LandingPage from './components/LandingPage.jsx';
import HomeRouter from './components/HomeRouter.jsx';
import ProposalDetail from './components/ProposalDetail';
import ProposalDetailNew from './components/ProposalDetailNew';
import ProposalAnswers from './components/ProposalAnswers';
import ProposalEdit from './components/ProposalEdit';
import ProjectInputForm from './components/ProjectInputForm.jsx';
import AnswerReview from './components/AnswerReview.jsx';
import ProgressiveGenerationModal from './components/ProgressiveGenerationModal';
import SimpleGenerationModal from './components/SimpleGenerationModal';
import { Layout } from './components/layout/Layout';
import ProposalsList from './components/ProposalsList.jsx';
import Analytics from './components/Analytics.jsx';
import Settings from './components/Settings.jsx';
import Profile from './components/Profile.jsx';
import ErasmusResources from './components/ErasmusResources.jsx';
import PricingPlans from './components/PricingPlans.jsx';
import PaymentCheckout from './components/PaymentCheckout.jsx';
import PaymentSuccess from './components/PaymentSuccess.jsx';
import { Partners } from './components/Partners.jsx';
import { Progress, CircularProgress } from './components/ui/Progress';
import { Card, CardContent } from './components/ui/Card';
import { Sparkles, CheckCircle, FileText, Rocket } from 'lucide-react';
import api from './services/api';
import './App.css';
import { fadeInVariants, staggerContainer } from './lib/utils';

function ProposalCreator() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('input');
  const [projectData, setProjectData] = useState(null);
  const [generatedAnswers, setGeneratedAnswers] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [useProgressiveGeneration, setUseProgressiveGeneration] = useState(true);
  const [useSimpleGeneration, setUseSimpleGeneration] = useState(true); // Use simple generation by default
  const [proposalId, setProposalId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [isCreatingProposal, setIsCreatingProposal] = useState(false); // Prevent duplicate creation
  const [currentProposalIdForGeneration, setCurrentProposalIdForGeneration] = useState(null);

  const steps = [
    { id: 'input', name: 'Project Details', icon: FileText },
    { id: 'generating', name: 'AI Generation', icon: Sparkles },
    { id: 'review', name: 'Review & Export', icon: CheckCircle }
  ];

  // Remove automatic proposal creation - proposals should be created explicitly
  // when the form is submitted, not on component mount

  // Auto-save function
  const handleAutoSave = async (proposalId, data) => {
    if (!proposalId) {
      console.warn('Cannot auto-save: no proposal ID');
      return;
    }

    try {
      setSaveStatus('saving');
      console.log('Auto-saving proposal:', proposalId, data);

      const updateData = {
        title: data.title || 'Untitled Proposal',
        project_idea: data.project_idea || '',
        priorities: data.selected_priorities || [],
        target_groups: Array.isArray(data.target_groups) ? data.target_groups : [data.target_groups || ''],
        partners: data.partner_organizations || [],
        duration_months: parseInt(data.duration_months) || 24,
        budget: String(data.budget_eur || 250000),
        status: 'draft'
      };

      await api.updateProposal(proposalId, updateData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleProjectSubmit = async (data) => {
    setProjectData(data);

    // First, create a proposal if we don't have one
    let currentProposalId = proposalId;
    if (!currentProposalId && !isCreatingProposal) {
      try {
        setIsCreatingProposal(true);
        console.log('Creating proposal with data:', data);
        const proposalData = {
          title: data.title || 'Untitled Proposal',
          project_idea: data.project_idea || '',
          priorities: data.selected_priorities || [],
          target_groups: Array.isArray(data.target_groups) ? data.target_groups : [data.target_groups || ''],
          partners: data.partner_organizations || [],
          duration_months: parseInt(data.duration_months) || 24,
          budget: String(data.budget_eur || 250000),
          status: 'draft',
          answers: {}, // Initialize with empty answers
          // Store full project data for later question generation
          metadata: {
            lead_organization: data.lead_organization,
            project_full_data: data
          }
        };

        const newProposal = await api.createProposal(proposalData);
        console.log('Proposal created:', newProposal);
        currentProposalId = newProposal.id;
        setProposalId(newProposal.id);
        setIsCreatingProposal(false);

        toast.success('Proposal created successfully!');
        // Navigate directly to the proposal detail page
        navigate(`/proposals/${currentProposalId}`);
        return;
      } catch (error) {
        console.error('Failed to create proposal:', error);
        setIsCreatingProposal(false);
        toast.error('Failed to create proposal. Please try again.');
        return;
      }
    }

    // If we already have a proposal, just redirect to it
    if (currentProposalId) {
      navigate(`/proposals/${currentProposalId}`);
    }
  };

  const handleSectionComplete = async (sectionKey, sectionAnswers, allAnswers) => {
    console.log(`Section ${sectionKey} completed, auto-saving...`);

    // Use the proposal ID that was set during generation start
    const idToUse = currentProposalIdForGeneration || proposalId;

    if (idToUse) {
      try {
        setSaveStatus('saving');
        // Only send the fields that need updating to avoid validation errors
        const updateData = {
          answers: allAnswers,
          status: 'generating'
        };

        await api.updateProposal(idToUse, updateData);
        setSaveStatus('saved');
        console.log(`Auto-saved section ${sectionKey} to proposal ${idToUse}`);
      } catch (error) {
        console.error(`Failed to auto-save section ${sectionKey}:`, error);
        setSaveStatus('error');
        // Don't throw - let generation continue even if auto-save fails
      }
    } else {
      console.warn(`No proposal ID available for auto-save of section ${sectionKey}`);
    }
  };

  const handleProgressiveGenerationComplete = async (response) => {
    console.log('handleProgressiveGenerationComplete called with response:', response);

    // Validate response structure
    if (!response) {
      console.error('No response received from generation');
      toast.error('Generation completed but no data received');
      return;
    }

    // Extract answers from response - handle different formats
    const answers = response.sections || response.answers || response;
    console.log('Extracted answers:', answers);

    if (!answers || Object.keys(answers).length === 0) {
      console.error('No answers found in response');
      toast.error('Generation completed but no answers were generated');
      return;
    }

    // Update state with generated answers
    setGeneratedAnswers(response);
    setShowGenerationModal(false);
    setCurrentStep('review');

    // Use the proposal ID that was set during generation start
    let currentProposalId = currentProposalIdForGeneration || proposalId;
    if (!currentProposalId && !isCreatingProposal) {
      try {
        setIsCreatingProposal(true);
        console.log('Creating proposal after generation...');
        const proposalData = {
          title: projectData?.title || 'Untitled Proposal',
          project_idea: projectData?.project_idea || '',
          priorities: projectData?.selected_priorities || [],
          target_groups: Array.isArray(projectData?.target_groups) ? projectData.target_groups : [projectData?.target_groups || ''],
          partners: projectData?.partner_organizations || [],
          duration_months: parseInt(projectData?.duration_months) || 24,
          budget: String(projectData?.budget_eur || 250000),
          answers: answers,
          status: 'generated'
        };

        const newProposal = await api.createProposal(proposalData);
        console.log('Proposal created after generation:', newProposal);
        currentProposalId = newProposal.id;
        setProposalId(newProposal.id);
        setIsCreatingProposal(false);
        toast.success('Application generated and saved successfully!');
      } catch (error) {
        console.error('Failed to create proposal:', error);
        setIsCreatingProposal(false);
        toast.error('Failed to save proposal. Please try again.');
        return;
      }
    } else if (currentProposalId) {
      // Update existing proposal with generated answers
      try {
        setSaveStatus('saving');
        console.log('Updating proposal with generated answers:', currentProposalId);

        const updateData = {
          ...projectData,
          answers: answers,
          status: 'generated'
        };

        const result = await api.updateProposal(currentProposalId, updateData);
        console.log('Proposal updated with answers:', result);
        setSaveStatus('saved');
        toast.success('Application generated and saved successfully!');
      } catch (error) {
        console.error('Error updating proposal with answers:', error);
        setSaveStatus('error');
        toast.error('Failed to save generated answers');
      }
    }
  };

  const handleEdit = () => {
    setCurrentStep('input');
  };

  const handleExport = async () => {
    if (generatedAnswers) {
      await api.exportToPDF(generatedAnswers.application_id);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50"
    >
      {/* Hero Header */}
      <motion.header 
        variants={fadeInVariants}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
      >
        <div className="absolute inset-0 bg-mesh-gradient opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-3 mb-4"
            >
              <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">
                Erasmus+ AI Assistant
              </h1>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-blue-100"
            >
              Complete your KA220-ADU application with AI-powered precision
            </motion.p>
          </div>
        </div>
        
        {/* Animated background shapes */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500 rounded-full opacity-10 animate-float" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-indigo-500 rounded-full opacity-10 animate-float" style={{ animationDelay: '2s' }} />
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <motion.div 
          variants={fadeInVariants}
          className="mb-12"
        >
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute left-0 top-1/2 h-1 bg-gray-200 w-full -translate-y-1/2" />
            <motion.div 
              className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 -translate-y-1/2"
              initial={{ width: '0%' }}
              animate={{ 
                width: currentStep === 'input' ? '0%' : 
                       currentStep === 'generating' ? '50%' : '100%' 
              }}
              transition={{ duration: 0.5 }}
            />
            
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <motion.div
                  key={step.id}
                  className="relative z-10 bg-white"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                    ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30' 
                        : isCompleted 
                        ? 'bg-green-500 shadow-lg shadow-green-500/30'
                        : 'bg-gray-200'
                    }
                  `}>
                    <Icon className={`w-8 h-8 ${
                      isActive || isCompleted ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <p className={`mt-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentStep === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl">
                <CardContent className="p-0">
                  <ProjectInputForm
                    onSubmit={handleProjectSubmit}
                    initialData={projectData}
                    onToggleProgressive={setUseProgressiveGeneration}
                    useProgressive={useProgressiveGeneration}
                    proposalId={proposalId}
                    onAutoSave={handleAutoSave}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl">
                <CardContent className="p-16">
                  <div className="text-center space-y-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-1"
                    >
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-blue-600" />
                      </div>
                    </motion.div>
                    
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        AI is Generating Your Application
                      </h2>
                      <p className="mt-3 text-lg text-gray-600">
                        Creating comprehensive, evaluation-optimized answers for all 27 questions
                      </p>
                    </div>
                    
                    <div className="max-w-md mx-auto space-y-4">
                      <Progress value={progress} max={100} size="lg" animated showLabel />
                      <div className="flex justify-around">
                        <CircularProgress value={progress} max={100} size={60} variant="default" />
                        <CircularProgress value={progress * 0.8} max={100} size={60} variant="success" />
                        <CircularProgress value={progress * 0.6} max={100} size={60} variant="purple" />
                      </div>
                    </div>
                    
                    <motion.p 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-sm text-gray-500"
                    >
                      Analyzing EU priorities • Optimizing for evaluation criteria • Ensuring consistency
                    </motion.p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'review' && generatedAnswers && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl">
                <CardContent className="p-0">
                  <AnswerReview
                    answers={generatedAnswers}
                    projectData={projectData}
                    onEdit={handleEdit}
                    onExport={handleExport}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Generation Modal - Use Simple Generation by default */}
        {useSimpleGeneration ? (
          <SimpleGenerationModal
            projectData={projectData}
            isOpen={showGenerationModal}
            onClose={() => setShowGenerationModal(false)}
            onComplete={handleProgressiveGenerationComplete}
            onSectionComplete={handleSectionComplete}
          />
        ) : (
          <ProgressiveGenerationModal
            projectData={projectData}
            isOpen={showGenerationModal}
            onClose={() => setShowGenerationModal(false)}
            onComplete={handleProgressiveGenerationComplete}
            useProgressive={useProgressiveGeneration}
          />
        )}
      </main>
    </motion.div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            className: '',
            style: {
              background: 'white',
              color: '#1f2937',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<HomeRouter />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/proposals" 
              element={
                <ProtectedRoute>
                  <ProposalsList />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/proposals/:id"
              element={
                <ProtectedRoute>
                  <ProposalDetailNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proposals/:id/answers"
              element={
                <ProtectedRoute>
                  <ProposalAnswers />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/proposals/:id/edit" 
              element={
                <ProtectedRoute>
                  <ProposalEdit />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/partners"
              element={
                <ProtectedRoute>
                  <Partners />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resources"
              element={
                <ErasmusResources />
              }
            />
            <Route
              path="/pricing"
              element={
                <PricingPlans />
              }
            />
            <Route
              path="/payment"
              element={
                <ProtectedRoute>
                  <PaymentCheckout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-cancelled"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Cancelled</h2>
                    <p className="text-gray-600 mb-6">Your payment was cancelled. No charges were made.</p>
                    <a href="/pricing" className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block">
                      Return to Pricing
                    </a>
                  </div>
                </div>
              }
            />
            <Route
              path="/new-proposal"
              element={
                <ProtectedRoute>
                  <ProposalCreator />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;