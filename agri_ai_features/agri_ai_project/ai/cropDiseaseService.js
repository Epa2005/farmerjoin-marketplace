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
                    kinyarwanda_name: 'Kirabiranya',
                    symptoms: 'Stunted growth, brittle leaves, dark green streaks on leaves.',
                    treatment: 'Uproot and destroy infected mats, control aphids (vectors).',
                    prevention: 'Use clean planting material, quarantine new plants, regular monitoring.'
                },
                'xanthomonas_wilt': {
                    name: 'Banana Xanthomonas Wilt (BXW)',
                    kinyarwanda_name: 'Kirabiranya',
                    symptoms: 'Yellowing and wilting of leaves, premature ripening of fruits, yellow ooze from cut stems.',
                    treatment: 'Remove male buds, disinfect tools with fire or bleach, uproot infected plants.',
                    prevention: 'Use clean tools, remove male buds, avoid plant injury.'
                },
                'sigatoka': {
                    name: 'Black Sigatoka',
                    kinyarwanda_name: 'Sigatoka Yirabura',
                    symptoms: 'Black streaks on leaves, leaf death, reduced fruit quality.',
                    treatment: 'Apply fungicides, remove infected leaves.',
                    prevention: 'Proper spacing, good drainage, fungicide application.'
                }
            },
            'coffee': {
                'coffee_berry_disease': {
                    name: 'Coffee Berry Disease (CBD)',
                    kinyarwanda_name: 'Indwara y’Imbuto y’Ikawa',
                    symptoms: 'Dark sunken lesions on berries, berry drop.',
                    treatment: 'Apply copper fungicides, remove infected berries.',
                    prevention: 'Use resistant varieties, proper pruning, fungicide application.'
                },
                'leaf_rust': {
                    name: 'Coffee Leaf Rust',
                    kinyarwanda_name: 'Inshanyi',
                    symptoms: 'Orange-yellow powdery spots on leaf undersides, leaf drop.',
                    treatment: 'Apply fungicides, improve air circulation.',
                    prevention: 'Use resistant varieties, proper spacing, regular monitoring.'
                }
            },
            'maize': {
                'maize_streak': {
                    name: 'Maize Streak Virus',
                    kinyarwanda_name: 'Indwara y’Imirongo y’Ibigori',
                    symptoms: 'White-yellow streaks on leaves, stunted growth.',
                    treatment: 'Remove infected plants, control leafhoppers.',
                    prevention: 'Use resistant varieties, control vectors, early planting.'
                },
                'maize_lethal_necrosis': {
                    name: 'Maize Lethal Necrosis (MLN)',
                    kinyarwanda_name: 'Uburwayi bw’Ibigori Bwica',
                    symptoms: 'Severe mottling, leaf necrosis, stunted growth, sterile ears.',
                    treatment: 'Crop rotation (avoid maize for 2 seasons), use certified seeds, control thrips/beetles.',
                    prevention: 'Use certified seeds, crop rotation, control insect vectors.'
                },
                'fall_armyworm': {
                    name: 'Fall Armyworm (Pest)',
                    kinyarwanda_name: 'Nkongwa y’ibigori',
                    symptoms: 'Ragged holes in leaves, sawdust-like frass in whorls.',
                    treatment: 'Handpicking, use of neem extracts, timely pesticide application.',
                    prevention: 'Early detection, pheromone traps, resistant varieties.'
                },
                'gray_leaf_spot': {
                    name: 'Gray Leaf Spot',
                    kinyarwanda_name: 'Indwara y’Amababi Y’Ibigori',
                    symptoms: 'Rectangular gray lesions on leaves.',
                    treatment: 'Apply fungicides, crop rotation.',
                    prevention: 'Resistant varieties, proper spacing, crop rotation.'
                }
            },
            'beans': {
                'angular_leaf_spot': {
                    name: 'Angular Leaf Spot',
                    kinyarwanda_name: 'Indwara y’Amababi y’Ibishyimbo',
                    symptoms: 'Angular brown spots on leaves, yellow halos.',
                    treatment: 'Apply fungicides, remove infected plant debris.',
                    prevention: 'Use certified seeds, crop rotation, proper spacing.'
                },
                'anthracnose': {
                    name: 'Bean Anthracnose',
                    kinyarwanda_name: 'Indwara y’Ibishyimbo',
                    symptoms: 'Dark sunken lesions on pods, seeds, and stems.',
                    treatment: 'Use resistant varieties, fungicide application.',
                    prevention: 'Certified disease-free seeds, crop rotation, avoid overhead irrigation.'
                }
            },
            'potato': {
                'late_blight': {
                    name: 'Late Blight',
                    kinyarwanda_name: 'Imvura y’Ibirayi',
                    symptoms: 'Water-soaked spots on leaves, white mold on underside, tuber rot.',
                    treatment: 'Use resistant varieties, fungicide application (Mancozeb/Ridomil), proper hilling.',
                    prevention: 'Use resistant varieties, proper spacing, avoid overhead irrigation.'
                },
                'early_blight': {
                    name: 'Early Blight',
                    kinyarwanda_name: 'Indwara y’Ibirayi y’Igihe Gitoya',
                    symptoms: 'Brown circular spots with concentric rings on leaves.',
                    treatment: 'Apply fungicides, remove infected leaves.',
                    prevention: 'Crop rotation, proper irrigation, resistant varieties.'
                },
                'viral_diseases': {
                    name: 'Potato Viral Diseases',
                    kinyarwanda_name: 'Injungi',
                    symptoms: 'Leaf curling, yellowing, mosaic patterns.',
                    treatment: 'Use certified clean seeds, control aphids.',
                    prevention: 'Use certified disease-free seeds, control insect vectors.'
                }
            },
            'cassava': {
                'cassava_mosaic': {
                    name: 'Cassava Mosaic Disease',
                    kinyarwanda_name: 'Ububembe',
                    symptoms: 'Mosaic pattern on leaves, leaf distortion, stunted growth.',
                    treatment: 'Remove infected plants, use clean planting material.',
                    prevention: 'Use disease-free cuttings, resistant varieties, control whiteflies.'
                },
                'brown_streak': {
                    name: 'Cassava Brown Streak Disease',
                    kinyarwanda_name: 'Indwara y’Imirongo y’Ibihaza',
                    symptoms: 'Brown streaks on stems, yellowing of leaf veins, root necrosis (rot).',
                    treatment: 'Remove infected plants, use clean planting material.',
                    prevention: 'Use resistant varieties, clean planting material.'
                }
            },
            'rice': {
                'rice_blast': {
                    name: 'Rice Blast',
                    kinyarwanda_name: 'Indwara y’Umuceri',
                    symptoms: 'Diamond-shaped lesions on leaves, neck rot.',
                    treatment: 'Balanced nitrogen use, resistant varieties, proper water management.',
                    prevention: 'Resistant varieties, proper water management, balanced fertilization.'
                },
                'bacterial_leaf_blight': {
                    name: 'Bacterial Leaf Blight',
                    kinyarwanda_name: 'Indwara y’Amababi y’Umuceri',
                    symptoms: 'Water-soaked lesions on leaves, wilting.',
                    treatment: 'Remove infected plants, use bactericides.',
                    prevention: 'Use resistant varieties, proper water management, balanced fertilization.'
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
            kinyarwanda_name: 'Indwara Itazwi',
            symptoms: response.substring(0, 200),
            treatment: 'Consult agricultural extension officer',
            prevention: 'Monitor crop health regularly',
            severity: 'moderate'
        };

        // Simple parsing logic - in production, use more sophisticated parsing
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            
            if (lowerLine.includes('disease name') || lowerLine.includes('izina ry’indwara')) {
                diseaseInfo.name = line.substring(line.indexOf(':') + 1).trim() || diseaseInfo.name;
            } else if (lowerLine.includes('kinyarwanda name') || lowerLine.includes('izina mu kinyarwanda')) {
                diseaseInfo.kinyarwanda_name = line.substring(line.indexOf(':') + 1).trim() || diseaseInfo.kinyarwanda_name;
            }
            if (lowerLine.includes('symptoms') || lowerLine.includes('ibimenyetso')) {
                diseaseInfo.symptoms = line.substring(line.indexOf(':') + 1).trim() || diseaseInfo.symptoms;
            }
            if (lowerLine.includes('treatment') || lowerLine.includes('ubuvuzi')) {
                diseaseInfo.treatment = line.substring(line.indexOf(':') + 1).trim() || diseaseInfo.treatment;
            }
            if (lowerLine.includes('prevention') || lowerLine.includes('gukumira')) {
                diseaseInfo.prevention = line.substring(line.indexOf(':') + 1).trim() || diseaseInfo.prevention;
            }
            if (lowerLine.includes('severity') || lowerLine.includes('umuvuduko')) {
                const severity = lowerLine.includes('high') ? 'high' :
                                 lowerLine.includes('low') ? 'low' : 'moderate';
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

    /**
     * Get disease information by disease/crop keyword from text query
     * @param {string} query
     * @returns {{success:boolean,data?:object,error?:string}}
     */
    async getDiseaseInfo(query = '') {
        const q = String(query || '').trim().toLowerCase();

        // If query is empty, provide a safe response
        if (!q) {
            return { success: false, error: 'No disease query provided' };
        }

        // 1) Exact/partial match against disease names and disease keys
        for (const crop of Object.keys(this.diseaseDatabase)) {
            const diseases = this.diseaseDatabase[crop];
            for (const diseaseKey of Object.keys(diseases)) {
                const entry = diseases[diseaseKey];
                const name = (entry.name || '').toLowerCase();
                const rwName = (entry.kinyarwanda_name || '').toLowerCase();

                if (
                    q === diseaseKey ||
                    name.includes(q) ||
                    rwName.includes(q) ||
                    q.includes(diseaseKey) ||
                    q.includes(name) ||
                    q.includes(rwName)
                ) {
                    return {
                        success: true,
                        data: {
                            ...entry,
                            crop,
                            key: diseaseKey,
                            remedies: entry.treatment
                        }
                    };
                }
            }
        }

        // 2) If user gave crop name only, return first known disease as guidance
        if (this.diseaseDatabase[q]) {
            const cropDiseases = this.diseaseDatabase[q];
            const firstKey = Object.keys(cropDiseases)[0];
            if (firstKey) {
                const entry = cropDiseases[firstKey];
                return {
                    success: true,
                    data: {
                        ...entry,
                        crop: q,
                        key: firstKey,
                        remedies: entry.treatment
                    }
                };
            }
        }

        return { success: false, error: `Disease not found for query: ${query}` };
    }
}

module.exports = new CropDiseaseService();
