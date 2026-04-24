import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroSlider from "../components/HeroSlider";
import ImageSlideshow from "../components/ImageSlideshow";
import { useTranslation } from "../hooks/useTranslation";
import { useCart } from "../context/CartContext";
import API from "../api";

const Home = () => {
    const { t } = useTranslation();
    const { addToCart } = useCart();
    const navigate = useNavigate();
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
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [categories, setCategories] = useState([]);

    // Agricultural photos for hero slideshow - mix of default and uploaded
    const defaultAgriPhotos = [
        '/agri_photoes/close-up-countryside-worker-holding-peanuts.jpg',
        '/agri_photoes/countryside-people-out-field-together.jpg',
        '/agri_photoes/countryside-woman-holding-plant-leaves.jpg',
        '/agri_photoes/tamrat-touloumon-g6cUko7Ss4E-unsplash.jpg'
    ];
    
    const agriPhotos = uploadedImages.length > 0 ? [...uploadedImages, ...defaultAgriPhotos] : defaultAgriPhotos;

    // Check if user is admin and fetch products
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');
        if (token && userRole === 'admin') {
            setIsAdmin(true);
            fetchUploadedImages();
        }
        fetchProducts();
        fetchStats();
    }, []);

    // Fetch products from backend
    const fetchProducts = async () => {
        try {
            const response = await API.get('/products');
            setProducts(response.data);
            
            // Extract unique categories
            const uniqueCategories = [...new Set(response.data.map(p => p.category))];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Fetch statistics from backend
    const fetchStats = async () => {
        try {
            const response = await API.get('/users');
            if (response.data) {
                setStats({
                    users: response.data.totalUsers || 0,
                    products: response.data.totalProducts || 0,
                    markets: 50,
                    satisfaction: 98
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };
    
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

            {/* 2️⃣ FEATURED PRODUCTS SECTION */}
            <section id="products" className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Featured Products
                            </h2>
                            <p className="text-gray-600">Fresh from local farmers</p>
                        </div>
                        <Link
                            to="/products"
                            className="hidden sm:flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                            View All
                            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    {/* Products Grid */}
                    {loadingProducts ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {products.slice(0, 8).map((product) => (
                                <Link key={product.product_id} to={`/products/${product.product_id}`} className="group">
                                    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                                        {/* Product Image */}
                                        <div className="relative aspect-square bg-gray-100">
                                            {product.image ? (
                                                <img
                                                    src={product.image.startsWith('http') ? product.image : `http://localhost:5000/${product.image}`}
                                                    alt={product.product_name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                                                    <span className="text-4xl">🌾</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-4">
                                            <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                                                {product.product_name}
                                            </h3>
                                            <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-emerald-600">RWF {product.price}</span>
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        const token = localStorage.getItem('token');
                                                        if (!token) {
                                                            navigate('/login');
                                                        } else {
                                                            try {
                                                                await addToCart(product, 1);
                                                            } catch (error) {
                                                                console.error(error);
                                                            }
                                                        }
                                                    }}
                                                    className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Mobile View All Button */}
                    <div className="sm:hidden text-center mt-6">
                        <Link
                            to="/products"
                            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium"
                        >
                            View All Products
                        </Link>
                    </div>
                </div>
            </section>

            {/* 3️⃣ CATEGORIES SECTION */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Shop by Category</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categories.slice(0, 8).map((category, index) => (
                            <Link
                                key={index}
                                to={`/products?category=${encodeURIComponent(category)}`}
                                className="group relative aspect-square rounded-xl overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 group-hover:from-emerald-500 group-hover:to-cyan-600 transition-all duration-300"></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                                    <span className="text-3xl mb-2">
                                        {index === 0 ? '🥬' : index === 1 ? '🍎' : index === 2 ? '🥕' : index === 3 ? '🍌' : index === 4 ? '🥔' : index === 5 ? '🌽' : index === 6 ? '🍇' : '🍊'}
                                    </span>
                                    <span className="font-medium text-center">{category}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4️⃣ SPECIAL OFFERS BANNER */}
            <section className="py-16 bg-gradient-to-r from-emerald-600 to-cyan-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between text-white">
                        <div className="mb-6 md:mb-0">
                            <h2 className="text-3xl font-bold mb-2">Special Offer!</h2>
                            <p className="text-emerald-100">Get 20% off on your first order</p>
                        </div>
                        <Link
                            to="/products"
                            className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors"
                        >
                            Shop Now
                        </Link>
                    </div>
                </div>
            </section>

            {/* 5️⃣ NEW ARRIVALS */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">New Arrivals</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {products.slice(8, 12).map((product) => (
                            <Link key={product.product_id} to={`/products/${product.product_id}`} className="group">
                                <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                                    <div className="relative aspect-square bg-gray-100">
                                        {product.image ? (
                                            <img
                                                src={product.image.startsWith('http') ? product.image : `http://localhost:5000/${product.image}`}
                                                alt={product.product_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                                                <span className="text-4xl">🌾</span>
                                            </div>
                                        )}
                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                                            {product.product_name}
                                        </h3>
                                        <span className="font-bold text-emerald-600">RWF {product.price}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6️⃣ WHY CHOOSE US */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose FarmerJoin?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Direct from Farmers</h3>
                            <p className="text-gray-600 text-sm">Buy directly from local farmers, no middlemen involved</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0 0a5 5 0 017.54-.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Fair Prices</h3>
                            <p className="text-gray-600 text-sm">Get the best prices with transparent pricing</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Fast Delivery</h3>
                            <p className="text-gray-600 text-sm">Quick and reliable delivery to your doorstep</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7️⃣ FOOTER */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="font-bold text-lg mb-4">FarmerJoin</h3>
                            <p className="text-gray-400 text-sm">Connecting farmers with buyers for a sustainable agricultural future.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                                <li><Link to="/products" className="hover:text-white">Products</Link></li>
                                <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link to="#" className="hover:text-white">Help Center</Link></li>
                                <li><Link to="#" className="hover:text-white">Contact Us</Link></li>
                                <li><Link to="#" className="hover:text-white">FAQs</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>info@farmerjoin.rw</li>
                                <li>+250 788 123 456</li>
                                <li>Kigali, Rwanda</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                        <p>&copy; 2024 FarmerJoin. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;
