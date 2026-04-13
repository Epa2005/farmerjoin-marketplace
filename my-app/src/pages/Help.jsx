import React, { useState } from 'react';
import { useUserHelp } from '../hooks/useUserHelp';
import { useTranslation } from '../hooks/useTranslation';
import HelpButton from '../components/HelpButton';
import SystemAssistant from '../components/SystemAssistant';

const Help = () => {
  const { t } = useTranslation();
  const { searchHelp, getContextualHelp, helpData } = useUserHelp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('registration');
  const [selectedTopic, setSelectedTopic] = useState(null);

  const helpCategories = [
    { id: 'registration', name: t('gettingStarted'), icon: '🚀' },
    { id: 'productListing', name: t('sellingProducts'), icon: '🌾' },
    { id: 'orderManagement', name: t('managingOrders'), icon: '📦' },
    { id: 'dashboard', name: t('usingDashboard'), icon: '📊' },
    { id: 'profileManagement', name: t('managingProfile'), icon: '👤' }
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchHelp(query, selectedCategory);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedTopic(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('helpCenter')}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('helpCenterDescription')}
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {helpCategories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-2 ${
                selectedCategory === category.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {category.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {getContextualHelp(category.id).title}
              </p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t('searchHelpPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <button
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {t('search')}
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {t('searchResults')} ({searchResults.length})
            </h3>
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleTopicSelect(result)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {result.type === 'context' && '📋'}
                      {result.type === 'step' && '📝'}
                      {result.type === 'tip' && '💡'}
                      {result.type === 'issue' && '⚠️'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 mb-1">
                        {result.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.content}
                      </div>
                      <div className="text-xs text-emerald-600 mt-1">
                        {t('inCategory')}: {getContextualHelp(result.context.id).title}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Help Content */}
        {!searchQuery && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Selected Category Help */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {getContextualHelp(selectedCategory).title}
              </h2>

              {/* Steps */}
              {helpData[selectedCategory].steps && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    {t('quickSteps')}
                  </h3>
                  <div className="space-y-4">
                    {helpData[selectedCategory].steps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-2">
                            {step.title}
                          </h4>
                          <p className="text-gray-600">
                            {step.content}
                          </p>
                          {step.tips && (
                            <div className="mt-2 p-3 bg-blue-50 rounded">
                              <div className="text-sm font-medium text-blue-800 mb-1">
                                {t('tips')}:
                              </div>
                              <ul className="text-sm text-blue-600 space-y-1">
                                {step.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="flex items-start space-x-2">
                                    <span>•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Practices */}
              {helpData[selectedCategory].bestPractices && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    {t('bestPractices')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {helpData[selectedCategory].bestPractices.map((practice, index) => (
                      <div key={index} className="bg-emerald-50 border border-emerald-200 rounded p-3">
                        <div className="text-sm font-medium text-emerald-800">
                          ✓ {practice}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Issues */}
              {helpData[selectedCategory].commonIssues && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    {t('commonIssues')}
                  </h3>
                  <div className="space-y-3">
                    {helpData[selectedCategory].commonIssues.map((issue, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded p-4">
                        <div className="flex items-start space-x-3">
                          <div className="text-red-500 text-lg">⚠️</div>
                          <div className="flex-1">
                            <div className="font-medium text-red-800 mb-1">
                              {issue.problem}
                            </div>
                            <div className="text-sm text-red-600">
                              {t('solution')}: {issue.solution}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Assistant */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {t('aiAssistant')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('aiAssistantDescription')}
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
                <SystemAssistant />
              </div>
            </div>
          </div>
        )}

        {/* Contact Support */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {t('needMoreHelp')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                {t('contactSupport')}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📧 {t('supportEmail')}: support@farmerjoin.rw</p>
                <p>📞 {t('phone')}: +250 788 123 456</p>
                <p>💬 {t('liveChat')}: Available in app</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                {t('supportHours')}
              </h3>
              <div className="text-sm text-gray-600">
                <p>🕐 {t('weekdays')}: 8:00 AM - 6:00 PM</p>
                <p> {t('saturdays')}: 9:00 AM - 2:00 PM</p>
                <p> {t('sundays')}: Closed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Button */}
        <HelpButton context="general" />
      </div>
    </div>
  );
};

export default Help;
