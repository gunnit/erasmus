import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import ProjectInputForm from './components/ProjectInputForm';
import AnswerReview from './components/AnswerReview';
import api from './services/api';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState('input'); // input, generating, review
  const [projectData, setProjectData] = useState(null);
  const [generatedAnswers, setGeneratedAnswers] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleProjectSubmit = async (data) => {
    setProjectData(data);
    setCurrentStep('generating');
    setIsLoading(true);

    try {
      const response = await api.generateAnswers(data);
      setGeneratedAnswers(response);
      setCurrentStep('review');
    } catch (error) {
      console.error('Error generating answers:', error);
      setCurrentStep('input');
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <header className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold">Erasmus+ Form Completion System</h1>
            <p className="mt-2 text-blue-100">Complete your KA220-ADU application in minutes</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex-1 text-center px-4 py-2 border-b-4 ${
              currentStep === 'input' ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-500'
            }`}>
              <span className="font-semibold">1. Project Details</span>
            </div>
            <div className={`flex-1 text-center px-4 py-2 border-b-4 ${
              currentStep === 'generating' ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-500'
            }`}>
              <span className="font-semibold">2. Generating</span>
            </div>
            <div className={`flex-1 text-center px-4 py-2 border-b-4 ${
              currentStep === 'review' ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-500'
            }`}>
              <span className="font-semibold">3. Review & Export</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          {currentStep === 'input' && (
            <ProjectInputForm 
              onSubmit={handleProjectSubmit}
              initialData={projectData}
            />
          )}

          {currentStep === 'generating' && (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Generating Your Application</h2>
              <p className="mt-2 text-gray-600">Our AI is crafting compelling answers for your Erasmus+ application...</p>
              <p className="mt-4 text-sm text-gray-500">This typically takes 30-60 seconds</p>
            </div>
          )}

          {currentStep === 'review' && generatedAnswers && (
            <AnswerReview
              answers={generatedAnswers}
              projectData={projectData}
              onEdit={handleEdit}
              onExport={handleExport}
            />
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900">Why Choose Our System?</h3>
          <ul className="mt-4 space-y-2 text-blue-800">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Save 40-60 hours of work
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Aligned with EU priorities and evaluation criteria
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Only €99 vs €3,000+ consultant fees
            </li>
          </ul>
        </div>
      </main>

      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-400">
            © 2025 Erasmus+ Form Completion System. Not affiliated with the European Commission.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;