import { useState, useEffect } from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';

const HeroSlider = () => {
  const { t } = useNewTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState('next');
  const [isLoaded, setIsLoaded] = useState(false);

  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1577683663445-9d5d4e9b0f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80',
      title: t('heroSlide1Title'),
      subtitle: t('heroSlide1Subtitle'),
      description: t('heroSlide1Description'),
      gradient: 'from-emerald-700/80 to-teal-800/80'
    },
    {
      image: 'https://images.unsplash.com/photo-1592831564632-0c1a3e8a5a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80',
      title: t('heroSlide2Title'),
      subtitle: t('heroSlide2Subtitle'),
      description: t('heroSlide2Description'),
      gradient: 'from-green-700/80 to-emerald-800/80'
    },
    {
      image: 'https://images.unsplash.com/photo-1605000797494-3177d6a5cb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80',
      title: t('heroSlide3Title'),
      subtitle: t('heroSlide3Subtitle'),
      description: t('heroSlide3Description'),
      gradient: 'from-blue-700/80 to-indigo-800/80'
    },
    {
      image: 'https://images.unsplash.com/photo-1542831371-97e0731d9d0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80',
      title: t('heroSlide4Title'),
      subtitle: t('heroSlide4Subtitle'),
      description: t('heroSlide4Description'),
      gradient: 'from-amber-700/80 to-orange-800/80'
    },
    {
      image: 'https://images.unsplash.com/photo-1571013108002-1f0cce899cd5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80',
      title: t('heroSlide5Title'),
      subtitle: t('heroSlide5Subtitle'),
      description: t('heroSlide5Description'),
      gradient: 'from-purple-700/80 to-pink-800/80'
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setDirection('next');
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  const nextSlide = () => {
    setDirection('next');
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection('prev');
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setDirection(index > currentSlide ? 'next' : 'prev');
    setCurrentSlide(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getSlideAnimation = (index) => {
    if (index === currentSlide) {
      return direction === 'next' 
        ? 'translate-x-0 opacity-100 scale-100' 
        : 'translate-x-0 opacity-100 scale-100';
    }
    return direction === 'next' 
      ? '-translate-x-full opacity-0 scale-95' 
      : 'translate-x-full opacity-0 scale-95';
  };

  const getTextAnimation = (index, delay) => {
    if (index === currentSlide && isLoaded) {
      return 'opacity-100 translate-y-0';
    }
    return 'opacity-0 translate-y-8';
  };

  return (
    <div className="relative h-[400px] overflow-hidden bg-gray-900">
      {/* Slides Container */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center ${getSlideAnimation(index)}`}
          >
            {/* Background Image with Professional Effects */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${slide.image})`,
                filter: index === currentSlide ? 'brightness(0.8) contrast(1.05)' : 'brightness(0.6) contrast(0.95)',
                transform: index === currentSlide ? 'scale(1.05)' : 'scale(1.1)',
                transition: 'all 8s ease-in-out'
              }}
            />
            
            {/* Professional Gradient Overlay */}
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, 
                  rgba(0,0,0,0.3) 0%, 
                  rgba(0,0,0,0.5) 50%, 
                  rgba(0,0,0,0.7) 100%)`
              }}
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}></div>
            
            {/* Animated Light Leaks */}
            {index === currentSlide && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-400/8 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400/8 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-0 w-64 h-64 bg-green-400/8 rounded-full blur-2xl animate-pulse animation-delay-4000"></div>
              </div>
            )}
            
            {/* Content */}
            <div className="relative z-20 text-center text-white px-4 max-w-4xl">
              <div 
                className={`transition-all duration-1000 delay-200 ${getTextAnimation(index, 200)}`}
              >
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
                  {slide.title}
                </h1>
              </div>
              <div 
                className={`transition-all duration-1000 delay-400 ${getTextAnimation(index, 400)}`}
              >
                <h2 className="text-xl md:text-3xl font-light mb-4 leading-tight">
                  {slide.subtitle}
                </h2>
              </div>
              <div 
                className={`transition-all duration-1000 delay-600 ${getTextAnimation(index, 600)}`}
              >
                <p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed font-light">
                  {slide.description}
                </p>
              </div>
              <div 
                className={`transition-all duration-1000 delay-800 ${getTextAnimation(index, 800)}`}
              >
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl">
                    Get Started
                  </button>
                  <button className="border-2 border-white hover:bg-white hover:text-gray-900 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 border border-white/30 z-30"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 border border-white/30 z-30"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Enhanced Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="absolute top-6 right-6 bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 border border-white/30 z-30"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {/* Professional Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`relative transition-all duration-500 ${
              index === currentSlide
                ? 'w-12 h-2 bg-white rounded-full shadow-lg'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60 rounded-full'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          >
            {index === currentSlide && (
              <div className="absolute inset-0 bg-white rounded-full animate-pulse shadow-lg"></div>
            )}
          </button>
        ))}
      </div>

      {/* Enhanced Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-5000 ease-linear shadow-lg"
          style={{
            width: isPlaying ? `${((currentSlide + 1) / slides.length) * 100}%` : `${((currentSlide + 1) / slides.length) * 100}%`,
            boxShadow: '0 0 10px rgba(52, 211, 153, 0.5)'
          }}
        />
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;
