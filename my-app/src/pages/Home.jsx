import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import HeroSlider from "../components/HeroSlider";
import ImageSlideshow from "../components/ImageSlideshow";
import { useNewTranslation } from "../hooks/useNewTranslation";

const Home = () => {
    const { t } = useNewTranslation();
    const [stats, setStats] = useState({
        users: 0,
        products: 0,
        markets: 0,
        satisfaction: 0
    });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isVisible, setIsVisible] = useState({});

    // Agricultural photos for hero slideshow
    const agriPhotos = [
        '/agri_photoes/close-up-countryside-worker-holding-peanuts.jpg',
        '/agri_photoes/countryside-people-out-field-together.jpg',
        '/agri_photoes/countryside-woman-holding-plant-leaves.jpg',
        '/agri_photoes/tamrat-touloumon-g6cUko7Ss4E-unsplash.jpg'
    ];

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

            {/* 1️⃣ POWERFUL HERO SECTION WITH AGRICULTURAL SLIDESHOW */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
                {/* Agricultural Photo Slideshow as Background */}
                <div className="absolute inset-0">
                    <ImageSlideshow images={agriPhotos} interval={3000} />
                </div>
                
                {/* Dark Overlay for Text Visibility */}
                <div className="absolute inset-0 bg-black/40"></div>
                
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    
                    {/* Floating Shapes */}
                    <div className="absolute top-1/4 left-1/4 w-20 h-20 border-2 border-white/20 rounded-lg animate-bounce" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border-2 border-white/20 rounded-full animate-spin" style={{ animationDuration: '8s', animationDelay: '3s' }}></div>
                    <div className="absolute top-3/4 left-3/4 w-12 h-12 border-2 border-white/20 rotate-45 animate-pulse" style={{ animationDelay: '4s' }}></div>
                </div>

                <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight tracking-tight animate-fade-in-up">
                        {t('heroTitle').split(' ').map((word, index) => (
                            <span key={index} className={index === 1 ? 'block text-emerald-200' : ''}>
                                {word} {index === 1 && <br />}
                            </span>
                        ))}
                    </h1>
                    <p className="text-lg md:text-xl lg:text-2xl font-light mb-8 leading-relaxed max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        {t('heroSubtitle')}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <Link
                            to="/register"
                            className="group relative px-12 py-5 bg-white text-emerald-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                        >
                            <span className="relative z-10">{t('getStarted')}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                        </Link>
                        <Link
                            to="/about"
                            className="px-12 py-5 border-2 border-white text-white rounded-2xl font-bold text-lg hover:bg-white hover:text-emerald-600 transform hover:scale-105 transition-all duration-300 shadow-xl"
                        >
                            {t('learnMore')}
                        </Link>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <svg className="w-6 h-10 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </section>

            {/* 2️⃣ ANIMATED STATISTICS SECTION */}
            <section id="stats" className="py-12 bg-white dark:bg-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: stats.users, label: t('farmersCount'), suffix: '+', icon: '👥' },
                            { value: stats.products, label: t('productsCount'), suffix: '+', icon: '🌾' },
                            { value: stats.markets, label: t('marketsCount'), suffix: '+', icon: '🏪' },
                            { value: stats.satisfaction, label: t('satisfactionRate'), suffix: '%', icon: '⭐' }
                        ].map((stat, index) => (
                            <div key={index} className="text-center group">
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-emerald-100 dark:border-gray-600">
                                    <div className="text-3xl mb-3">{stat.icon}</div>
                                    <div className={`text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-2 ${isVisible['stats'] ? 'animate-counter' : ''}`}>
                                        {stat.value}{stat.suffix}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-300 font-medium">
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3️⃣ PROBLEM → SOLUTION SECTION */}
            <section id="problem-solution" className="py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Problem */}
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 text-5xl text-red-500 dark:text-red-400">❌</div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                {t('theProblem')}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {t('farmersLoseProfits')}
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {t('limitedMarketAccess')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Solution */}
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 text-5xl text-green-500 dark:text-green-400">✔</div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                {t('theSolution')}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {t('directFarmerConnections')}
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {t('transparentPricing')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4️⃣ FEATURES SECTION */}
            <section id="features" className="py-12 bg-white dark:bg-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('powerfulFeatures')}
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('everythingYouNeed')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: '📱',
                                title: t('mobileFirst'),
                                description: t('mobileFirstDescription'),
                                color: 'from-blue-500 to-cyan-500'
                            },
                            {
                                icon: '🔒',
                                title: t('securePayments'),
                                description: t('securePaymentsDescription'),
                                color: 'from-green-500 to-emerald-500'
                            },
                            {
                                icon: '📊',
                                title: t('realTimeAnalytics'),
                                description: t('realTimeAnalyticsDescription'),
                                color: 'from-purple-500 to-pink-500'
                            },
                            {
                                icon: '💬',
                                title: t('directMessaging'),
                                description: t('directMessagingDescription'),
                                color: 'from-orange-500 to-red-500'
                            }
                        ].map((feature, index) => (
                            <div key={index} className="group">
                                <div className={`bg-gradient-to-br ${feature.color} p-1 rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}>
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl h-full">
                                        <div className="text-4xl mb-4">{feature.icon}</div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5️⃣ PREVIEW / DEMO SECTION */}
            <section id="preview" className="py-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('seeItInAction')}
                        </h2>
                        <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            {t('experienceFarmerJoin')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                {t('keyBenefits')}
                            </h3>
                            <div className="space-y-2">
                                {[
                                    t('increaseFarmerIncome'),
                                    t('reducePostHarvestLosses'),
                                    t('accessNewMarkets')
                                ].map((benefit, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300 text-sm">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-4 rounded-xl shadow-lg text-white">
                            <h3 className="text-lg font-bold mb-3">
                                {t('startYourJourney')}
                            </h3>
                            <p className="text-emerald-100 mb-3 text-sm">
                                {t('joinThousands')}
                            </p>
                            <Link
                                to="/register"
                                className="inline-block bg-white text-emerald-600 px-4 py-2 rounded-lg font-bold hover:bg-emerald-50 transform hover:scale-105 transition-all duration-300"
                            >
                                {t('tryDemoNow')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6️⃣ TESTIMONIALS SECTION */}
            <section id="testimonials" className="py-12 bg-white dark:bg-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('trustedByFarmers')}
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('realStoriesFromRealUsers')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                name: t('jeanMugisha'),
                                role: t('coffeeFarmer'),
                                location: t('northernProvince'),
                                image: '/images/farmer1.jpg',
                                testimonial: t('jeanTestimonial'),
                                rating: 5
                            },
                            {
                                name: t('graceUwimana'),
                                role: t('vegetableSeller'),
                                location: t('kigali'),
                                image: '/images/buyer1.jpg',
                                testimonial: t('graceTestimonial'),
                                rating: 5
                            },
                            {
                                name: t('emmanuelNiyonzima'),
                                role: t('cooperativeLeader'),
                                location: t('easternProvince'),
                                image: '/images/coop1.jpg',
                                testimonial: t('emmanuelTestimonial'),
                                rating: 5
                            }
                        ].map((testimonial, index) => (
                            <div key={index} className="group">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center mb-4">
                                        <img 
                                            src={testimonial.image} 
                                            alt={testimonial.name}
                                            className="w-12 h-12 rounded-full object-cover mr-3"
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${testimonial.name}&background=10b981&color=fff`;
                                            }}
                                        />
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{testimonial.name}</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{testimonial.role} • {testimonial.location}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex mb-3">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic text-sm">
                                        "{testimonial.testimonial}"
                                    </p>
                                </div>
                            </div>
                        ))}
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
