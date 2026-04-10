import React, { useState } from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';

const AdvancedFilters = ({ 
  categories, 
  filters, 
  onFilterChange, 
  onClearFilters,
  priceRange,
  onPriceRangeChange 
}) => {
  const { t } = useNewTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterToggle = (filterType, value) => {
    const currentFilters = filters[filterType] || [];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(item => item !== value)
      : [...currentFilters, value];
    
    onFilterChange(filterType, newFilters);
  };

  const removeFilter = (filterType, value) => {
    const currentFilters = filters[filterType] || [];
    const newFilters = currentFilters.filter(item => item !== value);
    onFilterChange(filterType, newFilters);
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0) || 
                          (priceRange.min !== 0 || priceRange.max !== 1000);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{t('filters')}</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {t('clearAll')}
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(filters).map(([filterType, values]) =>
            values.map(value => (
              <span
                key={`${filterType}-${value}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
              >
                {value}
                <button
                  onClick={() => removeFilter(filterType, value)}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))
          )}
          {(priceRange.min > 0 || priceRange.max < 1000) && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              ${priceRange.min} - ${priceRange.max}
              <button
                onClick={() => onPriceRangeChange({ min: 0, max: 1000 })}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-6">
          {/* Price Range */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">{t('priceRange')}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange.min}
                  onChange={(e) => onPriceRangeChange({ ...priceRange, min: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-600 w-16">${priceRange.min}</span>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange.max}
                  onChange={(e) => onPriceRangeChange({ ...priceRange, max: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-600 w-16">${priceRange.max}</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">{t('categories')}</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {categories.map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories?.includes(category) || false}
                    onChange={() => handleFilterToggle('categories', category)}
                    className="mr-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Product Type */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Product Type</h4>
            <div className="space-y-2">
              {['Organic', 'Non-GMO', 'Premium', 'Seasonal'].map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.productType?.includes(type) || false}
                    onChange={() => handleFilterToggle('productType', type)}
                    className="mr-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Minimum Rating</h4>
            <div className="space-y-2">
              {[4, 3, 2, 1].map(rating => (
                <label key={rating} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.rating?.includes(rating.toString()) || false}
                    onChange={() => handleFilterToggle('rating', rating.toString())}
                    className="mr-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    {rating}+ Stars
                    <span className="ml-1 text-yellow-500">{'★'.repeat(rating)}{'☆'.repeat(5-rating)}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Availability</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.inStockOnly || false}
                onChange={(e) => onFilterChange('inStockOnly', e.target.checked)}
                className="mr-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">In Stock Only</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
