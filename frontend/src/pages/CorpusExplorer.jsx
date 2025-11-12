import React, { useState, useEffect, useRef } from 'react';
import {
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import riskAssessmentAPI from '../services/api';
import { useDemoMode } from '../contexts/DemoModeContext';
import { getMockResponse } from '../services/mockData';
import CitationMarkdown from '../components/CitationMarkdown';

const CORPUS_INFO = {
  data_v1: {
    title: 'Business Data & Processes',
    description: 'Business process documents, data flows, and operational procedures',
    icon: DocumentTextIcon,
    color: 'blue',
    suggestedQuestions: [
      'What business processes are documented?',
      'How do we handle customer data in our systems?',
      'What are the data flows for user registration?',
      'Summarize our payment processing workflow',
      'What third-party vendors do we share data with?',
      'How is personal data collected and stored?',
      'List all systems and databases mentioned in our processes',
      'What data elements are collected during customer onboarding?',
      'Describe our marketing campaign execution process',
      'What automated processes involve personal data?',
      'How do we handle employee payroll data?',
      'What are the touchpoints in our customer journey?',
    ],
  },
  regulations: {
    title: 'Regulatory Knowledge Base',
    description: 'Privacy regulations, compliance requirements, and legal frameworks',
    icon: DocumentTextIcon,
    color: 'purple',
    suggestedQuestions: [
      'What regulations are available in the knowledge base?',
      'What are the data retention requirements under CCPA?',
      'What does CCPA say about consumer rights?',
      'What are the requirements for data breach notification?',
      'What lawful bases are defined for data processing?',
      'What are the requirements for cross-border data transfers?',
      'Compare consent requirements across different regulations',
      'What are the penalties for non-compliance under GDPR?',
      'What rights do data subjects have under privacy laws?',
      'What are the requirements for privacy notices?',
      'Explain the principle of data minimization',
      'What are the requirements for data protection impact assessments?',
    ],
  },
  ontology: {
    title: 'Data Ontology & Schema',
    description: 'Entity definitions, data classifications, and schema mappings',
    icon: DocumentTextIcon,
    color: 'green',
    suggestedQuestions: [
      'What entity types are defined in the ontology?',
      'What are the attributes of the Customer entity?',
      'What data classifications are used?',
      'What relationship types exist between entities?',
      'How is personal data categorized?',
      'What are the properties of sensitive data entities?',
      'List all entity types and their required attributes',
      'What relationships connect ProcessingActivity to Asset?',
      'How are data elements classified by sensitivity?',
      'What entity types represent personal information?',
      'Explain the data lineage model in the ontology',
      'What are the cardinality rules for entity relationships?',
    ],
  },
};

// Store chat history per corpus to persist conversations when switching tabs
const chatHistoryStore = {};
const suggestionsStore = {};

function CorpusExplorer({ corpusName }) {
  const { isDemoMode } = useDemoMode();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const corpusInfo = CORPUS_INFO[corpusName] || CORPUS_INFO.data_v1;
  const Icon = corpusInfo.icon;

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, chatLoading]);

  // Generate dynamic suggestions by querying the actual corpus
  const generateCorpusSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      console.log(`[CorpusExplorer] Generating suggestions from ${corpusName} corpus`);
      
      const prompt = `Query the ${corpusName} knowledge base and generate 8 relevant questions based on the actual content available.

CRITICAL: You MUST return your response as JSON with the questions in the "suggested_questions" array:

{
  "result": "Brief summary of what's in the knowledge base",
  "suggested_questions": [
    "Question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?",
    "Question 6?",
    "Question 7?",
    "Question 8?"
  ]
}

Knowledge Base: ${corpusName}
Description: ${corpusInfo.description}

IMPORTANT:
1. Query the ${corpusName} knowledge base to see what content exists
2. Only suggest questions about content that is actually present
3. Make questions specific and actionable
4. Put ALL 8 questions in the "suggested_questions" array, not in the "result" field`;

      const response = await riskAssessmentAPI.sendMessage(
        `[CORPUS FILTER: ${corpusName} ONLY] ${prompt}`
      );

      // Try to use suggested_questions from structured output first
      if (response.suggested_questions && response.suggested_questions.length > 0) {
        const suggestions = response.suggested_questions.slice(0, 8);
        setCurrentSuggestions(suggestions);
        suggestionsStore[corpusName] = suggestions;
        console.log(`[CorpusExplorer] Using ${suggestions.length} suggested questions from structured output`);
      } else if (response.content) {
        // Fallback: Parse from text content
        const suggestions = response.content
          .split('\n')
          .filter(line => line.trim() && !line.match(/^\d+[.)]/))
          .map(line => line.replace(/^[-*]\s*/, '').trim())
          .filter(line => line.length > 10)
          .slice(0, 8);

        if (suggestions.length > 0) {
          setCurrentSuggestions(suggestions);
          suggestionsStore[corpusName] = suggestions; // Cache the suggestions
          console.log(`[CorpusExplorer] Generated and cached ${suggestions.length} suggestions for ${corpusName}`);
        } else {
          // Fallback to hardcoded if generation fails
          const fallbackSuggestions = corpusInfo.suggestedQuestions;
          setCurrentSuggestions(fallbackSuggestions);
          suggestionsStore[corpusName] = fallbackSuggestions; // Cache fallback too
        }
      } else {
        // No content at all, use hardcoded
        const fallbackSuggestions = corpusInfo.suggestedQuestions;
        setCurrentSuggestions(fallbackSuggestions);
        suggestionsStore[corpusName] = fallbackSuggestions;
      }
    } catch (err) {
      console.error('Error generating corpus suggestions:', err);
      // Fallback to hardcoded suggestions
      setCurrentSuggestions(corpusInfo.suggestedQuestions);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Track the current corpus to prevent cross-contamination
  const currentCorpusRef = useRef(corpusName);
  
  // Restore or generate chat history and suggestions when corpus changes
  useEffect(() => {
    console.log(`[CorpusExplorer] Switching to ${corpusName}`);
    
    // Update the ref to track current corpus
    currentCorpusRef.current = corpusName;
    
    // Restore chat history if it exists for this corpus
    if (chatHistoryStore[corpusName]) {
      console.log(`[CorpusExplorer] Restoring ${chatHistoryStore[corpusName].length} messages for ${corpusName}`);
      setChatMessages(chatHistoryStore[corpusName]);
    } else {
      console.log(`[CorpusExplorer] No chat history for ${corpusName}, starting fresh`);
      setChatMessages([]);
    }
    
    // Restore suggestions if they exist for this corpus
    if (suggestionsStore[corpusName]) {
      console.log(`[CorpusExplorer] Restoring cached suggestions for ${corpusName}`);
      setCurrentSuggestions(suggestionsStore[corpusName]);
    } else {
      // Generate new suggestions only if we don't have them cached
      console.log(`[CorpusExplorer] No cached suggestions for ${corpusName}, generating new ones`);
      generateCorpusSuggestions();
    }
  }, [corpusName]);
  
  // Save chat history whenever messages change (but only for the current corpus)
  useEffect(() => {
    if (chatMessages.length > 0) {
      // Use the ref to ensure we save to the correct corpus
      const corpus = currentCorpusRef.current;
      chatHistoryStore[corpus] = chatMessages;
      console.log(`[CorpusExplorer] Saved ${chatMessages.length} messages for ${corpus}`);
    }
  }, [chatMessages]);

  // Listen for tour events to automatically ask questions
  useEffect(() => {
    const handleTourQuestion = (event) => {
      const { query } = event.detail;
      if (query) {
        // Simulate typing the question
        setChatInput(query);
        // Auto-submit after a short delay
        setTimeout(() => {
          handleChatSend(query);
        }, 1500);
      }
    };

    window.addEventListener('tourAskQuestion', handleTourQuestion);
    return () => window.removeEventListener('tourAskQuestion', handleTourQuestion);
  }, [isDemoMode]);

  // Listen for clear all chats event
  useEffect(() => {
    const handleClearAll = () => {
      // Clear current state
      setChatMessages([]);
      setChatInput('');
      
      // Clear all stored chat histories and suggestions
      Object.keys(chatHistoryStore).forEach(key => delete chatHistoryStore[key]);
      Object.keys(suggestionsStore).forEach(key => delete suggestionsStore[key]);
      
      console.log('[CorpusExplorer] Cleared all chat histories and suggestions');
      
      // Regenerate suggestions for current corpus
      generateCorpusSuggestions();
    };

    window.addEventListener('clearAllChats', handleClearAll);
    return () => window.removeEventListener('clearAllChats', handleClearAll);
  }, [corpusName]);

  const handleChatSend = async (questionText = null) => {
    // Handle case where questionText might be an event object
    const messageText = (typeof questionText === 'string' ? questionText : null) || chatInput;
    if (!messageText || !messageText.trim() || chatLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      let responseContent;
      const normalizeMarkdown = (raw) => {
        if (!raw) return '';
        let s = String(raw);
        // Convert escaped sequences from backend into real newlines/tabs
        s = s.replace(/\\n/g, '\n').replace(/\\t/g, '    ').replace(/\r\n/g, '\n');
        // Collapse excessive blank lines
        s = s.replace(/\n{3,}/g, '\n\n');
        // Trim spaces before table pipes on new lines
        s = s.replace(/\n[ \t]+\|/g, '\n|');
        return s.trim();
      };
      
      // Use mock data in demo mode
      let apiResponse = null;
      if (isDemoMode) {
        const mockData = getMockResponse(messageText);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, mockData.duration || 2000));
        responseContent = normalizeMarkdown(mockData.response);
      } else {
        // Send message with corpus filter
        apiResponse = await riskAssessmentAPI.sendMessage(
          `[CORPUS FILTER: ${corpusName} ONLY] ${messageText}\n\nIMPORTANT: Only query the ${corpusName} corpus. Do not query any other corpus.`
        );
        responseContent = normalizeMarkdown(apiResponse.content);
      }

      const assistantMessage = {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // Use suggested_questions from API response if available
      if (apiResponse?.suggested_questions && apiResponse.suggested_questions.length > 0) {
        console.log(`[CorpusExplorer] Using ${apiResponse.suggested_questions.length} suggested questions from API`);
        setCurrentSuggestions(apiResponse.suggested_questions);
        suggestionsStore[corpusName] = apiResponse.suggested_questions; // Cache them
      } else {
        // Fallback: Extract from Markdown or generate new suggestions
        const extractedSuggestions = extractSuggestedQuestions(responseContent);
        if (extractedSuggestions.length > 0) {
          console.log(`[CorpusExplorer] Extracted ${extractedSuggestions.length} suggested questions from Markdown`);
          setCurrentSuggestions(extractedSuggestions);
          suggestionsStore[corpusName] = extractedSuggestions;
        } else {
          // Only generate new suggestions if none were found
          await generateFollowUpSuggestions([...chatMessages, userMessage, assistantMessage]);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'assistant',
        content: `❌ Error: ${err.message || 'Failed to get response'}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * Extract suggested questions from the agent's response
   * The agent includes suggested questions in the format:
   * "You might also want to ask:"
   * - Question 1
   * - Question 2
   */
  const extractSuggestedQuestions = (responseText) => {
    try {
      // Look for the "You might also want to ask:" section
      const patterns = [
        /You might also want to ask:\s*([\s\S]*?)(?:\n\n|$)/i,
        /Suggested follow-up questions?:\s*([\s\S]*?)(?:\n\n|$)/i,
        /Next questions?:\s*([\s\S]*?)(?:\n\n|$)/i,
      ];

      for (const pattern of patterns) {
        const match = responseText.match(pattern);
        if (match && match[1]) {
          const questionsText = match[1];
          const questions = questionsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.replace(/^[-*•]\s*/, '')) // Remove bullet points
            .filter(line => line.length > 10 && line.includes('?')); // Must be a question

          if (questions.length > 0) {
            return questions.slice(0, 4); // Return up to 4 questions
          }
        }
      }

      return [];
    } catch (err) {
      console.error('Error extracting suggested questions:', err);
      return [];
    }
  };

  const generateFollowUpSuggestions = async (conversationHistory) => {
    try {
      // Build context from last few messages
      const recentMessages = conversationHistory.slice(-4);
      const context = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const prompt = `Based on this conversation about ${corpusInfo.title}, suggest 4 relevant follow-up questions the user might want to ask. Return ONLY the questions, one per line, without numbering or bullets:\n\n${context}`;
      
      const response = await riskAssessmentAPI.sendMessage(prompt);
      
      // Parse the response into individual questions
      const suggestions = response.content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 4);
      
      if (suggestions.length > 0) {
        setCurrentSuggestions(suggestions);
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
      // Keep existing suggestions on error
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress('Starting upload...');

      const result = await riskAssessmentAPI.uploadDocument(selectedFile, corpusName);

      // Add immediate feedback message to chat
      const uploadMessage = {
        role: 'assistant',
        content: result.message || `✅ Upload started for **${selectedFile.name}**!\n\nThe document is being processed in the background. You'll receive a notification when it's added to ${corpusInfo.title}.`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, uploadMessage]);

      // Clear upload state immediately (async processing continues in background)
      setSelectedFile(null);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ Failed to upload document: ${error.response?.data?.message || error.message}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setUploadProgress(null);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-[calc(100vh-16rem)]" data-tour-id="corpus-section">
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`border-b border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50 p-6 flex-shrink-0`}>
          <div className="flex items-center space-x-4">
            <div className={`bg-${corpusInfo.color}-600 p-3 rounded-lg`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{corpusInfo.title}</h1>
              <p className="text-sm text-gray-600 mt-1">{corpusInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Chat Panel - Full Width */}
        <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <div className="bg-purple-50 border-b border-purple-100 p-4 flex-shrink-0">
                <h3 className="font-semibold text-gray-900">Ask Questions</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Questions will only search {corpusInfo.title}
                </p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-h-0">
                {chatMessages.length === 0 ? (
                  <div className="py-6">
                    <div className="text-center mb-6">
                      <ChatBubbleLeftIcon className="h-12 w-12 text-purple-300 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Ask Questions About {corpusInfo.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Get answers from {corpusInfo.title} documents
                      </p>
                    </div>
                    
                    {/* Suggested Questions */}
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-3">
                        Suggested Questions {loadingSuggestions && <span className="text-gray-500">(Analyzing knowledge base...)</span>}
                      </p>
                      {loadingSuggestions ? (
                        <div className="flex items-center justify-center py-8">
                          <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />
                          <span className="ml-2 text-sm text-gray-500">Generating questions based on available content...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentSuggestions.map((question, index) => {
                            // Color code based on index for variety
                            const colors = [
                              'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400 text-blue-700',
                              'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-400 text-purple-700',
                              'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-400 text-green-700',
                              'bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-400 text-orange-700',
                              'bg-pink-50 hover:bg-pink-100 border-pink-200 hover:border-pink-400 text-pink-700',
                              'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-400 text-indigo-700',
                            ];
                            const colorClass = colors[index % colors.length];
                            
                            return (
                            <button
                              key={index}
                              onClick={() => handleChatSend(question)}
                              className={`text-left px-4 py-3 text-sm rounded-xl transition-all border hover:shadow-sm ${colorClass}`}
                            >
                              <span className="block font-medium">{question}</span>
                            </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl rounded-lg px-4 py-3 break-words ${
                          message.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : message.isError
                            ? 'bg-red-50 text-red-900 border border-red-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <CitationMarkdown content={message.content} />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <ArrowPathIcon className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-gray-700">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggested Follow-up Questions - Show after messages */}
                {chatMessages.length > 0 && !chatLoading && currentSuggestions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Suggested follow-up questions:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {currentSuggestions.slice(0, 4).map((question, index) => {
                        const colors = [
                          'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400 text-blue-700',
                          'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-400 text-purple-700',
                          'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-400 text-green-700',
                          'bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-400 text-orange-700',
                        ];
                        const colorClass = colors[index % colors.length];
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleChatSend(question)}
                            className={`text-left px-3 py-2 text-sm rounded-lg transition-all border hover:shadow-sm ${colorClass}`}
                          >
                            <span className="block font-medium">{question}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4 flex-shrink-0">
                {/* File Upload Section */}
                {selectedFile && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {uploadProgress ? (
                          <span className="text-sm text-blue-600">{uploadProgress}</span>
                        ) : (
                          <>
                            <button
                              onClick={handleFileUpload}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Upload
                            </button>
                            <button
                              onClick={handleCancelUpload}
                              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.txt,.doc,.docx,.md"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={chatLoading || uploadProgress}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    title="Upload document to knowledge base"
                  >
                    <DocumentArrowUpIcon className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
        </div>
      </div>
    </div>
  );
}

export default CorpusExplorer;
