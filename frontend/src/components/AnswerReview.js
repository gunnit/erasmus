import React, { useState } from 'react';
import toast from 'react-hot-toast';

const AnswerReview = ({ answers, projectData, onEdit, onExport }) => {
  const [editingField, setEditingField] = useState(null);
  const [editedAnswers, setEditedAnswers] = useState(answers.sections);
  const [expandedSections, setExpandedSections] = useState(['project_summary']);

  const handleAnswerEdit = (sectionKey, fieldIndex, newAnswer) => {
    const newSections = { ...editedAnswers };
    newSections[sectionKey][fieldIndex].answer = newAnswer;
    newSections[sectionKey][fieldIndex].character_count = newAnswer.length;
    setEditedAnswers(newSections);
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => 
      prev.includes(sectionKey) 
        ? prev.filter(s => s !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
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
    return titles[sectionKey] || sectionKey;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Review</h2>
            <p className="mt-1 text-gray-600">
              Application ID: {answers.application_id}
            </p>
            <p className="text-sm text-gray-500">
              Generated in {answers.total_generation_time.toFixed(1)} seconds
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(answers.estimated_score || 0)}`}>
              {answers.estimated_score || 0}/100
            </div>
            <p className="text-sm text-gray-600">Estimated Score</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(editedAnswers).map(([sectionKey, sectionAnswers]) => (
          <div key={sectionKey} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection(sectionKey)}
              className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-semibold text-lg text-gray-900">
                {getSectionTitle(sectionKey)}
              </h3>
              <svg
                className={`h-5 w-5 text-gray-500 transform transition-transform ${
                  expandedSections.includes(sectionKey) ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections.includes(sectionKey) && (
              <div className="p-4 space-y-4">
                {sectionAnswers.map((answer, index) => (
                  <div key={answer.question_id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <label className="font-medium text-gray-700">
                        {answer.field.charAt(0).toUpperCase() + answer.field.slice(1).replace(/_/g, ' ')}
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${
                          answer.character_count > answer.character_limit 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                        }`}>
                          {answer.character_count}/{answer.character_limit}
                        </span>
                        <button
                          onClick={() => copyToClipboard(answer.answer)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copy to clipboard"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {editingField === `${sectionKey}-${index}` ? (
                      <div>
                        <textarea
                          value={answer.answer}
                          onChange={(e) => handleAnswerEdit(sectionKey, index, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          rows={6}
                        />
                        <div className="mt-2 flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingField(null)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingField(`${sectionKey}-${index}`)}
                        className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <p className="text-gray-800 whitespace-pre-wrap">{answer.answer}</p>
                        <p className="mt-2 text-xs text-gray-500">Click to edit</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={onEdit}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Edit Project
        </button>
        
        <div className="space-x-3">
          <button
            onClick={() => {
              const allAnswers = {};
              Object.entries(editedAnswers).forEach(([section, answers]) => {
                answers.forEach(answer => {
                  allAnswers[answer.field] = answer.answer;
                });
              });
              
              const blob = new Blob([JSON.stringify(allAnswers, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `erasmus-application-${answers.application_id}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('Downloaded as JSON');
            }}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Export JSON
          </button>
          
          <button
            onClick={onExport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export to PDF
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-900">Review Checklist</h4>
        <ul className="mt-2 space-y-1 text-sm text-yellow-800">
          <li>✓ All answers are within character limits</li>
          <li>✓ EU priorities are clearly addressed</li>
          <li>✓ Budget and timeline are realistic</li>
          <li>✓ Partner roles are clearly defined</li>
          <li>✓ Impact and sustainability are demonstrated</li>
        </ul>
      </div>
    </div>
  );
};

export default AnswerReview;