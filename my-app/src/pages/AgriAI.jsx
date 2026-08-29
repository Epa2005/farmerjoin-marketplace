import React, { useState, useEffect, useRef } from 'react';
import API from '../api.jsx';
import { useNavigate } from 'react-router-dom';

export default function AgriAI() {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Get current user info for account tracking
    const getCurrentUser = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return { user_id: payload.user_id, email: payload.email, role: payload.role };
        } catch {
            return null;
        }
    };

    const currentUser = getCurrentUser();
    const storedUser = localStorage.getItem('agri_user');

    // System context state
    const [systemContext, setSystemContext] = useState({
        products: [],
        orders: [],
        userProfile: null,
        stats: null
    });

    // Clear conversation if user changed
    useEffect(() => {
        const userKey = currentUser ? `${currentUser.user_id}_${currentUser.email}` : 'anonymous';
        if (storedUser !== userKey) {
            localStorage.removeItem('agri_session');
            localStorage.removeItem('agri_messages');
            setSessionId(null);
            setMessages([]);
            localStorage.setItem('agri_user', userKey);
        }
    }, [currentUser?.user_id, currentUser?.email]);

    const [sessionId, setSessionId] = useState(localStorage.getItem('agri_session') || null);
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('agri_messages');
        return saved ? JSON.parse(saved) : [];
    });
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState('auto');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    // Fetch system context when component mounts
    useEffect(() => {
        if (currentUser) {
            fetchSystemContext();
        }
    }, [currentUser?.user_id]);

    // Fetch system data (products, orders, user profile, stats)
    async function fetchSystemContext() {
        try {
            const [productsRes, ordersRes, profileRes, statsRes] = await Promise.allSettled([
                API.get('/products').catch(() => ({ data: [] })),
                currentUser?.role === 'buyer'
                    ? API.get('/orders/my-orders').catch(() => ({ data: [] }))
                    : currentUser?.role === 'farmer'
                        ? API.get('/orders/farmer-orders').catch(() => ({ data: [] }))
                        : Promise.resolve({ data: [] }),
                // Resolve user profile from backend if farmer, otherwise use token info
                (currentUser?.role === 'farmer'
                    ? API.get('/farmer/profile').catch(() => ({ data: null }))
                    : Promise.resolve({ data: currentUser || null })
                ),
                // Backend exposes aggregated stats at /users
                API.get('/users').catch(() => ({ data: null }))
            ]);

            setSystemContext({
                products: productsRes.value?.data || [],
                orders: ordersRes.value?.data || [],
                userProfile: profileRes.value?.data || null,
                stats: statsRes.value?.data || null
            });
        } catch (e) {
            console.warn('Failed to fetch system context:', e);
        }
    }

    // Save messages to localStorage
    useEffect(() => {
        localStorage.setItem('agri_messages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        if (sessionId) fetchHistory(sessionId);
    }, [sessionId]);

    async function fetchHistory(sid) {
        try {
            const res = await API.get(`/api/agri/conversation/${sid}`);
            if (res.data && res.data.history) {
                setMessages(res.data.history);
            }
        } catch (e) {
            console.warn('Failed to load history', e.message || e);
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    async function send() {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message immediately
        const newMessages = [...messages, { role: 'user', text: userMessage, timestamp: Date.now() }];
        setMessages(newMessages);
        setLoading(true);
        setIsTyping(true);

        try {
            const resolvedLanguage = language === 'auto' ? detectLanguage(userMessage) : language;

            // Build system context summary for AI
            const contextSummary = buildContextSummary();

            const res = await API.post('/api/agri/conversation', {
                sessionId,
                message: userMessage,
                language: resolvedLanguage,
                context: contextSummary
            });
            const sid = res.data.sessionId;
            setSessionId(sid);
            localStorage.setItem('agri_session', sid);

            // Simulate typing delay for realism
            setTimeout(() => {
                if (res.data.history) {
                    setMessages(res.data.history);
                } else if (res.data.response) {
                    setMessages([...newMessages, {
                        role: 'assistant',
                        text: res.data.response,
                        structured: res.data.structured,
                        isFallback: res.data.fallback || false,
                        timestamp: Date.now()
                    }]);
                }
                setIsTyping(false);
            }, 800);
        } catch (e) {
            console.error('Conversation send error', e.message || e);
            setMessages([...newMessages, {
                role: 'assistant',
                text: 'Sorry, I encountered an error. Please try again.',
                isError: true,
                timestamp: Date.now()
            }]);
            setIsTyping(false);
        } finally {
            setLoading(false);
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const startNewChat = () => {
        setInput('');
        localStorage.removeItem('agri_session');
        localStorage.removeItem('agri_messages');
        setSessionId(null);
        setMessages([]);
        inputRef.current?.focus();
    };

    const quickPrompts = [
        { icon: '🌱', text: 'How do I plant tomatoes?' },
        { icon: '🌧️', text: 'What is the weather forecast for Kigali?' },
        { icon: '🐛', text: 'How to control pests in maize?' },
        { icon: '💰', text: 'What are current market prices for coffee?' },
        { icon: '�', text: 'Show me available products on FarmerJoin' },
        { icon: '📦', text: 'Check my order status' },
        { icon: '👨‍🌾', text: 'Find farmers in my area' },
        { icon: '📊', text: 'What are the platform statistics?' },
    ];

    function detectLanguage(text) {
        const value = (text || '').toLowerCase();
        const rwSignals = [
            'amakuru', 'muraho', 'ese', 'nshaka', 'ikirere', 'ibirayi',
            'ibigori', 'ifumbire', 'indwara', 'ubuhinzi', 'mbese', 'bite',
            'murakoze', 'waramutse', 'mwiriwe', 'yego', 'oya', 'ngiye',
            'mfite', 'ndashaka', 'bwakeye', 'mwaramutse'
        ];
        return rwSignals.some((word) => value.includes(word)) ? 'rw' : 'en';
    }

    // Build context summary for AI from system data
    function buildContextSummary() {
        const { products, orders, userProfile, stats } = systemContext;
        const user = currentUser;

        let summary = {
            userRole: user?.role || 'guest',
            userEmail: user?.email || 'anonymous',
            platformStats: stats ? {
                totalFarmers: stats.farmers || 0,
                totalBuyers: stats.buyers || 0,
                totalProducts: stats.products || 0,
                totalTransactions: stats.transactions || 0
            } : null,
            availableProducts: products.slice(0, 20).map(p => ({
                name: p.product_name,
                category: p.category,
                price: p.price,
                quantity: p.quantity,
                farmer: p.full_name
            })),
            productCategories: [...new Set(products.map(p => p.category))],
            userOrders: orders.length > 0 ? orders.slice(0, 5).map(o => ({
                orderId: o.order_id,
                status: o.status,
                total: o.total_amount,
                date: o.created_at || o.order_date,
                items: o.items?.length || 0
            })) : null,
            userProfile: userProfile ? {
                fullName: userProfile.full_name,
                phone: userProfile.phone,
                location: userProfile.location || userProfile.province,
                role: userProfile.role
            } : null
        };

        return summary;
    }

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed lg:static lg:translate-x-0 z-20 w-72 h-screen bg-white border-r border-gray-200 transition-transform duration-300 flex flex-col`}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200 space-y-2">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all duration-200 shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Chat
                    </button>
                    <button
                        onClick={fetchSystemContext}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium transition-all duration-200"
                        title="Refresh system data to update AI knowledge"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh System Data
                    </button>
                </div>

                {/* Recent Chats */}
                <div className="flex-1 overflow-y-auto p-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Today</h3>
                    <div className="space-y-1">
                        <button
                            onClick={() => { }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors truncate"
                        >
                            <span className="mr-2">💬</span>
                            Current Conversation
                        </button>
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                            {currentUser?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.email || 'Guest'}</p>
                            <p className="text-xs text-gray-500">Agri AI Assistant</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-screen">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="font-semibold text-gray-900">Agri AI</h1>
                                <p className="text-xs text-emerald-600 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Language Selector */}
                        <div className="relative">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                            >
                                <option value="auto">🌐 Auto</option>
                                <option value="en">🇬🇧 English</option>
                                <option value="rw">🇷🇼 Kinyarwanda</option>
                            </select>
                            <svg className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Back to Home"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {messages.length === 0 ? (
                        /* Welcome Screen */
                        <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-xl">
                                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Agri AI</h2>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    Your intelligent farming assistant. Ask about crops, weather, pests, market prices, and more.
                                </p>
                            </div>

                            {/* Quick Prompts Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl w-full">
                                {quickPrompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setInput(prompt.text); inputRef.current?.focus(); }}
                                        className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all duration-200 text-left group"
                                    >
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{prompt.icon}</span>
                                        <span className="text-sm text-gray-700 font-medium">{prompt.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Chat Messages */
                        <div className="max-w-4xl mx-auto py-6 px-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`mb-6 ${m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                                    <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'user'
                                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                                : 'bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300'
                                            }`}>
                                            {m.role === 'user' ? (
                                                <span className="text-white text-sm font-semibold">
                                                    {currentUser?.email?.[0]?.toUpperCase() || 'U'}
                                                </span>
                                            ) : (
                                                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Message Content */}
                                        <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${m.role === 'user'
                                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-md'
                                                    : m.isError
                                                        ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-md'
                                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                                }`}>
                                                {/* Structured Response for Assistant */}
                                                {m.role === 'assistant' && m.structured ? (
                                                    <div className="space-y-4">
                                                        {/* Summary */}
                                                        {m.structured.summary && (
                                                            <div className="font-semibold text-gray-900 text-lg leading-relaxed">
                                                                {m.structured.summary}
                                                            </div>
                                                        )}

                                                        {/* Steps - Visual Timeline */}
                                                        {m.structured.steps && m.structured.steps.length > 0 && (
                                                            <div className="space-y-3">
                                                                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Steps to Follow</h4>
                                                                <div className="space-y-3">
                                                                    {m.structured.steps.map((step, idx) => (
                                                                        <div key={idx} className="flex gap-3">
                                                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                                                                {idx + 1}
                                                                            </div>
                                                                            <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Recommendations */}
                                                        {m.structured.recommendations && m.structured.recommendations.length > 0 && (
                                                            <div className="bg-emerald-50 rounded-xl p-4">
                                                                <h4 className="font-semibold text-emerald-800 text-sm uppercase tracking-wide mb-3">Recommendations</h4>
                                                                <ul className="space-y-2">
                                                                    {m.structured.recommendations.map((rec, idx) => (
                                                                        <li key={idx} className="flex items-start gap-2">
                                                                            <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                            <span className="text-gray-700 text-sm">{rec}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Details */}
                                                        {m.structured.details && (
                                                            <div className="text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                                                                {m.structured.details}
                                                            </div>
                                                        )}

                                                        {/* Sources */}
                                                        {m.structured.sources && m.structured.sources.length > 0 && (
                                                            <div className="border-t border-gray-100 pt-3">
                                                                <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-2">Sources</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {m.structured.sources.map((s, idx) => (
                                                                        <a
                                                                            key={idx}
                                                                            href={s.link}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-gray-200 hover:border-emerald-300 transition-all"
                                                                        >
                                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                            </svg>
                                                                            {s.title || 'Learn more'}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* Plain Text Message */
                                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
                                                )}
                                            </div>

                                            {/* Timestamp & Fallback Indicator */}
                                            <div className="flex items-center gap-2 mt-1 px-1">
                                                <span className="text-xs text-gray-400">
                                                    {formatTime(m.timestamp)}
                                                </span>
                                                {m.isFallback && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full" title="Using system data - AI service temporarily unavailable">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        System Data
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex justify-start mb-6">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                            <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 px-4 py-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={language === 'rw' ? "Andika ikibazo cyanyu..." : "Ask anything about farming..."}
                                rows={1}
                                className="flex-1 bg-transparent border-0 resize-none px-3 py-3 text-gray-800 placeholder-gray-400 focus:outline-none max-h-32"
                                style={{ minHeight: '24px' }}
                            />
                            <div className="flex items-center gap-1 pr-1 pb-1">
                                <button
                                    onClick={send}
                                    disabled={!input.trim() || loading}
                                    className={`p-2.5 rounded-xl transition-all duration-200 ${input.trim() && !loading
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {loading ? (
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 text-center mt-2">
                            Press Enter to send • Shift + Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
