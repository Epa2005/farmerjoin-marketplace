import React, { useState, useEffect } from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';

const LocationSearch = ({ onLocationSelect, placeholder }) => {
  const { t } = useNewTranslation();
  const finalPlaceholder = placeholder || t('enterLocation');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock location data - in real app, this would come from a geocoding API
  const mockLocations = [
    { city: t('newYork'), state: t('newYorkState'), lat: 40.7128, lng: -74.0060, distance: 0 },
    { city: t('losAngeles'), state: t('california'), lat: 34.0522, lng: -118.2437, distance: 0 },
    { city: t('chicago'), state: t('illinois'), lat: 41.8781, lng: -87.6298, distance: 0 },
    { city: t('houston'), state: t('texas'), lat: 29.7604, lng: -95.3698, distance: 0 },
    { city: t('phoenix'), state: t('arizona'), lat: 33.4484, lng: -112.0740, distance: 0 },
    { city: t('philadelphia'), state: t('pennsylvania'), lat: 39.9526, lng: -75.1652, distance: 0 },
    { city: t('sanAntonio'), state: t('texas'), lat: 29.4241, lng: -98.4936, distance: 0 },
    { city: t('sanDiego'), state: t('california'), lat: 32.7157, lng: -117.1611, distance: 0 },
    { city: t('dallas'), state: t('texas'), lat: 32.7767, lng: -96.7970, distance: 0 },
    { city: t('sanJose'), state: t('california'), lat: 37.3382, lng: -121.8863, distance: 0 }
  ];

  useEffect(() => {
    if (searchTerm.length > 2) {
      const filtered = mockLocations.filter(location =>
        location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${location.city}, ${location.state}`.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);
      
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  const getCurrentLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            city: t('currentLocation'),
            state: ''
          };
          setUserLocation(location);
          onLocationSelect(location);
          setIsLoading(false);
          setSearchTerm('Current Location');
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSearchTerm(`${location.city}, ${location.state}`);
    setSuggestions([]);
    onLocationSelect(location);
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Use current location"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-b-2 border-gray-600 rounded-full"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((location, index) => (
            <button
              key={index}
              onClick={() => handleLocationSelect(location)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">
                    {location.city}, {location.state}
                  </div>
                  {userLocation && (
                    <div className="text-sm text-gray-500">
                      {calculateDistance(userLocation.lat, userLocation.lng, location.lat, location.lng).toFixed(1)} miles away
                    </div>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
