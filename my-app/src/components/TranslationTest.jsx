import React from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';

const TranslationTest = () => {
  const { t, language, changeLanguage } = useNewTranslation();

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold mb-2">Translation Test (Debug)</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p><strong>Current Language:</strong> {language}</p>
          <p><strong>Update Key:</strong> {updateKey}</p>
          <p><strong>Welcome:</strong> {t('welcomeBack')}</p>
          <p><strong>Location:</strong> {t('yourLocation')}</p>
          <p><strong>Nearest Farmers:</strong> {t('nearestFarmers')}</p>
          <p><strong>Total Orders:</strong> {t('totalOrders')}</p>
        </div>
        <div>
          <p className="font-medium mb-2">Quick Test:</p>
          <div className="space-x-2">
            <button 
              onClick={() => changeLanguage('en')} 
              className={`px-2 py-1 rounded text-xs ${
                language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              🇺🇸 EN
            </button>
            <button 
              onClick={() => changeLanguage('rw')} 
              className={`px-2 py-1 rounded text-xs ${
                language === 'rw' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}
            >
              🇷🇼 RW
            </button>
            <button 
              onClick={() => changeLanguage('fr')} 
              className={`px-2 py-1 rounded text-xs ${
                language === 'fr' ? 'bg-red-500 text-white' : 'bg-gray-200'
              }`}
            >
              🇫🇷 FR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationTest;
