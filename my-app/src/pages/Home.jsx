import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import HeroSlider from "../components/HeroSlider";
import ImageSlideshow from "../components/ImageSlideshow";
import { useTranslation } from "../hooks/useTranslation";
import API from "../api";

const Home = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        users: 0,
        products: 0,
        markets: 0,
        satisfaction: 0
    });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isVisible, setIsVisible] = useState({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Agricultural photos for hero slideshow - mix of default and uploaded
    const defaultAgriPhotos = [
        '/agri_photoes/close-up-countryside-worker-holding-peanuts.jpg',
        '/agri_photoes/countryside-people-out-field-together.jpg',
        '/agri_photoes/countryside-woman-holding-plant-leaves.jpg',
        '/agri_photoes/tamrat-touloumon-g6cUko7Ss4E-unsplash.jpg'
    ];
    
    const agriPhotos = uploadedImages.length > 0 ? [...uploadedImages, ...defaultAgriPhotos] : defaultAgriPhotos;

    // Check if user is admin
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');
        if (token && userRole === 'admin') {
            setIsAdmin(true);
            fetchUploadedImages();
        }
    }, []);
    
    // Fetch uploaded images
    const fetchUploadedImages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await API.get('/admin/hero-images', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && response.data.images) {
                setUploadedImages(response.data.images);
            }
        } catch (error) {
            console.error('Error fetching uploaded images:', error);
        }
    };
    
    // Handle image upload
    const handleImageUpload = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        
        setUploading(true);
        const formData = new FormData();
        
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await API.post('/admin/upload-hero-images', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data && response.data.images) {
                setUploadedImages(response.data.images);
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            alert(t('errorUploadingImages'));
        } finally {
            setUploading(false);
        }
    };
    
    // Delete uploaded image
    const handleDeleteImage = async (imageName) => {
        if (!confirm(t('confirmDeleteImage'))) return;
        
        try {
            const token = localStorage.getItem('token');
            await API.delete(`/admin/hero-image/${imageName}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUploadedImages(prev => prev.filter(img => img !== imageName));
        } catch (error) {
            console.error('Error deleting image:', error);
            alert(t('errorDeletingImage'));
        }
    };

    // Animated counter effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setStats({
                users: 5000,
                products: 2000,
                markets: 50,
                satisfaction: 98
            });
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Scroll progress indicator
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            setScrollProgress(scrollPercent);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer for animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
            {/* Scroll Progress Indicator */}
            <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-50">
                <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Dark Mode Toggle */}
            <button
                onClick={toggleDarkMode}
                className="fixed top-6 right-6 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 hover:scale-110 transition-all duration-300"
            >
                {isDarkMode ? (
                    <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                )}
            </button>
            
            {/* Admin Panel Toggle */}
            {isAdmin && (
                <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className="fixed top-6 right-20 z-50 p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            )}
            
            {/* Admin Panel */}
            {isAdmin && showAdminPanel && (
                <div className="fixed top-20 right-6 z-40 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-80 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('adminDashboard')}</h3>
                    
                    {/* Image Upload Section */}
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('heroImages')}</h4>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                        />
                        <label
                            htmlFor="image-upload"
                            className="block w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-lg text-center cursor-pointer hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 mb-3"
                        >
                            {uploading ? t('uploading') : t('uploadImages')}
                        </label>
                        
                        {/* Uploaded Images List */}
                        {uploadedImages.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {uploadedImages.map((image, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{image}</span>
                                        <button
                                            onClick={() => handleDeleteImage(image)}
                                            className="text-red-500 hover:text-red-700 ml-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Admin Links */}
                    <div className="space-y-2">
                        <Link
                            to="/admin-dashboard"
                            className="block w-full bg-indigo-500 text-white px-4 py-2 rounded-lg text-center hover:bg-indigo-600 transition-all duration-300"
                        >
                            {t('adminDashboard')}
                        </Link>
                        <button
                            onClick={() => setShowAdminPanel(false)}
                            className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
                        >
                            {t('closePanel')}
                        </button>
                    </div>
                </div>
            )}

            {/* 1️⃣ MODERN HERO SECTION WITH ENHANCED EFFECTS */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Agricultural Photo Slideshow as Background */}
                <div className="absolute inset-0">
                    <ImageSlideshow images={agriPhotos} interval={4000} />
                </div>
                
                {/* Enhanced Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
                
                {/* Modern Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Floating Gradient Orbs */}
                    <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 right-10 w-[28rem] h-[28rem] bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    
                    {/* Floating Geometric Shapes */}
                    <div className="absolute top-1/4 left-1/4 w-24 h-24 border-2 border-white/10 rounded-xl animate-bounce backdrop-blur-sm" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute bottom-1/4 right-1/4 w-20 h-20 border-2 border-white/10 rounded-full animate-spin backdrop-blur-sm" style={{ animationDuration: '10s', animationDelay: '3s' }}></div>
                    <div className="absolute top-3/4 left-3/4 w-16 h-16 border-2 border-white/10 rotate-45 animate-pulse backdrop-blur-sm" style={{ animationDelay: '4s' }}></div>
                    
                    {/* Particle Effects */}
                    <div className="absolute inset-0">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    animationDuration: `${3 + Math.random() * 4}s`
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 text-center text-white px-4 max-w-7xl mx-auto">
                    {/* Animated Title */}
                    <div className="mb-8">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight tracking-tight animate-fade-in-up">
                            <span className="bg-gradient-to-r from-white via-emerald-200 to-cyan-200 bg-clip-text text-transparent">
                                {t('heroTitle').split(' ').map((word, index) => (
                                    <span key={index} className={index === 1 ? 'block' : ''}>
                                        {word} {index === 1 && <br />}
                                    </span>
                                ))}
                            </span>
                        </h1>
                        <div className="w-32 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                    
                    {/* Enhanced Subtitle */}
                    <p className="text-xl md:text-2xl lg:text-3xl font-light mb-12 leading-relaxed max-w-5xl mx-auto animate-fade-in-up text-white/90" style={{ animationDelay: '0.5s' }}>
                        {t('heroSubtitle')}
                    </p>
                    
                    {/* Modern CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                        <Link
                            to="/register"
                            className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 overflow-hidden backdrop-blur-sm border border-white/20"
                        >
                            <span className="relative z-10 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {t('getStarted')}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                        </Link>
                        <Link
                            to="/about"
                            className="group px-8 py-4 border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white transform hover:scale-105 transition-all duration-300 shadow-xl backdrop-blur-sm"
                        >
                            <span className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('learnMore')}
                            </span>
                        </Link>
                    </div>
                    
                    {/* Trust Indicators */}
                    <div className="mt-16 flex flex-wrap justify-center gap-8 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                        <div className="flex items-center space-x-2 text-white/80">
                            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm">{t('ratingValue')} {t('averageRating')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-white/80">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="text-sm">{t('farmersCountValue')} {t('farmersCount')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-white/80">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm">{t('verifiedPlatform')}</span>
                        </div>
                    </div>
                </div>

                {/* Enhanced Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="flex flex-col items-center space-y-2">
                        <span className="text-white/60 text-sm">{t('scrollExplore')}</span>
                        <svg className="w-6 h-10 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* 2️⃣ MODERN STATISTICS SECTION WITH GLASSMORPHISM */}
            <section id="stats" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                                {t('impactAtGlance')}
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('joinThousandsTransforming')}
                        </p>
                    </div>
                    
                    {/* Enhanced Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { 
                                value: stats.users, 
                                label: t('farmersCount'), 
                                suffix: '+', 
                                icon: '👥',
                                color: 'from-blue-500 to-cyan-500',
                                bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
                                description: t('activeFarmers')
                            },
                            { 
                                value: stats.products, 
                                label: t('productsCount'), 
                                suffix: '+', 
                                icon: '🌾',
                                color: 'from-emerald-500 to-teal-500',
                                bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
                                description: t('productsListed')
                            },
                            { 
                                value: stats.markets, 
                                label: t('marketsCount'), 
                                suffix: '+', 
                                icon: '🏪',
                                color: 'from-purple-500 to-pink-500',
                                bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
                                description: t('marketConnections')
                            },
                            { 
                                value: stats.satisfaction, 
                                label: t('satisfactionRate'), 
                                suffix: '%', 
                                icon: '⭐',
                                color: 'from-orange-500 to-red-500',
                                bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
                                description: t('satisfactionRateValue')
                            }
                        ].map((stat, index) => (
                            <div key={index} className="group">
                                <div className={`relative bg-gradient-to-br ${stat.bgGradient} backdrop-blur-md p-8 rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 border border-white/20 dark:border-gray-700/50 overflow-hidden`}>
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-10">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color}`}></div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"></div>
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"></div>
                                    </div>
                                    
                                    {/* Icon */}
                                    <div className={`relative w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg`}>
                                        <span className="text-2xl">{stat.icon}</span>
                                    </div>
                                    
                                    {/* Value */}
                                    <div className={`relative text-4xl md:text-5xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 ${isVisible['stats'] ? 'animate-counter' : ''}`}>
                                        {stat.value}{stat.suffix}
                                    </div>
                                    
                                    {/* Label */}
                                    <div className="relative text-gray-700 dark:text-gray-300 font-semibold text-lg mb-1">
                                        {stat.label}
                                    </div>
                                    
                                    {/* Description */}
                                    <div className="relative text-gray-500 dark:text-gray-400 text-sm">
                                        {stat.description}
                                    </div>
                                    
                                    {/* Hover Effect Overlay */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Additional Stats Bar */}
                    <div className="mt-16 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div>
                                <div className="text-3xl font-bold mb-2">24/7</div>
                                <div className="text-emerald-100">{t('supportAvailable')}</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-2">50+</div>
                                <div className="text-emerald-100">{t('regionsCovered')}</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-2">100%</div>
                                <div className="text-emerald-100">{t('securePlatformValue')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3️⃣ MODERN PROBLEM → SOLUTION SECTION */}
            <section id="problem-solution" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                                {t('challengeSolution')}
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('transformingChallenges')}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Problem */}
                        <div className="relative">
                            <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-red-100 dark:border-red-900/30">
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                    {t('theProblem')}
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-4 group">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                        <div>
                                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                {t('farmersLoseProfits')}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('middlemenTake')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 group">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                        <div>
                                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                {t('limitedMarketAccess')}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('restrictedLocalMarkets')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 group">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                        <div>
                                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                {t('priceVolatility')}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('unpredictableMarketPrices')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Solution */}
                        <div className="relative">
                            <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-emerald-100 dark:border-emerald-900/30">
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                    {t('theSolution')}
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-4 group">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                        <div>
                                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                {t('directFarmerConnections')}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('connectDirectlyBuyers')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 group">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                        <div>
                                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                {t('transparentPricing')}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('fairTransparentPricing')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 group">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                        <div>
                                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                {t('digitalMarketplace')}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('globalMarketAccess')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4️⃣ MODERN FEATURES SECTION */}
            <section id="features" className="py-20 bg-white dark:bg-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {t('powerfulFeatures')}
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('everythingYouNeed')}
                        </p>
                    </div>

                    {/* Enhanced Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: '📱',
                                title: t('mobileFirst'),
                                description: t('mobileFirstDescription'),
                                color: 'from-blue-500 to-cyan-500',
                                bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
                                detail: t('optimizedForAllDevices')
                            },
                            {
                                icon: '🔒',
                                title: t('securePayments'),
                                description: t('securePaymentsDescription'),
                                color: 'from-green-500 to-emerald-500',
                                bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
                                detail: t('safeAndSecureTransactions')
                            },
                            {
                                icon: '📊',
                                title: t('realTimeAnalytics'),
                                description: t('realTimeAnalyticsDescription'),
                                color: 'from-purple-500 to-pink-500',
                                bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
                                detail: t('dataDrivenInsights')
                            },
                            {
                                icon: '💬',
                                title: t('directMessaging'),
                                description: t('directMessagingDescription'),
                                color: 'from-orange-500 to-red-500',
                                bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
                                detail: t('instantCommunication')
                            },
                            {
                                icon: '🌍',
                                title: t('globalReach'),
                                description: t('connectWorldwide'),
                                color: 'from-indigo-500 to-blue-500',
                                bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20',
                                detail: t('expandMarket')
                            },
                            {
                                icon: '🚚',
                                title: t('logisticsSupport'),
                                description: t('integratedShipping'),
                                color: 'from-teal-500 to-green-500',
                                bgGradient: 'from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20',
                                detail: t('seamlessDelivery')
                            },
                            {
                                icon: '📈',
                                title: t('marketInsights'),
                                description: t('realTimeTrends'),
                                color: 'from-yellow-500 to-orange-500',
                                bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
                                detail: t('smartDecisions')
                            },
                            {
                                icon: '🤝',
                                title: t('communitySupport'),
                                description: t('thrivingAgricultural'),
                                color: 'from-pink-500 to-rose-500',
                                bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
                                detail: t('growTogether')
                            }
                        ].map((feature, index) => (
                            <div key={index} className="group">
                                <div className={`relative bg-gradient-to-br ${feature.bgGradient} backdrop-blur-md p-8 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 border border-white/20 dark:border-gray-700/50 h-full`}>
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-5">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color}`}></div>
                                    </div>
                                    
                                    {/* Icon */}
                                    <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg`}>
                                        <span className="text-2xl">{feature.icon}</span>
                                    </div>
                                    
                                    {/* Title */}
                                    <h3 className="relative text-xl font-bold text-gray-900 dark:text-white mb-3">
                                        {feature.title}
                                    </h3>
                                    
                                    {/* Description */}
                                    <p className="relative text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                                        {feature.description}
                                    </p>
                                    
                                    {/* Detail */}
                                    <div className="relative">
                                        <span className={`text-sm font-medium bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                                            {feature.detail}
                                        </span>
                                    </div>
                                    
                                    {/* Hover Effect */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5️⃣ MODERN PREVIEW / DEMO SECTION */}
            <section id="preview" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                {t('seeItInAction')}
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('experienceFarmerJoin')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Benefits Section */}
                        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4">
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {t('keyBenefits')}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">{t('transformFarmingBusiness')}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                {[
                                    { benefit: t('increaseFarmerIncome'), icon: '📈', detail: t('upTo40Higher') },
                                    { benefit: t('reducePostHarvestLosses'), icon: '🌾', detail: t('smartStorageSolutions') },
                                    { benefit: t('accessNewMarkets'), icon: '🌍', detail: t('globalMarketplaceAccess') },
                                    { benefit: t('realTimeAnalytics'), icon: '📊', detail: t('dataDrivenDecisions') },
                                    { benefit: t('securePayments'), icon: '🔒', detail: t('safeTransactions') }
                                ].map((item, index) => (
                                    <div key={index} className="flex items-start space-x-4 group hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded-xl transition-all duration-300">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <span className="text-xl">{item.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-900 dark:text-white font-semibold mb-1">{item.benefit}</p>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">{item.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl transform rotate-3"></div>
                            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-10 rounded-3xl shadow-2xl text-white border border-emerald-400/20">
                                <div className="mb-8">
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4">
                                        {t('startYourJourney')}
                                    </h3>
                                    <p className="text-emerald-100 text-lg mb-8">
                                        {t('joinThousands')}
                                    </p>
                                </div>
                                
                                <div className="space-y-4">
                                    <Link
                                        to="/register"
                                        className="block w-full bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold text-center hover:bg-emerald-50 transform hover:scale-105 transition-all duration-300 shadow-lg"
                                    >
                                        {t('tryDemoNow')}
                                    </Link>
                                    <Link
                                        to="/about"
                                        className="block w-full bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-center hover:bg-white/30 transition-all duration-300 border border-white/20"
                                    >
                                        {t('learnMoreButton')}
                                    </Link>
                                </div>
                                
                                {/* Trust Badges */}
                                <div className="mt-8 pt-8 border-t border-emerald-400/20">
                                    <div className="flex justify-center space-x-8">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{t('activeFarmers')}</div>
                                            <div className="text-emerald-100 text-sm">{t('activeFarmers')}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{t('userRating')}</div>
                                            <div className="text-emerald-100 text-sm">{t('userRating')}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{t('support')}</div>
                                            <div className="text-emerald-100 text-sm">{t('support')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6️⃣ MODERN TESTIMONIALS SECTION */}
            <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                                {t('trustedByFarmers')}
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('realStoriesFromRealUsers')}
                        </p>
                    </div>

                    {/* Enhanced Testimonials Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: t('jeanMugisha'),
                                role: t('coffeeFarmer'),
                                location: t('northernProvince'),
                                image: '/images/farmer1.jpg',
                                testimonial: t('jeanTestimonial'),
                                rating: 5,
                                achievement: t('increasedIncome'),
                                crop: t('coffee')
                            },
                            {
                                name: t('graceUwimana'),
                                role: t('vegetableSeller'),
                                location: t('kigali'),
                                image: '/images/buyer1.jpg',
                                testimonial: t('graceTestimonial'),
                                rating: 5,
                                achievement: t('expandedNewMarkets'),
                                crop: t('vegetables')
                            },
                            {
                                name: t('emmanuelNiyonzima'),
                                role: t('cooperativeLeader'),
                                location: t('easternProvince'),
                                image: '/images/coop1.jpg',
                                testimonial: t('emmanuelTestimonial'),
                                rating: 5,
                                achievement: t('reducedLosses'),
                                crop: t('mixedCrops')
                            }
                        ].map((testimonial, index) => (
                            <div key={index} className="group">
                                <div className="relative bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 border border-gray-100 dark:border-gray-700 h-full">
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-5">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full -mr-16 -mt-16"></div>
                                    </div>
                                    
                                    {/* Rating */}
                                    <div className="flex mb-6">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    
                                    {/* Profile */}
                                    <div className="flex items-center mb-6">
                                        <div className="relative">
                                            <img 
                                                src={testimonial.image} 
                                                alt={testimonial.name}
                                                className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${testimonial.name}&background=10b981&color=fff`;
                                                }}
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{testimonial.name}</h4>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">{testimonial.location}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Achievement Badge */}
                                    <div className="inline-block bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 px-3 py-1 rounded-full mb-4">
                                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                            {testimonial.achievement}
                                        </span>
                                    </div>
                                    
                                    {/* Testimonial */}
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg mb-6">
                                        "{testimonial.testimonial}"
                                    </p>
                                    
                                    {/* Crop Type */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('specializesIn')}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{testimonial.crop}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Additional Testimonial Stats */}
                    <div className="mt-16 text-center">
                        <div className="inline-flex items-center space-x-8 bg-white dark:bg-gray-800 px-8 py-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">98%</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{t('satisfactionRatePercent')}</div>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">500+</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{t('successStories')}</div>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">4.9★</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{t('averageRating')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Custom Styles */}
            <style jsx={true}>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes counter {
                    from {
                        opacity: 0;
                        transform: scale(0.5);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
                
                .animate-fade-in-up.delay-200 {
                    animation-delay: 0.2s;
                }
                
                .animate-fade-in-up.delay-400 {
                    animation-delay: 0.4s;
                }
                
                .animate-counter {
                    animation: counter 1s ease-out forwards;
                }
                
                .delay-1000 {
                    animation-delay: 1s;
                }
                
                .delay-2000 {
                    animation-delay: 2s;
                }
                
                .delay-3000 {
                    animation-delay: 3s;
                }
                
                .delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};

export default Home;
