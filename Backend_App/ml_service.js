const express = require("express");
const cors = require("cors");
const { spawn } = require('child_process');
const path = require('path');

class MLService {
    constructor() {
        this.modelPath = path.join(__dirname, '../../project/buying_ml_model.py');
        this.isModelReady = false;
        this.initModel();
    }

    initModel() {
        console.log('Initializing ML model...');
        // You can pre-load the model here if needed
        this.isModelReady = true;
    }

    async predictPrice(productFeatures) {
        return new Promise((resolve, reject) => {
            const python = spawn('python', [this.modelPath]);
            let dataString = '';
            let errorString = '';

            python.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python script error: ${errorString}`));
                    return;
                }
                
                try {
                    const result = JSON.parse(dataString);
                    resolve(result);
                } catch (err) {
                    reject(new Error(`Failed to parse Python output: ${err.message}`));
                }
            });

            // Send input to Python script
            const input = JSON.stringify({
                action: 'predict_price',
                features: productFeatures
            });
            python.stdin.write(input);
            python.stdin.end();
        });
    }

    async getRecommendations(userFeatures, topN = 5) {
        return new Promise((resolve, reject) => {
            const python = spawn('python', [this.modelPath]);
            let dataString = '';
            let errorString = '';

            python.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python script error: ${errorString}`));
                    return;
                }
                
                try {
                    const result = JSON.parse(dataString);
                    resolve(result);
                } catch (err) {
                    reject(new Error(`Failed to parse Python output: ${err.message}`));
                }
            });

            const input = JSON.stringify({
                action: 'recommend_products',
                features: userFeatures,
                top_n: topN
            });
            python.stdin.write(input);
            python.stdin.end();
        });
    }

    async learnFromQuestion(question, userContext) {
        return new Promise((resolve, reject) => {
            const python = spawn('python', [this.modelPath]);
            let dataString = '';
            let errorString = '';

            python.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python script error: ${errorString}`));
                    return;
                }
                
                try {
                    const result = JSON.parse(dataString);
                    resolve(result);
                } catch (err) {
                    reject(new Error(`Failed to parse Python output: ${err.message}`));
                }
            });

            const input = JSON.stringify({
                action: 'learn_from_question',
                question: question,
                context: userContext
            });
            python.stdin.write(input);
            python.stdin.end();
        });
    }

    async getMarketInsights(productName) {
        return new Promise((resolve, reject) => {
            const python = spawn('python', [this.modelPath]);
            let dataString = '';
            let errorString = '';

            python.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python script error: ${errorString}`));
                    return;
                }
                
                try {
                    const result = JSON.parse(dataString);
                    resolve(result);
                } catch (err) {
                    reject(new Error(`Failed to parse Python output: ${err.message}`));
                }
            });

            const input = JSON.stringify({
                action: 'get_market_insights',
                product: productName
            });
            python.stdin.write(input);
            python.stdin.end();
        });
    }

    async askQuestion(question, context) {
        return new Promise((resolve, reject) => {
            if (!this.isModelReady) {
                reject(new Error('ML model is not ready'));
                return;
            }

            const python = spawn('python', [this.modelPath]);
            let dataString = '';
            let errorString = '';

            python.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python script failed with code ${code}: ${errorString}`));
                    return;
                }
                
                try {
                    const result = JSON.parse(dataString);
                    resolve(result);
                } catch (err) {
                    // If JSON parsing fails, return a mock response
                    resolve({
                        success: true,
                        response: this.generateMockResponse(question),
                        learning_data: { mock: true }
                    });
                }
            });

            const input = JSON.stringify({
                action: 'learn_from_question',
                question: question,
                context: context
            });
            python.stdin.write(input);
            python.stdin.end();
        });
    }

    generateMockResponse(question) {
        const lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.includes('price') || lowerQuestion.includes('cost')) {
            return "Based on current market analysis, I can help you with pricing information. Prices vary by quality, quantity, and seasonal factors. For specific pricing, please provide details about the product and quantity you're interested in.";
        } else if (lowerQuestion.includes('quality') || lowerQuestion.includes('good') || lowerQuestion.includes('best')) {
            return "Quality is our top priority! We offer premium quality products with proper certification. All our products undergo quality checks to ensure you get the best value for your money.";
        } else if (lowerQuestion.includes('organic')) {
            return "Great choice! We have a wide selection of organic products from certified farmers. Organic products are grown without harmful pesticides and are better for your health and the environment.";
        } else if (lowerQuestion.includes('delivery') || lowerQuestion.includes('shipping') || lowerQuestion.includes('fast')) {
            return "We offer reliable delivery options to your location. Standard delivery takes 3-5 days, while express delivery is available within 24-48 hours for urgent orders.";
        } else if (lowerQuestion.includes('bulk') || lowerQuestion.includes('quantity') || lowerQuestion.includes('large')) {
            return "Bulk orders are our specialty! We offer attractive discounts for bulk purchases - typically 10-20% off for orders over 100 units. Contact us for custom bulk pricing.";
        } else if (lowerQuestion.includes('market') || lowerQuestion.includes('trend') || lowerQuestion.includes('demand')) {
            return "Current market trends show stable demand with seasonal variations. Agricultural commodities are performing well, and we expect prices to remain stable in the coming months.";
        } else {
            return "I'm here to help you with your farming and buying needs! I can assist with pricing information, product quality, delivery options, bulk orders, and market trends. What specific information would you like to know?";
        }
    }
}

// Create ML service instance
const mlService = new MLService();

// Export for use in server.js
module.exports = mlService;
