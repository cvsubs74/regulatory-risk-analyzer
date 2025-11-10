import React, { createContext, useContext, useState } from 'react';

const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export const TourProvider = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    return localStorage.getItem('tourCompleted') === 'true';
  });

  const tourSteps = [
    {
      id: 'welcome',
      title: '🎬 Welcome to Regulatory Risk Analyzer!',
      description: 'Sit back and watch as I demonstrate how our AI-powered platform helps you analyze compliance risks across multiple knowledge bases. This is a fully automated demo - no clicking required!',
      page: '/chat',
      highlight: null,
      position: 'center',
      autoAction: null,
      duration: 6000
    },
    {
      id: 'demo-mode',
      title: '🎯 Demo Mode Active',
      description: 'Notice the golden "DEMO MODE" indicator in the top right. All data you see is realistic mock data for demonstration purposes. You can toggle between Demo and Live modes anytime.',
      page: '/chat',
      highlight: 'demo-toggle',
      position: 'bottom',
      autoAction: null,
      duration: 5000
    },
    {
      id: 'chat-interface',
      title: '💬 AI Chat Assistant',
      description: 'This is your main interaction point. The AI can answer questions across all your knowledge bases. Watch as I automatically ask: "What business processes are documented?"',
      page: '/chat',
      highlight: 'chat-interface',
      position: 'bottom',
      autoAction: 'askQuestion',
      autoQuery: 'What business processes are documented?',
      duration: 4000
    },
    {
      id: 'query-response',
      title: '🤖 AI Response',
      description: 'The AI retrieves information from the Business Data corpus and provides a comprehensive answer listing all documented processes. Take a moment to read through the response.',
      page: '/chat',
      highlight: 'chat-interface',
      position: 'bottom',
      autoAction: null,
      duration: 10000
    },
    {
      id: 'business-data-tab',
      title: '📚 Business Data Tab',
      description: 'Now navigating to the Business Data tab. This corpus stores your business process documents, data flows, and operational procedures. You can ask questions specific to this corpus.',
      page: '/corpus/data_v1',
      highlight: 'corpus-section',
      position: 'bottom',
      autoAction: null,
      duration: 6000
    },
    {
      id: 'business-data-query',
      title: '📄 Querying Business Data',
      description: 'Watch as I ask a question specific to business data: "How do we handle customer data in our systems?"',
      page: '/corpus/data_v1',
      highlight: 'corpus-section',
      position: 'bottom',
      autoAction: 'askQuestion',
      autoQuery: 'How do we handle customer data in our systems?',
      duration: 4000
    },
    {
      id: 'business-data-response',
      title: '💼 Business Process Details',
      description: 'The AI provides detailed information about customer data handling processes from the Business Data corpus.',
      page: '/corpus/data_v1',
      highlight: 'corpus-section',
      position: 'bottom',
      autoAction: null,
      duration: 8000
    },
    {
      id: 'regulations-tab',
      title: '⚖️ Regulations Tab',
      description: 'Now navigating to the Regulations tab. This corpus contains regulatory requirements like CCPA, GDPR, and other compliance frameworks. Ask questions to understand specific regulatory requirements.',
      page: '/corpus/regulations',
      highlight: 'corpus-section',
      position: 'bottom',
      autoAction: null,
      duration: 6000
    },
    {
      id: 'regulations-query',
      title: '📋 Querying Regulations',
      description: 'Watch as I ask: "What are the data retention requirements under CCPA?"',
      page: '/corpus/regulations',
      highlight: 'corpus-section',
      position: 'bottom',
      autoAction: 'askQuestion',
      autoQuery: 'What are the data retention requirements under CCPA?',
      duration: 4000
    },
    {
      id: 'regulations-response',
      title: '📜 CCPA Requirements',
      description: 'The AI extracts specific retention requirements from the CCPA regulation in the corpus.',
      page: '/corpus/regulations',
      highlight: 'corpus-section',
      position: 'bottom',
      autoAction: null,
      duration: 8000
    },
    {
      id: 'ontology-tab',
      title: '🏗️ Ontology Tab',
      description: 'Now navigating to the Ontology tab. This corpus defines entity types, data classifications, and schema mappings used across your organization.',
      page: '/corpus/ontology',
      highlight: 'corpus-section',
      position: 'bottom',
      autoAction: null,
      duration: 6000
    },
    {
      id: 'ontology-query',
      title: '🔍 Querying Ontology',
      description: 'Watch as I ask: "What entity types are defined?"',
      page: '/corpus/ontology',
      highlight: 'corpus-section',
      position: 'bottom',
      autoAction: 'askQuestion',
      autoQuery: 'What entity types are defined?',
      duration: 4000
    },
    {
      id: 'ontology-response',
      title: '📐 Entity Definitions',
      description: 'The AI lists all entity types and their attributes defined in the ontology.',
      page: '/corpus/ontology',
      highlight: 'corpus-section',
      position: 'bottom',
      autoAction: null,
      duration: 8000
    },
    {
      id: 'back-to-chat',
      title: '🔄 Back to AI Assistant',
      description: 'Returning to the AI Assistant tab for a comprehensive compliance risk analysis across all corpora.',
      page: '/chat',
      highlight: 'chat-interface',
      position: 'bottom',
      autoAction: null,
      duration: 4000
    },
    {
      id: 'risk-analysis',
      title: '⚠️ Compliance Risk Analysis',
      description: 'Watch as I ask for a comprehensive CCPA compliance risk analysis. The AI will analyze business processes from data_v1 against CCPA requirements from the regulations corpus.',
      page: '/chat',
      highlight: 'chat-interface',
      position: 'bottom',
      autoAction: 'askQuestion',
      autoQuery: 'Analyze our CCPA compliance risks',
      duration: 4000
    },
    {
      id: 'risk-analysis-response',
      title: '📊 Comprehensive Risk Analysis',
      description: 'The AI provides a detailed compliance risk analysis with risk scores, critical gaps, and actionable recommendations. This demonstrates the power of analyzing across multiple corpora.',
      page: '/chat',
      highlight: 'chat-interface',
      position: 'bottom',
      autoAction: null,
      duration: 12000
    },
    {
      id: 'complete',
      title: '✅ Demo Complete!',
      description: 'You\'ve seen all the key features across all tabs! Switch to LIVE MODE to upload your own documents, ask questions, and analyze compliance risks with real data. Click any suggested question to see more examples. Stay compliant! 🛡️',
      page: '/chat',
      highlight: null,
      position: 'center',
      autoAction: null,
      duration: 8000
    }
  ];

  const startTour = () => {
    setIsTourActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTour = () => {
    setIsTourActive(false);
    setCurrentStep(0);
  };

  const completeTour = () => {
    setIsTourActive(false);
    setCurrentStep(0);
    setHasCompletedTour(true);
    localStorage.setItem('tourCompleted', 'true');
  };

  const resetTour = () => {
    setHasCompletedTour(false);
    localStorage.removeItem('tourCompleted');
  };

  const getCurrentStep = () => tourSteps[currentStep];

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStep,
        tourSteps,
        hasCompletedTour,
        startTour,
        nextStep,
        previousStep,
        skipTour,
        completeTour,
        resetTour,
        getCurrentStep
      }}
    >
      {children}
    </TourContext.Provider>
  );
};
