import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const SubscriptionBoxes = () => {
  const { t } = useTranslation();
  const [selectedBox, setSelectedBox] = useState(null);
  const [deliveryFrequency, setDeliveryFrequency] = useState('weekly');

  const subscriptionBoxes = [
    {
      id: 'basic',
      name: 'Basic Harvest Box',
      price: 29.99,
      description: 'Perfect for individuals and small families',
      items: ['5-7 seasonal vegetables', '2-3 seasonal fruits', 'Fresh herbs'],
      icon: '🥬',
      popular: false,
      savings: '15%'
    },
    {
      id: 'family',
      name: 'Family Harvest Box',
      price: 49.99,
      description: 'Ideal for families of 3-4 people',
      items: ['8-10 seasonal vegetables', '4-5 seasonal fruits', 'Fresh herbs', 'Specialty items'],
      icon: '🍎',
      popular: true,
      savings: '20%'
    },
    {
      id: 'premium',
      name: 'Premium Organic Box',
      price: 69.99,
      description: '100% organic certified produce',
      items: ['10-12 organic vegetables', '6-8 organic fruits', 'Fresh herbs', 'Specialty organic items', 'Honey/Jam'],
      icon: '🌿',
      popular: false,
      savings: '25%'
    }
  ];

  const frequencyOptions = [
    { value: 'weekly', label: 'Weekly', discount: '0%' },
    { value: 'biweekly', label: 'Bi-Weekly', discount: '5%' },
    { value: 'monthly', label: 'Monthly', discount: '10%' }
  ];

  const calculatePrice = (basePrice, frequency) => {
    const option = frequencyOptions.find(opt => opt.value === frequency);
    const discount = parseFloat(option.discount) / 100;
    return (basePrice * (1 - discount)).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('farmToDoorSubscription') || '🌾 Farm-to-Door Subscription Boxes'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subscriptionDescription') || 'Get fresh, seasonal produce delivered directly from local farms to your doorstep. Support local farmers while enjoying the best of each season\'s harvest.'}
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">{t('fresh100') || '100% Fresh'}</h3>
            <p className="text-sm text-gray-600">{t('harvested24Hours') || 'Harvested within 24 hours'}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">{t('greatValue') || 'Great Value'}</h3>
            <p className="text-sm text-gray-600">{t('saveUpTo25') || 'Save up to 25% vs retail'}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">{t('supportLocal') || 'Support Local'}</h3>
            <p className="text-sm text-gray-600">{t('directFarmPartnerships') || 'Direct farm partnerships'}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">{t('flexible') || 'Flexible'}</h3>
            <p className="text-sm text-gray-600">{t('pauseCancelAnytime') || 'Pause or cancel anytime'}</p>
          </div>
        </div>

        {/* Delivery Frequency */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('chooseDeliveryFrequency') || 'Choose Delivery Frequency'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {frequencyOptions.map(option => (
              <label key={option.value} className="relative">
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={deliveryFrequency === option.value}
                  onChange={(e) => setDeliveryFrequency(e.target.value)}
                  className="sr-only"
                />
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  deliveryFrequency === option.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{option.label}</span>
                    {option.discount !== '0%' && (
                      <span className="text-green-600 font-semibold">{option.discount} {t('off') || 'off'}</span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Subscription Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {subscriptionBoxes.map(box => (
            <div
              key={box.id}
              className={`relative bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
                selectedBox === box.id ? 'ring-2 ring-green-500 transform scale-105' : 'hover:shadow-lg'
              }`}
            >
              {box.popular && (
                <div className="absolute top-0 right-0 bg-green-600 text-white px-3 py-1 text-sm font-semibold">
                  {t('mostPopular') || 'Most Popular'}
                </div>
              )}
              
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{box.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-800">{box.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{box.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-green-600">
                    ${calculatePrice(box.price, deliveryFrequency)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('perDelivery') || 'per delivery'} • {t('save') || 'Save'} {box.savings}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-2">{t('whatsInside') || "What's Inside:"}</h4>
                  <ul className="space-y-1">
                    {box.items.map((item, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setSelectedBox(box.id)}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    selectedBox === box.id
                      ? 'bg-green-600 text-white'
                      : 'border border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {selectedBox === box.id ? t('selected') || 'Selected' : t('selectThisBox') || 'Select This Box'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">{t('howItWorks') || 'How It Works'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('chooseYourBox') || 'Choose Your Box'}</h3>
              <p className="text-sm text-gray-600">{t('selectPerfectSize') || 'Select the perfect size for your household'}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('setDeliverySchedule') || 'Set Delivery Schedule'}</h3>
              <p className="text-sm text-gray-600">{t('pickWeeklyBiWeeklyMonthly') || 'Pick weekly, bi-weekly, or monthly deliveries'}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('receiveFreshProduce') || 'Receive Fresh Produce'}</h3>
              <p className="text-sm text-gray-600">{t('enjoySeasonalHarvests') || 'Enjoy seasonal harvests at your doorstep'}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                4
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('cookEnjoy') || 'Cook & Enjoy'}</h3>
              <p className="text-sm text-gray-600">{t('discoverNewRecipes') || 'Discover new recipes and flavors'}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {selectedBox && (
          <div className="bg-green-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('readyToStartFarmFresh') || 'Ready to Start Your Farm Fresh Journey?'}</h2>
            <p className="mb-6">
              {t('getYourBoxDelivered') || 'Get your'} {subscriptionBoxes.find(b => b.id === selectedBox).name} {t('deliveredToDoorstep') || 'delivered to your doorstep'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-green-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t('getStartedNow') || 'Get Started Now'}
              </Link>
              <button className="border-2 border-white text-white font-semibold py-3 px-6 rounded-lg hover:bg-white hover:text-green-600 transition-colors">
                {t('learnMore') || 'Learn More'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionBoxes;
