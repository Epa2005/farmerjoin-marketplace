import React, { useState, useEffect } from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';

const SearchFilter = ({ onSearch, onFilter, categories = [] }) => {
  const { t } = useNewTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [sortBy, setSortBy] = useState('name');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch?.(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearch]);

  useEffect(() => {
    onFilter?.({
      category: selectedCategory,
      priceRange,
      sortBy
    });
  }, [selectedCategory, priceRange, sortBy, onFilter]);

  return (
    <div className="sticky top-24 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8 animate-fade-in">
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-gray-400 text-xl">search</span>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchProducts') || 'Search for fresh vegetables, fruits, dairy...'}
          className="input-field pl-12 pr-12 py-4 text-lg"
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
          <button
            onClick={() => setSearchTerm('')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {searchTerm && <span className="text-xl">x</span>}
          </button>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('filters') || 'Filters'}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
        >
          <span className="text-sm font-medium">
            {isExpanded ? (t('hideFilters') || 'Hide Filters') : (t('showFilters') || 'Show Filters')}
          </span>
          <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            chevron-down
          </span>
        </button>
      </div>

      {/* Expandable Filters */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('category') || 'Category'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('all') || 'All'}
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 capitalize ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('priceRange') || 'Price Range'}
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    max={priceRange.max}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                    className="input-field pl-8"
                    placeholder="Min"
                  />
                </div>
              </div>
              <div className="text-gray-500">-</div>
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min={priceRange.min}
                    max="1000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 100 })}
                    className="input-field pl-8"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
            {/* Price Range Slider */}
            <div className="mt-3">
              <input
                type="range"
                min="0"
                max="100"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('sortBy') || 'Sort By'}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="name">{t('name') || 'Name'}</option>
              <option value="price-low">{t('priceLowToHigh') || 'Price: Low to High'}</option>
              <option value="price-high">{t('priceHighToLow') || 'Price: High to Low'}</option>
              <option value="newest">{t('newest') || 'Newest First'}</option>
              <option value="rating">{t('rating') || 'Highest Rated'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedCategory !== 'all' || priceRange.min > 0 || priceRange.max < 100) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <div className="badge badge-success flex items-center space-x-1">
                <span>{selectedCategory}</span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="ml-1 hover:text-primary-800"
                >
                  x
                </button>
              </div>
            )}
            {priceRange.min > 0 && (
              <div className="badge badge-warning flex items-center space-x-1">
                <span>Min: ${priceRange.min}</span>
                <button
                  onClick={() => setPriceRange({ ...priceRange, min: 0 })}
                  className="ml-1 hover:text-amber-800"
                >
                  x
                </button>
              </div>
            )}
            {priceRange.max < 100 && (
              <div className="badge badge-warning flex items-center space-x-1">
                <span>Max: ${priceRange.max}</span>
                <button
                  onClick={() => setPriceRange({ ...priceRange, max: 100 })}
                  className="ml-1 hover:text-amber-800"
                >
                  x
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
