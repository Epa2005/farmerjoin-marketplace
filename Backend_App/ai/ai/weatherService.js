const axios = require('axios');

/**
 * Weather and Climate Service for Rwanda
 * Provides weather forecasts and agricultural recommendations
 */
class WeatherService {
    constructor() {
        // Rwanda provinces and their coordinates
        this.rwandaProvinces = {
            'Kigali': { lat: -1.9536, lon: 30.0606, elevation: 1567 },
            'Northern': { lat: -1.4833, lon: 29.8333, elevation: 2000 },
            'Southern': { lat: -2.4167, lon: 29.8333, elevation: 1800 },
            'Eastern': { lat: -1.3833, lon: 30.4167, elevation: 1500 },
            'Western': { lat: -2.0833, lon: 29.2833, elevation: 1600 }
        };

        // Rwanda districts with coordinates
        this.rwandaDistricts = {
            'Kigali': [
                { name: 'Gasabo', lat: -1.9167, lon: 30.1333 },
                { name: 'Kicukiro', lat: -2.0000, lon: 30.0667 },
                { name: 'Nyarugenge', lat: -1.9833, lon: 30.0500 }
            ],
            'Northern': [
                { name: 'Musanze', lat: -1.5000, lon: 29.6333 },
                { name: 'Burera', lat: -1.4667, lon: 29.8333 },
                { name: 'Gakenke', lat: -1.7167, lon: 29.8167 },
                { name: 'Rulindo', lat: -1.6667, lon: 29.9333 },
                { name: 'Gicumbi', lat: -1.5667, lon: 30.0833 }
            ],
            'Southern': [
                { name: 'Huye', lat: -2.5833, lon: 29.7667 },
                { name: 'Muhanga', lat: -2.2000, lon: 29.7500 },
                { name: 'Nyanza', lat: -2.3167, lon: 29.7333 },
                { name: 'Gisagara', lat: -2.6000, lon: 30.0833 },
                { name: 'Nyaruguru', lat: -2.7167, lon: 29.4667 },
                { name: 'Ruhango', lat: -2.2333, lon: 29.7833 },
                { name: 'Kamonyi', lat: -2.1333, lon: 30.0333 },
                { name: 'Rwamagana', lat: -1.9500, lon: 30.4167 }
            ],
            'Eastern': [
                { name: 'Rwamagana', lat: -1.9500, lon: 30.4167 },
                { name: 'Ngoma', lat: -2.1333, lon: 30.5000 },
                { name: 'Kayonza', lat: -1.8167, lon: 30.3667 },
                { name: 'Kirehe', lat: -2.2833, lon: 30.4000 },
                { name: 'Nyagatare', lat: -1.3000, lon: 30.2500 },
                { name: 'Gatsibo', lat: -1.6167, lon: 30.3167 }
            ],
            'Western': [
                { name: 'Rubavu', lat: -1.6667, lon: 29.2500 },
                { name: 'Rutsiro', lat: -1.8667, lon: 29.4167 },
                { name: 'Karongi', lat: -2.0833, lon: 29.2500 },
                { name: 'Ngororero', lat: -1.8833, lon: 29.6333 },
                { name: 'Nyabihu', lat: -1.5000, lon: 29.4167 },
                { name: 'Nyamasheke', lat: -2.1667, lon: 29.1833 }
            ]
        };

        // Crop planting seasons in Rwanda
        this.seasons = {
            'Season A': {
                months: ['September', 'October', 'November', 'December', 'January', 'February'],
                crops: ['beans', 'maize', 'sweet potatoes', 'Irish potatoes', 'vegetables'],
                description: 'Short rainy season (September to February)'
            },
            'Season B': {
                months: ['March', 'April', 'May', 'June'],
                crops: ['beans', 'maize', 'sorghum', 'soybeans', 'peas'],
                description: 'Long rainy season (March to June)'
            },
            'Season C': {
                months: ['July', 'August'],
                crops: ['vegetables', 'sweet potatoes', 'cassava'],
                description: 'Dry season (July to August) - irrigation needed'
            }
        };

        // Weather API configuration (using OpenWeatherMap or similar)
        this.weatherAPIKey = process.env.WEATHER_API_KEY || '';
        this.weatherAPIBaseURL = 'https://api.openweathermap.org/data/2.5';
    }

    /**
     * Get current weather for a location in Rwanda
     * @param {string} location - Province or district name
     * @returns {Object} Current weather data
     */
    async getCurrentWeather(location) {
        try {
            const coords = this.getLocationCoordinates(location);
            
            if (!coords) {
                return {
                    success: false,
                    error: 'Location not found in Rwanda database',
                    message: 'Please specify a valid Rwanda province or district'
                };
            }

            // Try to get real weather data if API key is available
            if (this.weatherAPIKey) {
                const response = await axios.get(
                    `${this.weatherAPIBaseURL}/weather`,
                    {
                        params: {
                            lat: coords.lat,
                            lon: coords.lon,
                            appid: this.weatherAPIKey,
                            units: 'metric'
                        }
                    }
                );
                
                return this.formatWeatherData(response.data, location);
            } else {
                // Return simulated weather data for development
                return this.getSimulatedWeather(coords, location);
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
            // Fallback to simulated data
            const coords = this.getLocationCoordinates(location);
            if (coords) {
                return this.getSimulatedWeather(coords, location);
            }
            return {
                success: false,
                error: 'Failed to fetch weather data',
                message: error.message
            };
        }
    }

    /**
     * Get weather forecast for a location
     * @param {string} location - Province or district name
     * @param {number} days - Number of days (1-7)
     * @returns {Object} Weather forecast data
     */
    async getWeatherForecast(location, days = 5) {
        try {
            const coords = this.getLocationCoordinates(location);
            
            if (!coords) {
                return {
                    success: false,
                    error: 'Location not found in Rwanda database'
                };
            }

            if (this.weatherAPIKey) {
                const response = await axios.get(
                    `${this.weatherAPIBaseURL}/forecast`,
                    {
                        params: {
                            lat: coords.lat,
                            lon: coords.lon,
                            appid: this.weatherAPIKey,
                            units: 'metric',
                            cnt: days * 8 // 8 forecasts per day (3-hour intervals)
                        }
                    }
                );
                
                return this.formatForecastData(response.data, location, days);
            } else {
                return this.getSimulatedForecast(coords, location, days);
            }
        } catch (error) {
            console.error('Error fetching forecast data:', error);
            const coords = this.getLocationCoordinates(location);
            if (coords) {
                return this.getSimulatedForecast(coords, location, days);
            }
            return {
                success: false,
                error: 'Failed to fetch forecast data'
            };
        }
    }

    /**
     * Get agricultural recommendations based on weather
     * @param {string} location - Province or district name
     * @returns {Object} Agricultural recommendations
     */
    async getAgriculturalRecommendations(location) {
        try {
            const weather = await this.getCurrentWeather(location);
            
            if (!weather.success) {
                return weather;
            }

            const currentMonth = new Date().toLocaleString('default', { month: 'long' });
            const currentSeason = this.getCurrentSeason(currentMonth);

            const recommendations = {
                location: location,
                currentSeason: currentSeason,
                weather: weather,
                plantingAdvice: this.getPlantingAdvice(currentSeason, weather),
                irrigationAdvice: this.getIrrigationAdvice(weather),
                pestAlert: this.getPestAlert(weather),
                fertilizerAdvice: this.getFertilizerAdvice(currentSeason),
                harvestAdvice: this.getHarvestAdvice(currentSeason)
            };

            return {
                success: true,
                data: recommendations
            };
        } catch (error) {
            console.error('Error generating recommendations:', error);
            return {
                success: false,
                error: 'Failed to generate recommendations'
            };
        }
    }

    /**
     * Get coordinates for a location in Rwanda
     */
    getLocationCoordinates(location) {
        const locationLower = location.toLowerCase();
        
        // Check provinces
        for (const province in this.rwandaProvinces) {
            if (province.toLowerCase() === locationLower) {
                return this.rwandaProvinces[province];
            }
        }

        // Check districts
        for (const province in this.rwandaDistricts) {
            const district = this.rwandaDistricts[province].find(
                d => d.name.toLowerCase() === locationLower
            );
            if (district) {
                return { lat: district.lat, lon: district.lon, elevation: 1500 };
            }
        }

        return null;
    }

    /**
     * Format weather data for API response
     */
    formatWeatherData(data, location) {
        return {
            success: true,
            location: location,
            temperature: {
                current: Math.round(data.main.temp),
                feels_like: Math.round(data.main.feels_like),
                min: Math.round(data.main.temp_min),
                max: Math.round(data.main.temp_max)
            },
            humidity: data.main.humidity,
            wind: {
                speed: data.wind.speed,
                direction: data.wind.deg
            },
            conditions: data.weather[0].description,
            icon: data.weather[0].icon,
            pressure: data.main.pressure,
            visibility: data.visibility / 1000, // Convert to km
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Format forecast data
     */
    formatForecastData(data, location, days) {
        const dailyForecasts = [];
        
        // Group forecasts by day
        const forecastsByDay = {};
        data.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000).toLocaleDateString();
            if (!forecastsByDay[date]) {
                forecastsByDay[date] = [];
            }
            forecastsByDay[date].push(forecast);
        });

        // Calculate daily averages
        Object.keys(forecastsByDay).slice(0, days).forEach(date => {
            const dayForecasts = forecastsByDay[date];
            const temps = dayForecasts.map(f => f.main.temp);
            const conditions = dayForecasts.map(f => f.weather[0].description);
            
            dailyForecasts.push({
                date: date,
                temperature: {
                    min: Math.round(Math.min(...temps)),
                    max: Math.round(Math.max(...temps)),
                    avg: Math.round(temps.reduce((a, b) => a + b) / temps.length)
                },
                conditions: this.getMostCommon(conditions),
                humidity: Math.round(dayForecasts[0].main.humidity),
                precipitation: dayForecasts[0].pop || 0
            });
        });

        return {
            success: true,
            location: location,
            forecast: dailyForecasts,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get simulated weather data (for development)
     */
    getSimulatedWeather(coords, location) {
        const baseTemp = 20 + (coords.elevation / 1000) * -6.5; // Temperature decreases with elevation
        const currentHour = new Date().getHours();
        const isDaytime = currentHour >= 6 && currentHour <= 18;
        
        return {
            success: true,
            location: location,
            temperature: {
                current: Math.round(baseTemp + (isDaytime ? 5 : -3)),
                feels_like: Math.round(baseTemp + (isDaytime ? 4 : -4)),
                min: Math.round(baseTemp - 5),
                max: Math.round(baseTemp + 8)
            },
            humidity: 70 + Math.floor(Math.random() * 20),
            wind: {
                speed: (Math.random() * 10 + 5).toFixed(1),
                direction: Math.floor(Math.random() * 360)
            },
            conditions: isDaytime ? 'partly cloudy' : 'clear sky',
            icon: isDaytime ? '02d' : '01n',
            pressure: 1013 + Math.floor(Math.random() * 20 - 10),
            visibility: 10,
            timestamp: new Date().toISOString(),
            note: 'Simulated data - Weather API key not configured'
        };
    }

    /**
     * Get simulated forecast
     */
    getSimulatedForecast(coords, location, days) {
        const forecast = [];
        const baseTemp = 20 + (coords.elevation / 1000) * -6.5;
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            forecast.push({
                date: date.toLocaleDateString(),
                temperature: {
                    min: Math.round(baseTemp - 5 + Math.random() * 3),
                    max: Math.round(baseTemp + 8 + Math.random() * 3),
                    avg: Math.round(baseTemp + Math.random() * 2)
                },
                conditions: ['sunny', 'partly cloudy', 'cloudy', 'light rain'][Math.floor(Math.random() * 4)],
                humidity: 60 + Math.floor(Math.random() * 30),
                precipitation: Math.random() > 0.5 ? Math.round(Math.random() * 50) : 0
            });
        }

        return {
            success: true,
            location: location,
            forecast: forecast,
            timestamp: new Date().toISOString(),
            note: 'Simulated data - Weather API key not configured'
        };
    }

    /**
     * Get current season based on month
     */
    getCurrentSeason(month) {
        for (const season in this.seasons) {
            if (this.seasons[season].months.includes(month)) {
                return {
                    name: season,
                    description: this.seasons[season].description,
                    crops: this.seasons[season].crops
                };
            }
        }
        return {
            name: 'Off-season',
            description: 'Transition period',
            crops: []
        };
    }

    /**
     * Get planting advice based on season and weather
     */
    getPlantingAdvice(season, weather) {
        const advice = [];
        
        if (season.name === 'Season A' || season.name === 'Season B') {
            advice.push(`Ideal time to plant: ${season.crops.join(', ')}`);
            if (weather.temperature.current > 25) {
                advice.push('Temperature is good for germination');
            } else {
                advice.push('Consider starting seeds in nursery before transplanting');
            }
        } else if (season.name === 'Season C') {
            advice.push('Dry season - irrigation required for most crops');
            advice.push('Focus on drought-resistant crops like cassava and sweet potatoes');
        }

        if (weather.conditions.includes('rain')) {
            advice.push('Good moisture for planting - consider planting immediately');
        }

        return advice;
    }

    /**
     * Get irrigation advice
     */
    getIrrigationAdvice(weather) {
        const advice = [];
        
        if (weather.humidity < 50) {
            advice.push('Low humidity - increase irrigation frequency');
        }
        
        if (weather.conditions.includes('sunny') && weather.temperature.current > 28) {
            advice.push('Hot and sunny - water early morning or late evening');
        }

        if (weather.conditions.includes('rain')) {
            advice.push('Rain expected - reduce irrigation to prevent waterlogging');
        }

        return advice.length > 0 ? advice : ['Current conditions suitable for normal irrigation schedule'];
    }

    /**
     * Get pest alert based on weather
     */
    getPestAlert(weather) {
        const alerts = [];
        
        if (weather.temperature.current > 25 && weather.humidity > 70) {
            alerts.push('High risk of fungal diseases - monitor crops closely');
            alerts.push('Increased pest activity expected - implement IPM practices');
        }

        if (weather.conditions.includes('rain')) {
            alerts.push('Wet conditions favor disease spread - consider preventive fungicide');
        }

        return alerts.length > 0 ? alerts : ['Normal pest risk - continue regular monitoring'];
    }

    /**
     * Get fertilizer advice
     */
    getFertilizerAdvice(season) {
        if (season.name === 'Season A' || season.name === 'Season B') {
            return [
                'Apply basal fertilizer at planting',
                'Top-dress with nitrogen 3-4 weeks after emergence',
                'Consider organic fertilizers for long-term soil health'
            ];
        }
        return ['Apply compost or organic matter during off-season'];
    }

    /**
     * Get harvest advice
     */
    getHarvestAdvice(season) {
        if (season.name === 'Season A') {
            return [
                'Prepare for harvest in January-February',
                'Ensure proper storage facilities are ready',
                'Market preparation recommended before harvest'
            ];
        } else if (season.name === 'Season B') {
            return [
                'Prepare for harvest in June-July',
                'Plan for post-harvest handling',
                'Consider value addition opportunities'
            ];
        }
        return ['Off-season - focus on crop maintenance and soil preparation'];
    }

    /**
     * Get most common item in array
     */
    getMostCommon(arr) {
        const counts = {};
        arr.forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
        });
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    /**
     * Get all supported locations
     */
    getSupportedLocations() {
        const locations = {
            provinces: Object.keys(this.rwandaProvinces),
            districts: {}
        };
        
        for (const province in this.rwandaDistricts) {
            locations.districts[province] = this.rwandaDistricts[province].map(d => d.name);
        }
        
        return locations;
    }
}

module.exports = new WeatherService();
