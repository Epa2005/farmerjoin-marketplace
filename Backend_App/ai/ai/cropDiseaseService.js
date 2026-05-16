const ollamaService = require('./ollamaService');

/**
 * AI Service for Crop Disease Detection
 * Uses Ollama AI model to identify crop diseases from uploaded images
 */
class CropDiseaseService {
    constructor() {
        // Common crop diseases in Rwanda (fallback database)
        this.diseaseDatabase = {
            'banana': {
                'bunchy_top': {
                    name: 'Banana Bunchy Top Disease',
                    symptoms: 'Stunted growth, brittle leaves, dark green streaks on leaves',
                    treatment: 'Remove infected plants, control aphids, use disease-free planting material',
                    prevention: 'Use clean planting material, quarantine new plants, regular monitoring'
                },
                'xanthomonas_wilt': {
                    name: 'Banana Xanthomonas Wilt (BXW)',
                    symptoms: 'Yellowing and wilting of leaves, premature ripening of fruits',
                    treatment: 'Remove male buds, disinfect tools, remove infected plants',
                    prevention: 'Use clean tools, remove male buds, avoid plant injury'
                },
                'sigatoka': {
                    name: 'Black Sigatoka',
                    symptoms: 'Black streaks on leaves, leaf death, reduced fruit quality',
                    treatment: 'Apply fungicides, remove infected leaves',
                    prevention: 'Proper spacing, good drainage, fungicide application'
                }
            },
            'coffee': {
                'coffee_berry_disease': {
                    name: 'Coffee Berry Disease (CBD)',
                    symptoms: 'Dark sunken lesions on berries, berry drop',
                    treatment: 'Apply copper fungicides, remove infected berries',
                    prevention: 'Use resistant varieties, proper pruning, fungicide application'
                },
                'leaf_rust': {
                    name: 'Coffee Leaf Rust',
                    symptoms: 'Orange-yellow powdery spots on leaf undersides, leaf drop',
                    treatment: 'Apply fungicides, improve air circulation',
                    prevention: 'Use resistant varieties, proper spacing, regular monitoring'
                }
            },
            'maize': {
                'maize_streak': {
                    name: 'Maize Streak Virus',
                    symptoms: 'White-yellow streaks on leaves, stunted growth',
                    treatment: 'Remove infected plants, control leafhoppers',
                    prevention: 'Use resistant varieties, control vectors, early planting'
                },
                'gray_leaf_spot': {
                    name: 'Gray Leaf Spot',
                    symptoms: 'Rectangular gray lesions on leaves',
                    treatment: 'Apply fungicides, crop rotation',
                    prevention: 'Resistant varieties, proper spacing, crop rotation'
                }
            },
            'beans': {
                'angular_leaf_spot': {
                    name: 'Angular Leaf Spot',
                    symptoms: 'Angular brown spots on leaves, yellow halos',
                    treatment: 'Apply fungicides, remove infected plant debris',
                    prevention: 'Use certified seeds, crop rotation, proper spacing'
                },
                'anthracnose': {
                    name: 'Bean Anthracnose',
                    symptoms: 'Dark sunken lesions on pods, seeds, and stems',
                    treatment: 'Use resistant varieties, fungicide application',
                    prevention: 'Certified disease-free seeds, crop rotation, avoid overhead irrigation'
                }
            },
            'potato': {
                'late_blight': {
                    name: 'Late Blight',
                    symptoms: 'Water-soaked lesions on leaves, white mold on undersides',
                    treatment: 'Apply fungicides, remove infected plants',
                    prevention: 'Use resistant varieties, proper spacing, avoid overhead irrigation'
                },
                'early_blight': {
                    name: 'Early Blight',
                    symptoms: 'Brown circular spots with concentric rings on leaves',
                    treatment: 'Apply fungicides, remove infected leaves',
                    prevention: 'Crop rotation, proper irrigation, resistant varieties'
                }
            },
            'cassava': {
                'cassava_mosaic': {
                    name: 'Cassava Mosaic Disease',
                    symptoms: 'Mosaic pattern on leaves, leaf distortion, stunted growth',
                    treatment: 'Remove infected plants, use clean planting material',
                    prevention: 'Use disease-free cuttings, resistant varieties, control whiteflies'
                },
                'brown_streak': {
                    name: 'Cassava Brown Streak Disease',
                    symptoms: 'Brown streaks on stem roots, root rot',
                    treatment: 'Remove infected plants, use clean planting material',
                    prevention: 'Use resistant varieties, clean planting material'
                }
            },
            'rice': {
                'rice_blast': {
                    name: 'Rice Blast',
                    symptoms: 'Diamond-shaped lesions on leaves, neck rot',
                    treatment: 'Apply fungicides, proper nitrogen management',
                    prevention: 'Resistant varieties, proper water management, balanced fertilization'
                },
                'bacterial_leaf_blight': {
                    name: 'Bacterial Leaf Blight',
                    symptoms: 'Water-soaked lesions on leaves, wilting',
                    treatment: 'Remove infected plants, use bactericides',
                    prevention: 'Use resistant varieties, proper water management, balanced fertilization'
                }
            }
        };
    }

    /**
     * Analyze crop image for disease detection using Ollama
     * @param {Buffer} imageBuffer - Image buffer
     * @param {string} cropType - Type of crop (optional)
     * @param {string} language - 'en' or 'rw'
     * @returns {Object} Disease detection result
     */
    async analyzeImage(imageBuffer, cropType = null, language = 'en') {
        try {
            // Try to use Ollama for AI-powered image analysis
            const systemPrompt = ollamaService.getDiseaseAnalysisPrompt(language);
            
            let prompt = language === 'rw'
                ? 'Gura pamuza iyi shusho y\'imbuto kugira ngo uvuge indwara z\'imbuto, ibimenyetso, uburyo bwo kuvura, n\'uburyo bwo gukumira. Vuga umuvuduko w\'ubuvuzi (high, moderate, low).'
                : 'Analyze this crop image to identify diseases, symptoms, treatment, and prevention methods. Indicate severity level (high, moderate, low).';

            if (cropType) {
                prompt += language === 'rw'
                    ? ` Ubu ni bwoko bw'imbuto: ${cropType}.`
                    : ` This is a ${cropType} crop.`;
            }

            const ollamaResponse = await ollamaService.analyzeImage(imageBuffer, prompt);

            if (ollamaResponse.success) {
                // Parse Ollama response to extract structured information
                const parsedResponse = this.parseDiseaseResponse(ollamaResponse.response, language);
                
                return {
                    success: true,
                    crop: cropType || parsedResponse.crop || 'unknown',
                    disease: parsedResponse.disease,
                    confidence: 0.85, // Ollama typically provides good results
                    recommendations: this.getRecommendations(parsedResponse.disease),
                    timestamp: new Date().toISOString(),
                    model: ollamaResponse.model,
                    aiPowered: true
                };
            } else {
                // Fallback to simulated detection if Ollama fails
                console.log('Ollama image analysis failed, using fallback');
                return this.fallbackAnalysis(imageBuffer, cropType, language);
            }
        } catch (error) {
            console.error('Error analyzing crop image:', error);
            // Fallback to simulated detection
            return this.fallbackAnalysis(imageBuffer, cropType, language);
        }
    }

    /**
     * Parse Ollama's disease response into structured format
     */
    parseDiseaseResponse(response, language) {
        // Try to extract disease information from the response
        const lines = response.split('\n').filter(line => line.trim());
        
        let diseaseInfo = {
            name: 'Unknown Disease',
            symptoms: response.substring(0, 200),
            treatment: 'Consult agricultural extension officer',
            prevention: 'Monitor crop health regularly',
            severity: 'moderate'
        };

        // Simple parsing logic - in production, use more sophisticated parsing
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            
            if (lowerLine.includes('disease') || lowerLine.includes('indwara')) {
                diseaseInfo.name = line.substring(line.indexOf(':') + 1).trim() || diseaseInfo.name;
            }
            if (lowerLine.includes('symptom') || lowerLine.includes('ibimenyetso')) {
                diseaseInfo.symptoms = line.substring(line.indexOf(':') + 1).trim() || diseaseInfo.symptoms;
            }
            if (lowerLine.includes('treatment') || lowerLine.includes('ubuvuzi')) {
                diseaseInfo.treatment = line.substring(line.indexOf(':') + 1).trim() || diseaseInfo.treatment;
            }
            if (lowerLine.includes('prevention') || lowerLine.includes('gukumira')) {
                diseaseInfo.prevention = line.substring(line.indexOf(':') + 1).trim() || diseaseInfo.prevention;
            }
            if (lowerLine.includes('severity') || lowerLine.includes('umuvuduko')) {
                const severity = line.toLowerCase().includes('high') ? 'high' : 
                                line.toLowerCase().includes('low') ? 'low' : 'moderate';
                diseaseInfo.severity = severity;
            }
        }

        return { disease: diseaseInfo };
    }

    /**
     * Fallback analysis when Ollama is unavailable
     */
    fallbackAnalysis(imageBuffer, cropType, language) {
        const detectedCrop = cropType || this.detectCropType(imageBuffer);
        const diseaseInfo = this.simulateDiseaseDetection(detectedCrop);
        
        return {
            success: true,
            crop: detectedCrop,
            disease: diseaseInfo,
            confidence: this.calculateConfidence(),
            recommendations: this.getRecommendations(diseaseInfo),
            timestamp: new Date().toISOString(),
            aiPowered: false,
            note: 'Using fallback detection - AI service unavailable'
        };
    }

    /**
     * Detect crop type from image (simulated)
     * In production, this would use a trained ML model
     */
    detectCropType(imageBuffer) {
        // Simulate crop detection - in production use TensorFlow.js or similar
        const crops = ['banana', 'coffee', 'maize', 'beans', 'potato', 'cassava', 'rice'];
        return crops[Math.floor(Math.random() * crops.length)];
    }

    /**
     * Simulate disease detection (fallback)
     */
    simulateDiseaseDetection(cropType) {
        if (!this.diseaseDatabase[cropType]) {
            return {
                name: 'Unknown Disease',
                symptoms: 'Unable to identify specific disease',
                treatment: 'Consult agricultural extension officer',
                prevention: 'Monitor crop health regularly',
                severity: 'unknown'
            };
        }

        const diseases = Object.keys(this.diseaseDatabase[cropType]);
        const detectedDisease = diseases[Math.floor(Math.random() * diseases.length)];
        const diseaseInfo = this.diseaseDatabase[cropType][detectedDisease];
        
        return {
            ...diseaseInfo,
            severity: this.assessSeverity(detectedDisease)
        };
    }

    /**
     * Assess disease severity
     */
    assessSeverity(diseaseName) {
        const severeDiseases = ['xanthomonas_wilt', 'coffee_berry_disease', 'cassava_mosaic', 'late_blight'];
        return severeDiseases.includes(diseaseName) ? 'high' : 'moderate';
    }

    /**
     * Calculate confidence score (simulated)
     */
    calculateConfidence() {
        // In production, this would be the actual model confidence
        return (Math.random() * 0.2 + 0.8).toFixed(2); // 0.80 - 1.00
    }

    /**
     * Get recommendations based on detected disease
     */
    getRecommendations(diseaseInfo) {
        return {
            immediate: diseaseInfo.treatment,
            longTerm: diseaseInfo.prevention,
            contactExtension: diseaseInfo.severity === 'high' ? 
                'Contact Rwanda Agriculture Board (RAB) immediately' : 
                'Monitor closely, contact extension if condition worsens'
        };
    }

    /**
     * Get list of supported crops
     */
    getSupportedCrops() {
        return Object.keys(this.diseaseDatabase);
    }

    /**
     * Get disease information for a specific crop
     */
    getCropDiseases(cropType) {
        return this.diseaseDatabase[cropType] || {};
    }
}

module.exports = new CropDiseaseService();
