import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour } from '../contexts/TourContext';
import { 
  XMarkIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const TourGuide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isTourActive, 
    currentStep, 
    tourSteps, 
    nextStep, 
    previousStep, 
    skipTour, 
    getCurrentStep 
  } = useTour();

  const autoAdvanceTimerRef = useRef(null);

  const step = getCurrentStep();

  // Removed audio functionality per user request

  // Auto-advance to next step after duration
  useEffect(() => {
    if (isTourActive && step && step.duration && step.position !== 'center') {
      autoAdvanceTimerRef.current = setTimeout(() => {
        nextStep();
      }, step.duration);

      return () => {
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
        }
      };
    }
  }, [currentStep, isTourActive, step]);

  // Navigate to the correct page when step changes
  useEffect(() => {
    if (isTourActive && step && step.page && location.pathname !== step.page) {
      navigate(step.page);
    }
  }, [currentStep, isTourActive, step, navigate, location.pathname]);

  // Execute automated actions
  useEffect(() => {
    if (isTourActive && step && step.autoAction) {
      const timer = setTimeout(() => {
        if (step.autoAction === 'askQuestion' && step.autoQuery) {
          // Dispatch custom event to trigger question in Chat component
          window.dispatchEvent(new CustomEvent('tourAskQuestion', {
            detail: { query: step.autoQuery }
          }));
        }
      }, 1000); // Delay to allow page load

      return () => clearTimeout(timer);
    }
  }, [currentStep, isTourActive, step]);

  // Audio removed - using visual text display only

  // Scroll to highlighted element when step changes
  useEffect(() => {
    if (isTourActive && step && step.highlight) {
      const timer = setTimeout(() => {
        const element = document.querySelector(`[data-tour-id="${step.highlight}"]`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentStep, isTourActive, step]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  if (!isTourActive || !step) return null;

  // Center modal for welcome and complete steps
  if (step.position === 'center') {
    return (
      <>
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn" />
        
        {/* Center Modal */}
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="h-8 w-8" />
                  <h2 className="text-2xl font-bold">{step.title}</h2>
                </div>
                <button
                  onClick={skipTour}
                  className="text-gray-800/80 hover:text-gray-900 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {step.description}
              </p>

              {step.id === 'welcome' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                  <p className="text-sm text-yellow-900">
                    <strong>💡 Tip:</strong> This is a fully automated demo. 
                    Just sit back and watch - the tour will advance automatically through all tabs!
                  </p>
                </div>
              )}

              {step.id === 'complete' && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="text-sm font-semibold text-green-900">Tour Complete</div>
                    <div className="text-xs text-green-700">You've seen all features</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-2xl mb-2">🎬</div>
                    <div className="text-sm font-semibold text-yellow-900">Demo Mode</div>
                    <div className="text-xs text-yellow-700">Toggle anytime in header</div>
                  </div>
                </div>
              )}

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{currentStep + 1} of {tourSteps.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={skipTour}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {step.id === 'complete' ? 'Close' : 'Skip Tour'}
                </button>
                <div className="flex items-center space-x-3">
                  {currentStep > 0 && step.id !== 'complete' && (
                    <button
                      onClick={previousStep}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                  )}
                  <button
                    onClick={nextStep}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-gray-900 rounded-lg font-medium transition-colors shadow-lg"
                  >
                    <span>{step.id === 'complete' ? 'Finish' : currentStep === 0 ? 'Start Tour' : 'Next'}</span>
                    {step.id !== 'complete' && <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Top banner for initial steps
  if (step.position === 'top') {
    return (
      <>
        {/* Top banner - prominent and clear */}
        <div className="fixed top-20 left-0 right-0 z-[9999] animate-slideDown shadow-2xl">
          <div className="bg-white border-b-2 border-yellow-400">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-4">
              <div className="max-w-7xl mx-auto">
                {/* Main content */}
                <div className="flex items-start space-x-4 mb-3">
                  <SparklesIcon className="h-6 w-6 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-900 font-medium">
                      Step {currentStep + 1} of {tourSteps.length}
                    </span>
                    <div className="w-32 bg-gray-900/20 rounded-full h-2">
                      <div
                        className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={skipTour}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-900/10 hover:bg-gray-900/20 rounded text-sm transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span className="text-xs">Skip Tour</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow pointing down to highlighted element */}
          {step.highlight && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-b-2 border-yellow-400 rotate-45" />
          )}
        </div>

        {/* Highlight effect for specific elements */}
        {step.highlight && (
          <style>{`
            [data-tour-id="${step.highlight}"] {
              position: relative;
              z-index: 45;
              box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.6), 0 0 20px rgba(249, 115, 22, 0.4);
              border-radius: 8px;
              animation: gentlePulse 2s infinite;
            }
            
            @keyframes gentlePulse {
              0%, 100% {
                box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.6), 0 0 20px rgba(249, 115, 22, 0.4);
              }
              50% {
                box-shadow: 0 0 0 5px rgba(234, 179, 8, 0.4), 0 0 30px rgba(249, 115, 22, 0.6);
              }
            }
          `}</style>
        )}
      </>
    );
  }

  // Bottom banner style guide for later steps
  return (
    <>
      {/* Bottom banner - compact and thin */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-slideUp shadow-2xl">
        <div className="bg-white border-t-2 border-yellow-400">
          {/* Compact single-line layout */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-4 py-2">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              {/* Left: Title and Description */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <SparklesIcon className="h-4 w-4 flex-shrink-0" />
                <div className="flex items-center space-x-2 min-w-0">
                  <h3 className="font-semibold text-sm whitespace-nowrap">{step.title}</h3>
                  <span className="text-gray-800/60 text-xs">•</span>
                  <p className="text-xs text-gray-900 truncate">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Center: Progress */}
              <div className="flex items-center space-x-2 mx-4">
                <span className="text-xs text-gray-900 whitespace-nowrap">
                  {currentStep + 1}/{tourSteps.length}
                </span>
                <div className="w-24 bg-gray-900/20 rounded-full h-1">
                  <div
                    className="bg-gray-900 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-2">
                {currentStep > 0 && (
                  <button
                    onClick={previousStep}
                    className="flex items-center space-x-1 px-2 py-1 bg-gray-900/10 hover:bg-gray-900/20 rounded text-xs transition-colors"
                  >
                    <ArrowLeftIcon className="h-3 w-3" />
                    <span>Back</span>
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-900 text-yellow-400 hover:bg-gray-800 rounded text-xs font-bold transition-colors"
                >
                  <span>Next</span>
                  <ArrowRightIcon className="h-3 w-3" />
                </button>
                <button
                  onClick={skipTour}
                  className="text-gray-900 hover:text-gray-800 transition-colors ml-1"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow pointing to highlighted element */}
        {step.highlight && (
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r-2 border-b-2 border-yellow-400 transform rotate-45" />
        )}
      </div>

      {/* Highlight effect for specific elements */}
      {step.highlight && (
        <style>{`
          [data-tour-id="${step.highlight}"] {
            position: relative;
            z-index: 45;
            box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.6), 0 0 20px rgba(249, 115, 22, 0.4);
            border-radius: 8px;
            animation: gentlePulse 2s infinite;
          }
          
          @keyframes gentlePulse {
            0%, 100% {
              box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.6), 0 0 20px rgba(249, 115, 22, 0.4);
            }
            50% {
              box-shadow: 0 0 0 5px rgba(234, 179, 8, 0.4), 0 0 30px rgba(249, 115, 22, 0.6);
            }
          }
        `}</style>
      )}
    </>
  );
};

export default TourGuide;
