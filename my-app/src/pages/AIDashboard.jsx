import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useTranslation } from '../hooks/useTranslation';

const AIDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scan-crop');
  const [loading, setLoading] = useState(false);

  // Crop Scan State
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cropType, setCropType] = useState('');
  const [language, setLanguage] = useState('en');
  const [scanResult, setScanResult] = useState(null);
  const [supportedCrops, setSupportedCrops] = useState([]);

  // Disease Info State
  const [selectedCrop, setSelectedCrop] = useState('');
  const [diseaseInfo, setDiseaseInfo] = useState(null);

  // Weather State
  const [weatherLocation, setWeatherLocation] = useState('');
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [forecastDays, setForecastDays] = useState(5);
  const [supportedLocations, setSupportedLocations] = useState(null);

  // AI Assistant State
  const [query, setQuery] = useState('');
  const [assistantLanguage, setAssistantLanguage] = useState('en');
  const [chatHistory, setChatHistory] = useState([]);
  const [assistantResponse, setAssistantResponse] = useState(null);

  useEffect(() => {
    fetchSupportedCrops();
    fetchSupportedLocations();
  }, []);

  const fetchSupportedCrops = async () => {
    try {
      const response = await API.get('/api/ai/crops');
      setSupportedCrops(response.data.crops || response.data || []);
    } catch (error) {
      console.error('Error fetching crops:', error);
    }
  };

  const fetchSupportedLocations = async () => {
    try {
      const response = await API.get('/api/ai/locations');
      setSupportedLocations(response.data.locations || response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Crop Scan Handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleScanCrop = async () => {
    if (!selectedFile) {
      alert('Please select an image');
      return;
    }

    if (!cropType) {
      alert('Please select a crop type (required for analysis)');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('crop', cropType);
    formData.append('language', language);

    try {
      const response = await API.post('/api/ai/scan-crop', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setScanResult(response.data);
    } catch (error) {
      console.error('Error scanning crop:', error);
      const errorMessage = error.response?.data?.error || 'Failed to analyze image';
      if (error.response?.status === 400) {
        alert(`${errorMessage}\n\nTip: Select a crop type to use the knowledge base.`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Disease Info Handlers
  const handleFetchDiseaseInfo = async () => {
    if (!selectedCrop) {
      alert('Please select a crop');
      return;
    }

    setLoading(true);
    try {
      const response = await API.get(`/api/ai/diseases/${selectedCrop}`, {
        params: { language }
      });
      setDiseaseInfo(response.data);
    } catch (error) {
      console.error('Error fetching disease info:', error);
      alert('Failed to fetch disease information');
    } finally {
      setLoading(false);
    }
  };

  // Weather Handlers
  const handleGetCurrentWeather = async () => {
    if (!weatherLocation) {
      alert('Please enter a location');
      return;
    }

    setLoading(true);
    try {
      const response = await API.get(`/api/ai/weather/${weatherLocation}`, { 
        params: { language } 
      });
      setCurrentWeather(response.data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      alert('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleGetForecast = async () => {
    if (!weatherLocation) {
      alert('Please enter a location');
      return;
    }

    setLoading(true);
    try {
      const response = await API.get(`/api/ai/weather/${weatherLocation}/forecast`, { 
        params: { days: forecastDays, language } 
      });
      setForecastData(response.data);
    } catch (error) {
      console.error('Error fetching forecast:', error);
      alert('Failed to fetch forecast data');
    } finally {
      setLoading(false);
    }
  };

  // AI Assistant Handlers
  const handleAssistantQuery = async () => {
    if (!query.trim()) {
      alert('Please enter a question');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/ai/assistant', { 
        query, 
        language: assistantLanguage 
      });
      
      setChatHistory([...chatHistory, { query, response: response.data }]);
      setAssistantResponse(response.data);
      setQuery('');
    } catch (error) {
      console.error('Error processing query:', error);
      alert('Failed to process query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-emerald-600 hover:text-emerald-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Rwanda Agriculture</h1>
                <p className="text-sm text-gray-600">Smart farming tools for Rwanda</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex flex-wrap border-b">
            <button
              onClick={() => setActiveTab('scan-crop')}
              className={`flex-1 min-w-[150px] px-4 py-3 text-center font-medium transition-all ${
                activeTab === 'scan-crop'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              � Crop Scan
            </button>
            <button
              onClick={() => setActiveTab('disease-info')}
              className={`flex-1 min-w-[150px] px-4 py-3 text-center font-medium transition-all ${
                activeTab === 'disease-info'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🦠 Disease Info
            </button>
            <button
              onClick={() => setActiveTab('weather')}
              className={`flex-1 min-w-[150px] px-4 py-3 text-center font-medium transition-all ${
                activeTab === 'weather'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              ☁️ Weather
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex-1 min-w-[150px] px-4 py-3 text-center font-medium transition-all ${
                activeTab === 'assistant'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🤖 AI Assistant
            </button>
          </div>
        </div>

        {/* Crop Scan Tab */}
        {activeTab === 'scan-crop' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🌱 Crop Scan</h2>
            <p className="text-gray-600 mb-6">Upload a photo to identify the crop, detect diseases, and get treatment + prevention advice.</p>
            
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Crop Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-w-md h-auto rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>

              {/* Crop Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Type (Optional - helps with accuracy)
                </label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Auto-detect</option>
                  {supportedCrops.map((crop, index) => {
                    const cropName = typeof crop === 'string' ? crop : (crop.key || crop.english || crop.toString());
                    const displayName = crop.english || cropName;
                    return (
                      <option key={index} value={cropName}>{displayName.charAt(0).toUpperCase() + displayName.slice(1)}</option>
                    );
                  })}
                </select>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="en">English</option>
                  <option value="rw">Kinyarwanda</option>
                </select>
              </div>

              {/* Scan Button */}
              <button
                onClick={handleScanCrop}
                disabled={loading || !selectedFile}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Scan Crop'}
              </button>

              {/* Results */}
              {scanResult && scanResult.success && (
                <div className="mt-6 p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
                  
                  {scanResult.aiPowered && (
                    <div className="mb-4 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      AI-Powered Analysis
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crop:</span>
                      <span className="font-medium text-gray-900">{scanResult.result?.crop || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Health Status:</span>
                      <span className={`font-medium ${scanResult.result?.is_healthy ? 'text-green-600' : 'text-red-600'}`}>
                        {scanResult.result?.is_healthy ? 'Healthy' : 'Diseased'}
                      </span>
                    </div>
                    {scanResult.result?.disease && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Disease:</span>
                        <span className="font-medium text-gray-900">{scanResult.result.disease}</span>
                      </div>
                    )}
                    {scanResult.result?.symptoms && (
                      <div className="mt-4 pt-4 border-t border-emerald-200">
                        <p className="text-sm text-gray-600">
                          <strong>Symptoms:</strong> {scanResult.result.symptoms}
                        </p>
                      </div>
                    )}
                    {scanResult.result?.treatment && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <strong>Treatment:</strong> {scanResult.result.treatment}
                        </p>
                      </div>
                    )}
                    {scanResult.result?.prevention && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <strong>Prevention:</strong> {scanResult.result.prevention}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {scanResult && !scanResult.success && (
                <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-red-800">{scanResult.error || 'Failed to analyze image'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disease Info Tab */}
        {activeTab === 'disease-info' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🦠 Disease Info</h2>
            <p className="text-gray-600 mb-6">Get all known diseases for a specific crop with symptoms, treatment, and prevention measures.</p>
            
            <div className="space-y-6">
              {/* Crop Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Crop
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select a crop</option>
                  {supportedCrops.map((crop, index) => {
                    const cropName = typeof crop === 'string' ? crop : (crop.key || crop.english || crop.toString());
                    const displayName = crop.english || cropName;
                    return (
                      <option key={index} value={cropName}>{displayName.charAt(0).toUpperCase() + displayName.slice(1)}</option>
                    );
                  })}
                </select>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="en">English</option>
                  <option value="rw">Kinyarwanda</option>
                </select>
              </div>

              {/* Fetch Button */}
              <button
                onClick={handleFetchDiseaseInfo}
                disabled={loading || !selectedCrop}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Get Disease Info'}
              </button>

              {/* Results */}
              {diseaseInfo && diseaseInfo.success && (
                <div className="mt-6 p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Diseases for {selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)}
                  </h3>
                  
                  {diseaseInfo.diseases && Object.keys(diseaseInfo.diseases).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(diseaseInfo.diseases).map(([key, disease]) => (
                        <div key={key} className="p-4 bg-white rounded-lg border border-emerald-200">
                          <h4 className="font-semibold text-gray-900 mb-2">{disease.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Symptoms:</strong> {disease.symptoms}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Treatment:</strong> {disease.treatment}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Prevention:</strong> {disease.prevention}
                          </p>
                          {disease.severity && (
                            <div className="mt-2 inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Severity: {disease.severity}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No diseases found for this crop.</p>
                  )}
                </div>
              )}

              {diseaseInfo && !diseaseInfo.success && (
                <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-red-800">{diseaseInfo.error || 'Failed to fetch disease information'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weather Tab */}
        {activeTab === 'weather' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">☁️ Weather & Climate</h2>
            <p className="text-gray-600 mb-6">Get current weather and forecasts for any Rwanda district or province.</p>
            
            <div className="space-y-6">
              {/* Location Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Province or District)
                </label>
                <input
                  type="text"
                  value={weatherLocation}
                  onChange={(e) => setWeatherLocation(e.target.value)}
                  placeholder="e.g., Kigali, Musanze, Huye"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                {supportedLocations && (
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: {Object.keys(supportedLocations).join(', ')}
                  </p>
                )}
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="en">English</option>
                  <option value="rw">Kinyarwanda</option>
                </select>
              </div>

              {/* Weather Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleGetCurrentWeather}
                  disabled={loading || !weatherLocation}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  Current Weather
                </button>
                <button
                  onClick={handleGetForecast}
                  disabled={loading || !weatherLocation}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {forecastDays}-Day Forecast
                </button>
              </div>

              {/* Forecast Days Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forecast Days (1-7)
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={forecastDays}
                  onChange={(e) => setForecastDays(Math.min(7, Math.max(1, parseInt(e.target.value) || 5)))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Current Weather Results */}
              {currentWeather && currentWeather.success && (
                <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Current Weather - {currentWeather.location?.name || weatherLocation}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {currentWeather.temperature?.current || currentWeather.temperature}°C
                      </div>
                      <div className="text-sm text-gray-600">Temperature</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {currentWeather.humidity}%
                      </div>
                      <div className="text-sm text-gray-600">Humidity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {currentWeather.wind?.speed || currentWeather.windSpeed} m/s
                      </div>
                      <div className="text-sm text-gray-600">Wind Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600 capitalize">
                        {currentWeather.conditions || currentWeather.weather}
                      </div>
                      <div className="text-sm text-gray-600">Conditions</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Forecast Results */}
              {forecastData && forecastData.success && (
                <div className="mt-6 p-6 bg-purple-50 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {forecastDays}-Day Forecast - {forecastData.location?.name || weatherLocation}
                  </h3>
                  
                  <div className="space-y-3">
                    {forecastData.forecast && forecastData.forecast.map((day, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{day.date}</div>
                          <div className="text-sm text-gray-600 capitalize">{day.conditions || day.weather}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {day.temperature?.min || day.tempMin}° - {day.temperature?.max || day.tempMax}°C
                          </div>
                          <div className="text-sm text-gray-600">{day.precipitation || day.rain}% rain</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentWeather && !currentWeather.success && (
                <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-red-800">{currentWeather.error || 'Failed to fetch weather data'}</p>
                </div>
              )}

              {forecastData && !forecastData.success && (
                <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-red-800">{forecastData.error || 'Failed to fetch forecast data'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'assistant' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🤖 AI Assistant</h2>
            <p className="text-gray-600 mb-6">Bilingual (EN / RW) chatbot — answers ANY agriculture question.</p>
            
            <div className="space-y-6">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language / Ururimi
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setAssistantLanguage('en')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      assistantLanguage === 'en'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setAssistantLanguage('rw')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      assistantLanguage === 'rw'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Kinyarwanda
                  </button>
                </div>
              </div>

              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="max-h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-xl">
                  {chatHistory.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg max-w-md">
                          {item.query}
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg max-w-md">
                          <div className="text-sm text-gray-700">
                            {typeof item.response.answer === 'object' 
                              ? JSON.stringify(item.response.answer, null, 2)
                              : item.response.answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Query Input */}
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAssistantQuery()}
                  placeholder={assistantLanguage === 'rw' 
                    ? 'Andika ibibazo ku buhinzi...' 
                    : 'Ask about farming, crops, weather...'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleAssistantQuery}
                  disabled={loading || !query.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {loading ? 'Thinking...' : 'Send'}
                </button>
              </div>

              {/* Latest Response */}
              {assistantResponse && assistantResponse.success && (
                <div className="mt-6 p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Response</h3>
                  <div className="text-sm text-gray-700">
                    {typeof assistantResponse.answer === 'object' 
                      ? Object.entries(assistantResponse.answer).map(([key, value]) => (
                          <div key={key} className="mb-2">
                            <strong className="text-gray-900">{key}:</strong>
                            <span className="ml-2">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                          </div>
                        ))
                      : assistantResponse.answer}
                  </div>
                  
                  {assistantResponse.provider && (
                    <div className="mt-4 pt-4 border-t border-emerald-200">
                      <p className="text-xs text-gray-500">
                        Powered by: {assistantResponse.provider}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {assistantResponse && !assistantResponse.success && (
                <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-red-800">{assistantResponse.error || 'Failed to process query'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDashboard;
