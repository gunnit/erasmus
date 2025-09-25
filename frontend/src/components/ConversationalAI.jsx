import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Send, Sparkles, MessageSquare, X, Lightbulb, Edit3, TrendingUp, BookOpen } from 'lucide-react';
import api from '../services/api';

const ConversationalAI = ({
  projectContext = null,
  currentAnswers = null,
  proposalId = null,
  onSuggestionApply = null,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('general'); // general, improvement, suggestion
  const [suggestions, setSuggestions] = useState([]);
  const [conversationStarters, setConversationStarters] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversation starters on mount
  useEffect(() => {
    loadConversationStarters();
  }, [proposalId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationStarters = async () => {
    try {
      const response = await api.get('/ai/conversation-starters', {
        params: { proposal_id: proposalId }
      });
      setConversationStarters(response.data.starters || []);
    } catch (error) {
      console.error('Error loading conversation starters:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: inputMessage,
        conversation_history: messages,
        project_context: projectContext,
        current_answers: currentAnswers,
        mode: mode,
        proposal_id: proposalId
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp,
        suggestions: response.data.suggestions || []
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.data.suggestions && response.data.suggestions.length > 0) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStarterClick = (starter) => {
    setInputMessage(starter);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleAnalyzeSection = async (section) => {
    if (!currentAnswers || !currentAnswers[section]) {
      alert('No answers available for this section yet.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/ai/analyze-section', {
        section: section,
        answers: currentAnswers[section],
        project_context: projectContext,
        proposal_id: proposalId
      });

      const analysisMessage = {
        role: 'assistant',
        content: response.data.analysis,
        timestamp: response.data.timestamp,
        isAnalysis: true,
        suggestions: response.data.suggestions || []
      };

      setMessages(prev => [...prev, analysisMessage]);
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error analyzing section:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetBestPractices = async (topic) => {
    setIsLoading(true);
    try {
      const response = await api.post('/ai/best-practices', {
        topic: topic,
        context: projectContext
      });

      const practicesMessage = {
        role: 'assistant',
        content: response.data.best_practices,
        timestamp: response.data.timestamp,
        isBestPractice: true
      };

      setMessages(prev => [...prev, practicesMessage]);
    } catch (error) {
      console.error('Error getting best practices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';

    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white'
              : message.isError
                ? 'bg-red-50 text-red-900 border border-red-200'
                : message.isAnalysis
                  ? 'bg-purple-50 text-purple-900 border border-purple-200'
                  : message.isBestPractice
                    ? 'bg-green-50 text-green-900 border border-green-200'
                    : 'bg-gray-100 text-gray-900'
          }`}>
            {message.isAnalysis && (
              <div className="flex items-center mb-2 text-purple-700">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="font-semibold text-sm">Section Analysis</span>
              </div>
            )}
            {message.isBestPractice && (
              <div className="flex items-center mb-2 text-green-700">
                <BookOpen className="w-4 h-4 mr-1" />
                <span className="font-semibold text-sm">Best Practices</span>
              </div>
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>

            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm font-semibold mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-1" />
                  Suggestions:
                </div>
                <ul className="space-y-1">
                  {message.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm flex items-start">
                      <span className="mr-2">•</span>
                      <span>{typeof suggestion === 'string' ? suggestion : suggestion.content || suggestion.suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating button to open chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 z-50 flex items-center"
        >
          <Sparkles className="w-6 h-6 mr-2" />
          <span className="font-semibold">AI Assistant</span>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col transition-all duration-300 ${
          isMinimized ? 'h-14' : 'h-[600px]'
        } ${className}`}>

          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="font-semibold">AI Grant Assistant</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 rounded p-1 transition-colors"
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Mode selector */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setMode('general')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      mode === 'general'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3 inline mr-1" />
                    General
                  </button>
                  <button
                    onClick={() => setMode('improvement')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      mode === 'improvement'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Edit3 className="w-3 h-3 inline mr-1" />
                    Improve
                  </button>
                  <button
                    onClick={() => setMode('suggestion')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      mode === 'suggestion'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Lightbulb className="w-3 h-3 inline mr-1" />
                    Suggest
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Hi! I'm your AI Grant Assistant
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      I can help you write, improve, and optimize your Erasmus+ application.
                    </p>

                    {/* Quick action buttons */}
                    {currentAnswers && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={() => handleAnalyzeSection('relevance')}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200"
                          >
                            Analyze Relevance
                          </button>
                          <button
                            onClick={() => handleGetBestPractices('partnership')}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200"
                          >
                            Partnership Tips
                          </button>
                          <button
                            onClick={() => handleGetBestPractices('innovation')}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200"
                          >
                            Innovation Ideas
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Conversation starters */}
                    {conversationStarters.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Try asking:</p>
                        <div className="space-y-2">
                          {conversationStarters.slice(0, 3).map((starter, index) => (
                            <button
                              key={index}
                              onClick={() => handleStarterClick(starter)}
                              className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                            >
                              "{starter}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((message, index) => renderMessage(message, index))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      mode === 'general'
                        ? "Ask me anything about your grant..."
                        : mode === 'improvement'
                          ? "What would you like to improve?"
                          : "What suggestions do you need?"
                    }
                    className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows="2"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg px-4 py-2 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ConversationalAI;