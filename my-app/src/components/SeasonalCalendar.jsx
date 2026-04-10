import React, { useState } from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';

const SeasonalCalendar = () => {
  const { t } = useNewTranslation();
  const [selectedSeason, setSelectedSeason] = useState('current');
  
  const currentMonth = new Date().getMonth() + 1;
  const currentSeason = getSeason(currentMonth);
  
  const seasonalData = {
    spring: {
      months: [t('march'), t('april'), t('may')],
      products: [
        { name: t('asparagus'), icon: '🥦', description: t('asparagusDescription') },
        { name: t('spinach'), icon: '🥬', description: t('spinachDescription') },
        { name: t('radishes'), icon: '🌶️', description: t('radishesDescription') },
        { name: t('strawberries'), icon: '🍓', description: t('strawberriesDescription') },
        { name: t('peas'), icon: '🟢', description: t('peasDescription') },
        { name: t('lettuce'), icon: '🥗', description: t('lettuceDescription') }
      ]
    },
    summer: {
      months: [t('june'), t('july'), t('august')],
      products: [
        { name: t('tomatoes'), icon: '🍅', description: t('tomatoesDescription') },
        { name: t('corn'), icon: '🌽', description: t('cornDescription') },
        { name: t('bellPeppers'), icon: '🫑', description: t('bellPeppersDescription') },
        { name: t('zucchini'), icon: '🥒', description: t('zucchiniDescription') },
        { name: t('blueberries'), icon: '🫐', description: t('blueberriesDescription') },
        { name: t('peaches'), icon: '🍑', description: t('peachesDescription') }
      ]
    },
    fall: {
      months: [t('september'), t('october'), t('november')],
      products: [
        { name: t('apples'), icon: '🍎', description: t('applesDescription') },
        { name: t('pumpkins'), icon: '🎃', description: t('pumpkinsDescription') },
        { name: t('sweetPotatoes'), icon: '🍠', description: t('sweetPotatoesDescription') },
        { name: t('brusselsSprouts'), icon: '🥦', description: t('brusselsSproutsDescription') },
        { name: t('grapes'), icon: '🍇', description: t('grapesDescription') },
        { name: t('pears'), icon: '🍐', description: t('pearsDescription') }
      ]
    },
    winter: {
      months: [t('december'), t('january'), t('february')],
      products: [
        { name: t('carrots'), icon: '🥕', description: t('carrotsDescription') },
        { name: t('kale'), icon: '🥬', description: t('kaleDescription') },
        { name: t('citrus'), icon: '🍊', description: t('citrusDescription') },
        { name: t('beets'), icon: '🍓', description: t('beetsDescription') },
        { name: t('cabbage'), icon: '🥬', description: t('cabbageDescription') },
        { name: t('onions'), icon: '🧅', description: t('onionsDescription') }
      ]
    }
  };

  function getSeason(month) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  const getSeasonData = () => {
    if (selectedSeason === 'current') {
      return seasonalData[currentSeason];
    }
    return seasonalData[selectedSeason];
  };

  const seasonData = getSeasonData();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">🌱 Seasonal Produce Calendar</h2>
        <div className="flex space-x-2">
          {Object.keys(seasonalData).map(season => (
            <button
              key={season}
              onClick={() => setSelectedSeason(season)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedSeason === season || (selectedSeason === 'current' && season === currentSeason)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {season.charAt(0).toUpperCase() + season.slice(1)}
              {season === currentSeason && ' (Now)'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {seasonData.months.join(' - ')}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasonData.products.map((product, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{product.icon}</span>
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
              </div>
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-800 mb-2">💡 Why Buy Seasonal?</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Better taste and nutrition</li>
          <li>• Lower prices and better value</li>
          <li>• Supports local farming cycles</li>
          <li>• Reduces environmental impact</li>
          <li>• Connects you to nature's rhythms</li>
        </ul>
      </div>
    </div>
  );
};

export default SeasonalCalendar;
