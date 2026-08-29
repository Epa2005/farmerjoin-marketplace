import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useTranslation } from "../hooks/useTranslation";
import API from "../api";

const About = () => {
    const { t, language, changeLanguage } = useTranslation();
    const [isVisible, setIsVisible] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [stats, setStats] = useState({
        totalFarmers: 0,
        totalTransactions: 0,
        totalOrders: 0,
        foundedYear: 2026
    });
    const [loadingStats, setLoadingStats] = useState(true);

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

    // Fetch platform statistics from database
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoadingStats(true);
                console.log('Fetching platform stats from frontend...');
                // Try to fetch platform stats from backend
                const statsRes = await API.get('/stats/platform');
                console.log('Stats response:', statsRes.data);

                if (statsRes.data && statsRes.data.data) {
                    const platformStats = statsRes.data.data;
                    console.log('Platform stats:', platformStats);
                    setStats({
                        totalFarmers: platformStats.totalFarmers || 0,
                        totalTransactions: platformStats.totalTransactions || 0,
                        totalOrders: platformStats.totalOrders || 0,
                        foundedYear: platformStats.foundedYear || 2026
                    });
                } else {
                    console.log('No data in response, using fallback');
                    setStats({
                        totalFarmers: 0,
                        totalTransactions: 0,
                        totalOrders: 0,
                        foundedYear: 2026
                    });
                }
            } catch (err) {
                console.error('Error fetching platform stats:', err);
                // Fallback to default values if API fails
                setStats({
                    totalFarmers: 0,
                    totalTransactions: 0,
                    totalOrders: 0,
                    foundedYear: 2026
                });
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, []);

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
            <div className="fixed top-16 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-40">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Hero Section */}
            <section className="relative h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight animate-fade-in-up">
                        {t('aboutTitle')}
                    </h1>
                    <p className="text-lg md:text-xl font-light mb-8 leading-relaxed max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        {t('aboutSubtitle')}
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section id="mission" className="py-12 bg-white dark:bg-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('ourMission')}
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('missionText')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: '🌱',
                                title: t('value1'),
                                description: t('value1Text')
                            },
                            {
                                icon: '🤝',
                                title: t('value2'),
                                description: t('value2Text')
                            },
                            {
                                icon: '🚀',
                                title: t('value3'),
                                description: t('value3Text')
                            }
                        ].map((item, index) => (
                            <div key={index} className="text-center group">
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-emerald-100 dark:border-gray-600">
                                    <div className="text-5xl mb-4">{item.icon}</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section id="story" className="py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                {t('ourStory', 'Our Story')}
                            </h2>
                            <div className="space-y-4">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {t('storyParagraph1', 'FarmerJoin was born from a simple observation: Rwandan farmers were losing up to 40% of their profits to middlemen, while buyers struggled to access fresh, quality produce directly from the source.')}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {t('storyParagraph2', 'Founded in 2026, we\'ve grown from a small team of passionate developers to a platform serving thousands of farmers and buyers across Rwanda. Our commitment remains the same: create fair, transparent, and efficient agricultural markets.')}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {t('storyParagraph3', `Today, we're proud to be Rwanda's leading agricultural marketplace, connecting over ${stats.totalFarmers.toLocaleString()} farmers with buyers nationwide, facilitating millions in fair trade transactions.`)}
                                </p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl">
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                                        {loadingStats ? '...' : stats.foundedYear}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-300 font-medium">{t('founded', 'Founded')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                                        {loadingStats ? '...' : stats.totalFarmers.toLocaleString()}+
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-300 font-medium">{t('farmers', 'Farmers')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                                        {loadingStats ? '...' : `RWF ${stats.totalTransactions.toLocaleString()}+`}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-300 font-medium">{t('transactions', 'Transactions')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section id="values" className="py-12 bg-white dark:bg-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('ourValues', 'Our Values')}
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('valuesSubtitle', 'The principles that guide everything we do')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: '🎯',
                                title: t('transparency', 'Transparency'),
                                description: t('transparencyDesc', 'Clear pricing and honest transactions for all parties')
                            },
                            {
                                icon: '💪',
                                title: t('empowerment', 'Empowerment'),
                                description: t('empowermentDesc', 'Giving farmers the tools to succeed independently')
                            },
                            {
                                icon: '🌍',
                                title: t('sustainability', 'Sustainability'),
                                description: t('sustainabilityDesc', 'Supporting environmentally friendly farming practices')
                            },
                            {
                                icon: '⚡',
                                title: t('efficiency', 'Efficiency'),
                                description: t('efficiencyDesc', 'Making agricultural trade faster and simpler')
                            }
                        ].map((value, index) => (
                            <div key={index} className="group">
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-emerald-100 dark:border-gray-600 h-full">
                                    <div className="text-4xl mb-4 text-center">{value.icon}</div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 text-center">
                                        {value.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm text-center">
                                        {value.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section id="team" className="py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('meetOurTeam', 'Meet Our Team')}
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('teamSubtitle', 'The passionate people behind FarmerJoin')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: 'Jean-Pierre Niyonzima',
                                role: 'CEO & Co-Founder',
                                image: '/images/userphoto.jpg',
                                bio: 'Agricultural technologist with 10+ years experience in Rwandan farming communities'
                            },
                            {
                                name: 'Grace Mukamana',
                                role: 'CTO & Co-Founder',
                                image: '/images/userphoto.jpg',
                                bio: 'Software engineer passionate about building solutions for rural communities'
                            },
                            {
                                name: 'Emmanuel Uwimana',
                                role: 'Head of Operations',
                                image: '/images/userphoto.jpg',
                                bio: 'Supply chain expert focused on creating efficient agricultural markets'
                            }
                        ].map((member, index) => (
                            <div key={index} className="text-center group">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-100 dark:border-gray-700">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${member.name}&background=10b981&color=fff`;
                                        }}
                                    />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        {member.name}
                                    </h3>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-3">
                                        {member.role}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                                        {member.bio}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-12 bg-white dark:bg-gray-900 animate-on-scroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('contactUs')}
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('joinText')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-lg">
                                <div className="text-4xl mb-4">📧</div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {t('emailUs', 'Email Us')}
                                </h3>
                                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    info@farmerjoin.rw
                                </p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-lg">
                                <div className="text-4xl mb-4">📱</div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {t('callUs', 'Call Us')}
                                </h3>
                                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    +250 788 123 456
                                </p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-lg">
                                <div className="text-4xl mb-4">📍</div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {t('visitUs', 'Visit Us')}
                                </h3>
                                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    Kigali, Rwanda
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            to="/register"
                            className="inline-block bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            {t('joinUs')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />

            {/* Custom Styles */}
            <style>{`
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
                
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default About;
