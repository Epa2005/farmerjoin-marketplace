import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNewTranslation } from '../hooks/useNewTranslation';

const HeroSection = () => {
  const { t } = useNewTranslation();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.5;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-50 via-emerald-50 to-teal-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Parallax Layers */}
        <div
          className="absolute top-0 left-0 w-96 h-96 bg-primary-400/20 rounded-full filter blur-3xl parallax-slow"
          style={{
            transform: `translateY(${parallaxOffset * 0.3}px)`,
          }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl parallax-medium"
          style={{
            transform: `translateY(${parallaxOffset * 0.5}px)`,
          }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/15 rounded-full filter blur-2xl parallax-fast"
          style={{
            transform: `translate(-50%, -50%) translateY(${parallaxOffset * 0.7}px)`,
          }}
        ></div>
      </div>

      {/* Floating Agricultural Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float parallax-slow">grass</div>
        <div className="absolute top-40 right-20 text-5xl opacity-20 animate-float parallax-medium" style={{ animationDelay: '0.5s' }}>seedling</div>
        <div className="absolute bottom-40 left-20 text-6xl opacity-20 animate-float parallax-fast" style={{ animationDelay: '1s' }}>herb</div>
        <div className="absolute bottom-20 right-10 text-4xl opacity-20 animate-float parallax-slow" style={{ animationDelay: '1.5s' }}>leaf</div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Title with Animation */}
          <div className="mb-8 animate-bounce-in">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              <span className="gradient-text primary">FarmerJoin</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              {t('heroDescription') || 'Connect directly with local farmers and get fresh, organic produce delivered to your doorstep'}
            </p>
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-enhanced p-6 rounded-2xl hover-lift animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl mb-2 animate-heartbeat">grass</div>
              <div className="text-3xl font-bold text-primary-600 mb-1">500+</div>
              <div className="text-gray-600">{t('localFarmers') || 'Local Farmers'}</div>
            </div>
            <div className="glass-enhanced p-6 rounded-2xl hover-lift animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-4xl mb-2 animate-pulse-glow">leaf</div>
              <div className="text-3xl font-bold text-primary-600 mb-1">1000+</div>
              <div className="text-gray-600">{t('organicProducts') || 'Organic Products'}</div>
            </div>
            <div className="glass-enhanced p-6 rounded-2xl hover-lift animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="text-4xl mb-2 animate-wave">seedling</div>
              <div className="text-3xl font-bold text-primary-600 mb-1">50K+</div>
              <div className="text-gray-600">{t('happyCustomers') || 'Happy Customers'}</div>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <Link
              to="/products"
              className="btn-primary text-lg px-8 py-4 hover-scale magnetic"
            >
              {t('shopNow') || 'Shop Now'}
            </Link>
            <Link
              to="/register"
              className="btn-outline text-lg px-8 py-4 hover-scale"
            >
              {t('becomeFarmer') || 'Become a Farmer'}
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="text-gray-400 text-sm mb-2">{t('scrollDown') || 'Scroll Down'}</div>
            <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
