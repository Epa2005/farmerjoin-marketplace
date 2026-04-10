import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNewTranslation } from "../hooks/useNewTranslation";
import { useCart } from "../context/CartContext";
import LanguageSelector from "./LanguageSelector";
import DarkModeToggle from "./DarkModeToggle";

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const { t } = useNewTranslation();
    const { getCartItemsCount } = useCart();
    const cartCount = getCartItemsCount();

    // Check user session on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <nav className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-large backdrop-blur-md sticky top-0 z-50 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Logo - Left Side */}
                    <div className="flex items-center flex-1">
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span className="text-2xl">🌾</span>
                            </div>
                            <span className="text-white text-2xl font-heading font-bold tracking-tight group-hover:text-primary-100 transition-colors">
                                FarmerJoin
                            </span>
                        </Link>
                    </div>
                    
                    {/* Desktop Menu - Centered */}
                    <div className="hidden md:flex items-center justify-center flex-1 space-x-2">
                        <Link 
                            to="/about" 
                            className="text-white/90 hover:text-white hover:bg-white/10 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 font-ui tracking-wide"
                        >
                            {t('about')}
                        </Link>
                        <Link 
                            to="/products" 
                            className="text-white/90 hover:text-white hover:bg-white/10 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 font-ui tracking-wide"
                        >
                            {t('products')}
                        </Link>
                        <Link 
                            to="/login" 
                            className="text-white/90 hover:text-white hover:bg-white/10 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 font-ui tracking-wide"
                        >
                            {t('login')}
                        </Link>
                        <Link 
                            to="/dashboard" 
                            className="bg-white text-primary-600 hover:bg-primary-50 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-ui tracking-wide"
                        >
                            {t('dashboard')}
                        </Link>
                    </div>

                    {/* Right Side - Cart and Language */}
                    <div className="hidden md:flex items-center justify-end flex-1 space-x-4">
                        {/* Dark Mode Toggle */}
                        <div className="p-2">
                            <DarkModeToggle />
                        </div>
                        
                        {/* Cart Icon */}
                        <Link 
                            to="/cart"
                            className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-white text-primary-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>
                        
                        <LanguageSelector isDropdown={true} />
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center justify-end flex-1 md:hidden space-x-2">
                        {/* Dark Mode Toggle */}
                        <div className="p-2">
                            <DarkModeToggle />
                        </div>
                        
                        {/* Cart Icon Mobile */}
                        <Link 
                            to="/cart"
                            className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-white text-primary-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>
                        
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-white hover:bg-white/10 p-2 rounded-xl transition-all duration-300"
                        >
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-primary-700/95 backdrop-blur-md animate-slide-down">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        <Link 
                            to="/about" 
                            className="text-white/90 hover:text-white hover:bg-white/10 block px-4 py-3 rounded-xl font-medium transition-all duration-300"
                        >
                            {t('about')}
                        </Link>
                        <Link 
                            to="/products" 
                            className="text-white/90 hover:text-white hover:bg-white/10 block px-4 py-3 rounded-xl font-medium transition-all duration-300"
                        >
                            {t('products')}
                        </Link>
                        <Link 
                            to="/login" 
                            className="text-white/90 hover:text-white hover:bg-white/10 block px-4 py-3 rounded-xl font-medium transition-all duration-300"
                        >
                            {t('login')}
                        </Link>
                        <Link 
                            to="/dashboard" 
                            className="bg-white text-primary-600 hover:bg-primary-50 block px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                        >
                            {t('dashboard')}
                        </Link>
                        
                        {/* Language Selector for Mobile */}
                        <div className="pt-4 border-t border-white/20">
                            <LanguageSelector isDropdown={true} />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
