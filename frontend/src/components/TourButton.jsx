import React from 'react';
import { useTour } from '../contexts/TourContext';
import { useDemoMode } from '../contexts/DemoModeContext';
import { SparklesIcon } from '@heroicons/react/24/outline';

const TourButton = () => {
  const { startTour, hasCompletedTour } = useTour();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  const handleStartTour = () => {
    // Automatically enable demo mode for the tour
    if (!isDemoMode) {
      toggleDemoMode();
      // Small delay to let demo mode activate
      setTimeout(() => {
        startTour();
      }, 300);
    } else {
      startTour();
    }
  };

  return (
    <button
      onClick={handleStartTour}
      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-gray-900 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
      title="Watch automated demo tour"
    >
      <SparklesIcon className="h-5 w-5" />
      <span className="text-sm font-bold">
        {hasCompletedTour ? '🎬 Replay Demo' : '🎬 Watch Demo'}
      </span>
    </button>
  );
};

export default TourButton;
