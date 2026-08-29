import { useState, useEffect, useCallback } from 'react';
import { useNewTranslation } from './useNewTranslation';

const useUserHelp = () => {
  const { t } = useNewTranslation();
  const [helpContext, setHelpContext] = useState(null);
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  // Contextual help data based on current page/user action
  const helpData = {
    // Registration help
    registration: {
      title: t('registrationHelp'),
      steps: [
        {
          title: t('step1'),
          content: t('registrationStep1'),
          tips: [t('regTip1'), t('regTip2')]
        },
        {
          title: t('step2'),
          content: t('registrationStep2'),
          tips: [t('regTip3'), t('regTip4')]
        },
        {
          title: t('step3'),
          content: t('registrationStep3'),
          tips: [t('regTip5'), t('regTip6')]
        }
      ],
      commonIssues: [
        {
          problem: t('emailNotVerified'),
          solution: t('emailVerificationSolution')
        },
        {
          problem: t('passwordTooWeak'),
          solution: t('passwordStrengthSolution')
        },
        {
          problem: t('locationNotDetected'),
          solution: t('locationPermissionSolution')
        }
      ]
    },

    // Product listing help
    productListing: {
      title: t('productListingHelp'),
      steps: [
        {
          title: t('photoGuidelines'),
          content: t('photoTips'),
          examples: [t('goodPhotoExample'), t('badPhotoExample')]
        },
        {
          title: t('pricingStrategy'),
          content: t('pricingAdvice'),
          tips: [t('pricingTip1'), t('pricingTip2'), t('pricingTip3')]
        },
        {
          title: t('descriptionWriting'),
          content: t('descriptionGuidelines'),
          tips: [t('descTip1'), t('descTip2'), t('descTip3')]
        }
      ],
      bestPractices: [
        t('qualityPhotos'),
        t('accurateDescriptions'),
        t('competitivePricing'),
        t('regularUpdates'),
        t('customerEngagement')
      ]
    },

    // Order management help
    orderManagement: {
      title: t('orderManagementHelp'),
      process: [
        {
          stage: t('orderReceived'),
          actions: [t('confirmOrder'), t('checkInventory'), t('contactBuyer')]
        },
        {
          stage: t('orderPreparation'),
          actions: [t('packageProducts'), t('scheduleDelivery'), t('updateStatus')]
        },
        {
          stage: t('orderDelivery'),
          actions: [t('coordinateDelivery'), t('trackShipment'), t('confirmDelivery')]
        }
      ],
      problemSolving: [
        {
          issue: t('paymentFailed'),
          steps: [t('checkPaymentMethod'), t('contactBuyer'), t('offerAlternative')]
        },
        {
          issue: t('deliveryDelayed'),
          steps: [t('trackOrder'), t('contactCarrier'), t('informBuyer')]
        },
        {
          issue: t('productDamaged'),
          steps: [t('documentDamage'), t('fileClaim'), t('processRefund')]
        }
      ]
    },

    // Dashboard help
    dashboard: {
      title: t('dashboardHelp'),
      features: [
        {
          feature: t('salesAnalytics'),
          description: t('salesAnalyticsDesc'),
          benefits: [t('benefit1'), t('benefit2')]
        },
        {
          feature: t('inventoryManagement'),
          description: t('inventoryDesc'),
          benefits: [t('benefit3'), t('benefit4')]
        },
        {
          feature: t('customerInsights'),
          description: t('customerInsightsDesc'),
          benefits: [t('benefit5'), t('benefit6')]
        }
      ],
      tips: [
        t('dashboardTip1'),
        t('dashboardTip2'),
        t('dashboardTip3')
      ]
    },

    // Profile management help
    profileManagement: {
      title: t('profileHelp'),
      sections: [
        {
          section: t('basicInfo'),
          fields: [t('nameField'), t('emailField'), t('phoneField'), t('locationField')],
          tips: [t('infoTip1'), t('infoTip2')]
        },
        {
          section: t('farmDetails'),
          fields: [t('farmSizeField'), t('farmTypeField'), t('cropsField')],
          tips: [t('farmTip1'), t('farmTip2')]
        },
        {
          section: t('verification'),
          steps: [t('uploadDocuments'), t('awaitVerification'), t('completeProfile')],
          tips: [t('verifyTip1'), t('verifyTip2')]
        }
      ]
    }
  };

  // Get contextual help based on current context
  const getContextualHelp = useCallback((context, pageSpecific = null) => {
    const baseHelp = helpData[context] || null;
    
    if (!baseHelp) {
      return {
        title: t('generalHelp'),
        content: t('generalHelpContent'),
        quickActions: [
          t('contactSupport'),
          t('browseFAQ'),
          t('watchTutorials')
        ]
      };
    }

    // Add page-specific help if provided
    if (pageSpecific && baseHelp.pageSpecific) {
      return {
        ...baseHelp,
        pageSpecific: baseHelp.pageSpecific[pageSpecific]
      };
    }

    return baseHelp;
  }, [t]);

  // Show help for specific context
  const showHelp = useCallback((context, pageSpecific = null) => {
    const help = getContextualHelp(context, pageSpecific);
    setHelpContext(help);
    setIsHelpVisible(true);
  }, [getContextualHelp]);

  // Hide help
  const hideHelp = useCallback(() => {
    setIsHelpVisible(false);
    setHelpContext(null);
  }, []);

  // Get help suggestions based on user input
  const getHelpSuggestions = useCallback((input, context = null) => {
    const suggestions = [];
    const inputLower = input.toLowerCase();

    // Context-aware suggestions
    if (context === 'registration') {
      if (inputLower.includes('email')) {
        suggestions.push(t('emailHelpTip'));
      }
      if (inputLower.includes('password')) {
        suggestions.push(t('passwordHelpTip'));
      }
      if (inputLower.includes('location')) {
        suggestions.push(t('locationHelpTip'));
      }
    }

    if (context === 'product') {
      if (inputLower.includes('photo')) {
        suggestions.push(t('photoHelpTip'));
      }
      if (inputLower.includes('price')) {
        suggestions.push(t('pricingHelpTip'));
      }
      if (inputLower.includes('description')) {
        suggestions.push(t('descriptionHelpTip'));
      }
    }

    if (context === 'order') {
      if (inputLower.includes('track')) {
        suggestions.push(t('trackingHelpTip'));
      }
      if (inputLower.includes('cancel')) {
        suggestions.push(t('cancellationHelpTip'));
      }
      if (inputLower.includes('refund')) {
        suggestions.push(t('refundHelpTip'));
      }
    }

    return suggestions;
  }, [t]);

  // Interactive tutorials
  const startTutorial = useCallback((tutorialType) => {
    const tutorials = {
      productListing: [
        {
          title: t('takingProductPhotos'),
          duration: t('photoTutorialDuration'),
          steps: [
            t('photoStep1'),
            t('photoStep2'),
            t('photoStep3'),
            t('photoStep4')
          ]
        },
        {
          title: t('settingPrices'),
          duration: t('pricingTutorialDuration'),
          steps: [
            t('pricingStep1'),
            t('pricingStep2'),
            t('pricingStep3')
          ]
        }
      ],
      orderManagement: [
        {
          title: t('processingOrders'),
          duration: t('orderTutorialDuration'),
          steps: [
            t('orderStep1'),
            t('orderStep2'),
            t('orderStep3'),
            t('orderStep4')
          ]
        }
      ]
    };

    return tutorials[tutorialType] || null;
  }, [t]);

  // Search help content
  const searchHelp = useCallback((query) => {
    const results = [];
    const queryLower = query.toLowerCase();

    // Search through all help content
    Object.keys(helpData).forEach(context => {
      const context = helpData[context];
      
      // Search in title
      if (context.title && context.title.toLowerCase().includes(queryLower)) {
        results.push({
          type: 'context',
          title: context.title,
          content: context.title,
          context: context
        });
      }

      // Search in steps
      if (context.steps) {
        context.steps.forEach(step => {
          if (step.title && step.title.toLowerCase().includes(queryLower)) {
            results.push({
              type: 'step',
              title: step.title,
              content: step.content,
              context: context
            });
          }
        });
      }

      // Search in tips
      if (context.tips) {
        context.tips.forEach(tip => {
          if (tip && tip.toLowerCase().includes(queryLower)) {
            results.push({
              type: 'tip',
              title: tip,
              content: tip,
              context: context
            });
          }
        });
      }

      // Search in common issues
      if (context.commonIssues) {
        context.commonIssues.forEach(issue => {
          if ((issue.problem && issue.problem.toLowerCase().includes(queryLower)) ||
              (issue.solution && issue.solution.toLowerCase().includes(queryLower))) {
            results.push({
              type: 'issue',
              title: issue.problem,
              content: issue.solution,
              context: context
            });
          }
        });
      }
    });

    return results;
  }, [helpData]);

  return {
    helpContext,
    isHelpVisible,
    showHelp,
    hideHelp,
    getContextualHelp,
    getHelpSuggestions,
    startTutorial,
    searchHelp,
    helpData
  };
};

export default useUserHelp;
