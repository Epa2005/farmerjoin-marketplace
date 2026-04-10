import React, { useState } from 'react';
import { useUserHelp } from '../hooks/useUserHelp';
import { useNewTranslation } from '../hooks/useNewTranslation';

const HelpButton = ({ 
  context = 'general', 
  pageSpecific = null,
  className = "",
  showText = true,
  position = "bottom-right"
}) => {
  const { showHelp, hideHelp, isHelpVisible, helpContext } = useUserHelp();
  const { t } = useNewTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleHelpClick = () => {
    if (isHelpVisible) {
      hideHelp();
    } else {
      showHelp(context, pageSpecific);
    }
    setIsExpanded(!isExpanded);
  };

  const positionClasses = {
    "bottom-right": "fixed bottom-4 right-4 z-40",
    "bottom-left": "fixed bottom-4 left-4 z-40", 
    "top-right": "fixed top-20 right-4 z-40",
    "top-left": "fixed top-20 left-4 z-40"
  };

  return (
    <>
      {/* Help Button */}
      <div className={`${positionClasses[position]} ${className}`}>
        <button
          onClick={handleHelpClick}
          className={`bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 group ${
            isHelpVisible ? 'bg-red-500 hover:bg-red-600' : ''
          }`}
          title={isHelpVisible ? t('closeHelp') : t('getHelp')}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            {isHelpVisible ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-.854.713-1.433 1.433-1.433.489-.011.684-.034.684-.034.634.015.836.042.836.042.646.046.646-.046.099-.007.227-.017.227-.017.196.007.425-.038.425-.038.194-.01.82-.011.82-.011.573.001.993.001.993.001.652.008.652-.008.462.018.462-.018.315.003.746-.003.746-.003.274-.01.274-.01.714-.003.714-.003.504-.012.504-.012.383-.007.383-.007.393-.007.393-.007.393-.007.393-.007.253-.009.253-.009.09-.019.09-.019.06-.029.06-.029.032-.04.032-.04.063-.04.063-.04.263-.063.263-.063.235-.044.235-.044.194-.03.194-.03.257-.05.257-.05.257-.05.123-.04.123-.04.062-.07.062-.07.15-.15.15-.15.325-.04.325-.04.614-.04.614-.04.546-.045.546-.045.618-.04.618-.04.388-.045.388-.045.215-.03.215-.03.534-.05.534-.05.654-.05.654-.05.517-.025.517-.025.233-.023.233-.023.416-.04.416-.04.363-.03.363-.03.507-.03.507-.03.444-.04.444-.04.395-.02.395-.02.219-.04.219-.04.419-.04.419-.04.407-.02.407-.02.298-.04.298-.04.662-.05.662-.05.363-.05.363-.05.191-.045.191-.045.09-.01.09-.01.202-.02.202-.02.017-.04.017-.04.407-.07.407-.07.87-.143.87-.143.87-.143.87-.143.87-.143.87-.143.87-.143.87-.143.87-.143.87-.143.74-.425.28-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547-.28-.547" />
            )}
          </svg>
          {showText && (
            <span className="ml-2 text-sm font-medium">
              {isHelpVisible ? t('close') : t('help')}
            </span>
          )}
        </button>

        {/* Expanded Help Panel */}
        {isExpanded && isHelpVisible && helpContext && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">{helpContext.title}</h3>
              <button
                onClick={hideHelp}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mb-3">
              {helpContext.steps && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700 mb-2">{t('quickSteps')}:</h4>
                  {helpContext.steps.slice(0, 3).map((step, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="font-medium">{step.title}</div>
                        <div className="text-xs">{step.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {helpContext.commonIssues && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">{t('commonIssues')}:</h4>
                  {helpContext.commonIssues.slice(0, 2).map((issue, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                      <div className="font-medium text-red-800 text-sm mb-1">❓ {issue.problem}</div>
                      <div className="text-xs text-red-600">💡 {issue.solution}</div>
                    </div>
                  ))}
                </div>
              )}

              {helpContext.tips && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">{t('quickTips')}:</h4>
                  {helpContext.tips.slice(0, 3).map((tip, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded p-2 mb-1">
                      <div className="text-xs text-blue-700">💡 {tip}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* More Help Button */}
            <div className="text-center">
              <button
                onClick={() => window.open('/help', '_blank')}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium underline"
              >
                {t('viewFullHelpGuide')} →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating indicator for help availability */}
      {!isHelpVisible && (
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse">
          <span className="sr-only">{t('helpAvailable')}</span>
        </div>
      )}
    </>
  );
};

export default HelpButton;
