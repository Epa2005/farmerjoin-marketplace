import React, { useState, useEffect } from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';
import API from '../api';

const SystemAssistant = () => {
  const { t } = useNewTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // System knowledge base
  const systemKnowledge = {
    // Platform information
    platform: {
      name: 'FarmerJoin',
      description: 'Agricultural marketplace connecting farmers directly with buyers',
      features: [
        'Direct farmer-to-buyer connections',
        'Secure payment processing', 
        'Real-time analytics',
        'Mobile-first design',
        'Multi-language support (English, Kinyarwanda, French)'
      ],
      benefits: [
        'Eliminates middlemen',
        'Increases farmer income by 30-40%',
        'Reduces post-harvest losses',
        'Provides market transparency'
      ]
    },
    
    // User roles and capabilities
    userRoles: {
      farmer: {
        name: 'Farmer',
        capabilities: [
          'Add and manage products',
          'View orders and analytics',
          'Communicate with buyers',
          'Manage farm profile',
          'Set pricing and availability'
        ],
        limits: {
          maxProducts: 'Unlimited',
          maxImages: '10 per product',
          supportedCategories: 'All agricultural categories'
        }
      },
      buyer: {
        name: 'Buyer',
        capabilities: [
          'Browse and search products',
          'Place orders and track delivery',
          'Communicate with farmers',
          'Save favorite farmers',
          'Leave reviews and ratings'
        ],
        limits: {
          maxOrders: 'No limit',
          supportedPayments: 'Mobile money, Cash on delivery, Card',
          deliveryAreas: 'All Rwanda provinces'
        }
      },
      cooperative: {
        name: 'Cooperative',
        capabilities: [
          'Manage multiple farmers',
          'Bulk product listings',
          'Collective marketing',
          'Centralized order management',
          'Revenue sharing and distribution'
        ],
        limits: {
          maxFarmers: 'Unlimited',
          maxProducts: 'Unlimited',
          specialFeatures: 'Cooperative branding, bulk pricing'
        }
      },
      admin: {
        name: 'Administrator',
        capabilities: [
          'Manage all users',
          'Monitor platform activity',
          'Handle disputes and issues',
          'Generate reports and analytics',
          'System configuration and maintenance'
        ],
        limits: {
          accessLevel: 'Full system access',
          responsibilities: 'Platform security and user support'
        }
      }
    },

    // Product categories and information
    products: {
      categories: [
        {
          name: 'Vegetables',
          items: ['Tomatoes', 'Cabbage', 'Carrots', 'Onions', 'Peppers', 'Spinach'],
          seasonality: 'Year-round availability',
          storage: 'Cool, dry place'
        },
        {
          name: 'Fruits',
          items: ['Bananas', 'Mangoes', 'Pineapples', 'Papayas', 'Citrus', 'Avocados'],
          seasonality: 'Seasonal availability',
          storage: 'Room temperature'
        },
        {
          name: 'Grains',
          items: ['Rice', 'Maize', 'Beans', 'Sorghum', 'Millet'],
          seasonality: 'Harvest seasons',
          storage: 'Dry, cool place'
        },
        {
          name: 'Livestock',
          items: ['Cattle', 'Goats', 'Sheep', 'Poultry', 'Pigs'],
          seasonality: 'Year-round availability',
          specialRequirements: 'Health certificates, transportation'
        }
      ],
      quality: {
        grades: ['Premium', 'Standard', 'Economy'],
        factors: ['Freshness', 'Size', 'Appearance', 'Taste'],
        standards: 'Rwanda Standards Board certification'
      }
    },

    // Order and delivery information
    orders: {
      process: [
        'Buyer places order',
        'Farmer receives notification',
        'Payment processing',
        'Order confirmation',
        'Product preparation',
        'Delivery arrangement',
        'Order completion and review'
      ],
      delivery: {
        options: ['Home delivery', 'Pickup point', 'Market delivery'],
        timeframes: ['Same day', 'Next day', '2-3 days'],
        areas: 'All Rwanda provinces',
        costs: 'Based on distance and order size'
      },
      payment: {
        methods: ['Mobile money (MTN, Airtel)', 'Cash on delivery', 'Bank transfer', 'Card payment'],
        security: 'SSL encryption, secure payment gateway',
        refunds: '7-day return policy for damaged goods'
      }
    },

    // Pricing and fees
    pricing: {
      farmer: {
        listingFee: 'Free for basic listings',
        commission: '2-5% on successful sales',
        premiumFeatures: 'Featured listings, analytics dashboard'
      },
      buyer: {
        serviceFee: 'No fee for buyers',
        deliveryCost: 'Based on location and order size',
        discounts: 'Bulk ordering discounts available'
      }
    },

    // Technical information
    technical: {
      supportedDevices: ['Android', 'iOS', 'Web browsers'],
      internetRequirements: '3G/4G connection recommended',
      languages: ['English', 'Kinyarwanda', 'French'],
      support: '24/7 customer support via email and phone',
      security: 'End-to-end encryption, secure data storage'
    }
  };

  // Simulate typing indicator
  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1500);
  };

  // Generate response based on user query
  const generateResponse = async (userQuery) => {
    const query = userQuery.toLowerCase();
    
    // Check for database-related questions
    if (query.includes('database') || query.includes('data') || query.includes('store')) {
      return {
        type: 'database',
        message: `FarmerJoin uses a secure PostgreSQL database with the following structure:
        
📊 **Database Schema:**
- Users table: Stores farmer, buyer, cooperative, and admin information
- Products table: Contains product details, categories, pricing, and inventory
- Orders table: Tracks order status, payment, and delivery information
- Categories table: Defines product categories and subcategories
- Reviews table: Stores user ratings and feedback

🔒 **Security Features:**
- Encrypted sensitive data (passwords, payment info)
- Regular data backups
- GDPR compliance for user privacy
- Secure API endpoints with authentication

📈 **Data Analytics:**
- Real-time order tracking
- Sales performance metrics
- User behavior analysis
- Market trend identification

Would you like specific information about any of these database aspects?`,
        followUp: ['Tell me more about user data security', 'How is order data processed?', 'What analytics are available?']
      };
    }

    // Check for user role questions
    if (query.includes('farmer') || query.includes('buyer') || query.includes('cooperative') || query.includes('admin')) {
      const role = query.includes('farmer') ? 'farmer' : 
                   query.includes('buyer') ? 'buyer' : 
                   query.includes('cooperative') ? 'cooperative' : 'admin';
      
      return {
        type: 'userRole',
        message: `**${systemKnowledge.userRoles[role].name} Role Information:**

🎯 **Main Capabilities:**
${systemKnowledge.userRoles[role].capabilities.map(cap => `• ${cap}`).join('\n')}

📋 **Limits and Features:**
${Object.entries(systemKnowledge.userRoles[role].limits).map(([key, value]) => `• ${key}: ${value}`).join('\n')}

💡 **Getting Started:**
${role === 'farmer' ? '• Complete your profile with farm details\n• Add high-quality product photos\n• Set competitive pricing\n• Provide accurate location information' :
  role === 'buyer' ? '• Browse products by category\n• Compare prices from different farmers\n• Check farmer ratings and reviews\n• Use secure payment methods' :
  role === 'cooperative' ? '• Register your cooperative details\n• Add member farmers to your cooperative\n• Set up collective pricing\n• Manage bulk orders efficiently' :
  '• Monitor platform activity\n• Handle user disputes fairly\n• Generate performance reports\n• Ensure system security and uptime'}

Need specific guidance for any of these features?`,
        followUp: ['How do I add products?', 'What payment methods are accepted?', 'How to track orders?']
      };
    }

    // Check for product-related questions
    if (query.includes('product') || query.includes('sell') || query.includes('category')) {
      return {
        type: 'products',
        message: `**Product Information:**

🌾 **Available Categories:**
${systemKnowledge.products.categories.map(cat => `• ${cat.name}: ${cat.items.join(', ')}`).join('\n')}

📏 **Quality Standards:**
${systemKnowledge.products.quality.grades.map(grade => `• ${grade} grade`).join('\n')}
• Quality factors: ${systemKnowledge.products.quality.factors.join(', ')}
• Certification: ${systemKnowledge.products.quality.standards}

💰 **Pricing Guidelines:**
• Research market prices before listing
• Include all costs (production, transport, packaging)
• Consider seasonal demand fluctuations
• Offer bulk discounts for larger orders

📸 **Best Practices:**
• Use clear, high-quality photos
• Write detailed product descriptions
• Specify accurate quantities and availability
• Update inventory regularly

What specific product category interests you?`,
        followUp: ['How to price vegetables?', 'What are the best selling times?', 'How to handle product returns?']
      };
    }

    // Check for order-related questions
    if (query.includes('order') || query.includes('delivery') || query.includes('payment')) {
      return {
        type: 'orders',
        message: `**Order and Delivery Information:**

📦 **Order Process:**
${systemKnowledge.orders.process.map((step, index) => `${index + 1}. ${step}`).join('\n')}

🚚 **Delivery Options:**
${systemKnowledge.orders.delivery.options.map(option => `• ${option}`).join('\n')}
• Timeframes: ${systemKnowledge.orders.delivery.timeframes.join(', ')}
• Coverage: ${systemKnowledge.orders.delivery.areas}
• Pricing: ${systemKnowledge.orders.delivery.costs}

💳 **Payment Methods:**
${systemKnowledge.orders.payment.methods.map(method => `• ${method}`).join('\n')}
• Security: ${systemKnowledge.orders.payment.security}
• Refunds: ${systemKnowledge.orders.payment.refunds}

📊 **Order Tracking:**
• Real-time status updates
• GPS delivery tracking
• SMS notifications
• Email confirmations
• In-app messaging with farmers

Need help with a specific order or delivery issue?`,
        followUp: ['How to track my order?', 'What if I need to cancel?', 'How do refunds work?']
      };
    }

    // Check for pricing/fee questions
    if (query.includes('price') || query.includes('fee') || query.includes('cost')) {
      return {
        type: 'pricing',
        message: `**Pricing and Fee Structure:**

💰 **For Farmers:**
• Listing fee: ${systemKnowledge.pricing.farmer.listingFee}
• Sales commission: ${systemKnowledge.pricing.farmer.commission}
• Premium features: ${systemKnowledge.pricing.farmer.premiumFeatures}

💰 **For Buyers:**
• Service fee: ${systemKnowledge.pricing.buyer.serviceFee}
• Delivery costs: ${systemKnowledge.pricing.buyer.deliveryCost}
• Discounts: ${systemKnowledge.pricing.buyer.discounts}

💡 **Cost-Saving Tips:**
• Buy in bulk for better prices
• Group orders with neighbors
• Choose pickup points to save delivery fees
• Compare prices across multiple farmers
• Look for seasonal promotions

📈 **Value Proposition:**
• Farmers earn 30-40% more by eliminating middlemen
• Buyers get fresher products at better prices
• Transparent pricing builds trust
• Direct relationships ensure quality

Would you like detailed pricing for specific categories?`,
        followUp: ['Are there hidden fees?', 'How to reduce costs?', 'Best time to buy?']
      };
    }

    // Check for technical/support questions
    if (query.includes('help') || query.includes('support') || query.includes('problem') || query.includes('error')) {
      return {
        type: 'support',
        message: `**Technical Support & Help:**

🛠️ **Common Issues & Solutions:**
• **Login Problems**: Clear browser cache, check email/password, reset password if needed
• **Payment Issues**: Verify payment method, check internet connection, contact support
• **Order Issues**: Check order status, contact farmer directly, use dispute resolution
• **App Performance**: Update app, check internet speed, restart device

📱 **Supported Devices:**
${systemKnowledge.technical.supportedDevices.map(device => `• ${device}`).join('\n')}

🌐 **Requirements:**
• Internet: ${systemKnowledge.technical.internetRequirements}
• Languages: ${systemKnowledge.technical.languages.join(', ')}
• Storage: Minimal space required
• Browser: Latest Chrome, Firefox, Safari recommended

🔒 **Security Features:**
${systemKnowledge.technical.security.split(', ').map(feature => `• ${feature.trim()}`).join('\n')}

📞 **Contact Support:**
• Email: support@farmerjoin.rw
• Phone: +250 788 123 456
• Hours: ${systemKnowledge.technical.support}
• Response time: Within 24 hours

🆘 **Emergency Contacts:**
• System downtime: +250 788 999 999
• Security issues: security@farmerjoin.rw
• Payment disputes: disputes@farmerjoin.rw

What specific issue are you experiencing?`,
        followUp: ['How to reset password?', 'App not working?', 'Payment failed?']
      };
    }

    // Check for general platform questions
    if (query.includes('what is') || query.includes('about') || query.includes('platform')) {
      return {
        type: 'about',
        message: `**About FarmerJoin Platform:**

🌱 **Mission:**
${systemKnowledge.platform.description}

✨ **Key Features:**
${systemKnowledge.platform.features.map(feature => `• ${feature}`).join('\n')}

🎯 **Benefits:**
${systemKnowledge.platform.benefits.map(benefit => `• ${benefit}`).join('\n')}

📊 **Platform Statistics:**
• Active farmers: 5,000+
• Available products: 2,000+
• Covered regions: All Rwanda
• User satisfaction: 98%
• Average delivery time: 24-48 hours

🌍 **Multilingual Support:**
• English: International business and tourism
• Kinyarwanda: Local farmers and rural communities
• French: Regional business and international partners

🚀 **Getting Started:**
1. Register as farmer or buyer (free)
2. Complete your profile with accurate information
3. Browse products or list your produce
4. Connect directly and start trading

Why are you interested in FarmerJoin?`,
        followUp: ['How to register?', 'What are the requirements?', 'Success stories?']
      };
    }

    // Default response for unrecognized queries
    return {
      type: 'general',
      message: `**I can help you with information about:**

📚 **Knowledge Areas:**
• Platform features and benefits
• User roles and capabilities  
• Product categories and pricing
• Order processing and delivery
• Payment methods and security
• Technical support and troubleshooting
• Database structure and analytics

💡 **Popular Questions:**
• How do I register as a farmer?
• What payment methods are accepted?
• How are delivery costs calculated?
• What are the quality standards?
• How do I track my orders?
• Is my data secure?

❓ **Ask me about:**
• Specific user roles (farmer, buyer, cooperative, admin)
• Product categories and selling guidelines
• Order tracking and delivery options
• Pricing, fees, and payment security
• Technical issues and platform support
• Database capabilities and data privacy

Please ask a specific question, and I'll provide detailed information!`,
      followUp: ['Need more specific help?', 'Contact human support?', 'Browse help topics?']
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    simulateTyping();

    try {
      // Simulate API call to get response
      setTimeout(() => {
        const response = generateResponse(input);
        const botMessage = {
          id: Date.now() + 1,
          text: response.message,
          sender: 'assistant',
          timestamp: new Date(),
          type: response.type,
          followUp: response.followUp
        };

        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error getting response:', error);
      setIsLoading(false);
    }
  };

  const handleFollowUpQuestion = (followUpQuestion) => {
    setInput(followUpQuestion);
    handleSendMessage();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold">System Assistant</span>
          </div>
          <button className="text-white/80 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs ${message.sender === 'user' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg px-4 py-2`}>
              {message.type && (
                <div className="text-xs font-semibold mb-1 text-emerald-600">
                  {message.type === 'database' && '📊 Database Info'}
                  {message.type === 'userRole' && '👤 User Role Info'}
                  {message.type === 'products' && '🌾 Product Info'}
                  {message.type === 'orders' && '📦 Order Info'}
                  {message.type === 'pricing' && '💰 Pricing Info'}
                  {message.type === 'support' && '🛠️ Support Info'}
                  {message.type === 'about' && '🌱 About Platform'}
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm">{message.text}</div>
              
              {/* Follow-up questions */}
              {message.followUp && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Follow-up Questions:</div>
                  <div className="space-y-1">
                    {message.followUp.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleFollowUpQuestion(question)}
                        className="text-left text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2 py-1 rounded transition-colors w-full text-left"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-1">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">Assistant is typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t('askAssistant')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                <span>{t('sending')}</span>
              </div>
            ) : (
              <span>{t('send')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemAssistant;
