import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNewTranslation } from "../hooks/useNewTranslation";
import { useCart } from "../context/CartContext";
import DarkModeToggle from "./DarkModeToggle";

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const { t, changeLanguage, language } = useNewTranslation();
    const { items } = useCart();
    const cartCount = items.length;

    console.log('Navbar render - cartCount:', cartCount, 'items:', items);

    // Check user session on mount and when storage changes
    useEffect(() => {
        const loadUserData = () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (token && userData) {
                const parsedUser = JSON.parse(userData);
                console.log('Navbar - Loading user data:', parsedUser);
                setUser(parsedUser);
            } else {
                setUser(null);
            }
        };

        loadUserData();

        // Listen for storage changes (profile updates)
        window.addEventListener('storage', loadUserData);
        return () => window.removeEventListener('storage', loadUserData);
    }, []);

    // Force re-render when cart items change
    useEffect(() => {
        console.log('Navbar - Cart items changed:', items.length, 'items:', items);
    }, [items]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
            {/* Top Bar */}
            <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-xs py-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <span>{t('welcomeToFarmerJoin')}</span>
                    <div className="flex items-center space-x-4">
                        <select
                            value={language || 'en'}
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="bg-white/20 text-white text-xs px-2 py-1 rounded border border-white/30 cursor-pointer"
                        >
                            <option value="en" className="text-gray-900">English</option>
                            <option value="fr" className="text-gray-900">Français</option>
                            <option value="rw" className="text-gray-900">Kinyarwanda</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                                <span className="text-white text-xl font-bold">FJ</span>
                            </div>
                            <div className="hidden sm:block">
                                <span className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">FarmerJoin</span>
                            </div>
                        </Link>
                    </div>

                    {/* Search Bar - Desktop */}
                    <div className="hidden md:flex flex-1 max-w-lg mx-8">
                        <form onSubmit={handleSearch} className="relative w-full">
                            <input
                                type="text"
                                placeholder={t('searchProductsFarmers')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-12 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 text-sm"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </form>
                    </div>

                    {/* Navigation Links - Desktop */}
                    <div className="hidden md:flex items-center space-x-1">
                        <Link 
                            to="/products" 
                            className="px-4 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-all duration-200 text-sm"
                        >
                            {t('products')}
                        </Link>
                        <Link 
                            to="/about" 
                            className="px-4 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-all duration-200 text-sm"
                        >
                            {t('about')}
                        </Link>
                        
                        {user ? (
                            <>
                                <Link 
                                    to="/dashboard" 
                                    className="px-4 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-all duration-200 text-sm"
                                >
                                    {t('dashboard')}
                                </Link>
                                <div className="relative group">
                                    <button className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-emerald-600 rounded-lg transition-all duration-200">
                                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-500">
                                            {user.photo ? (
                                                <img
                                                    src={user.photo.startsWith('http') ? user.photo : `http://localhost:5000/${user.photo}`}
                                                    alt={user.full_name || 'User'}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">
                                                        {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {/* Dropdown */}
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                        <Link
                                            to="/edit-profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-t-lg"
                                        >
                                            {t('editProfile')}
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                                        >
                                            {t('logout')}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Link 
                                to="/login" 
                                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                            >
                                {t('login')}
                            </Link>
                        )}
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center space-x-3">
                        <div className="p-2">
                            <DarkModeToggle />
                        </div>

                        {/* Cart Icon - Only for buyers */}
                        {user?.role === 'buyer' && (
                            <Link
                                to="/cart"
                                className="relative p-2 text-gray-700 hover:text-emerald-600 transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden p-2 text-gray-700 hover:text-emerald-600 transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="md:hidden bg-white border-t border-gray-100 animate-slide-down">
                    <div className="px-4 py-4 space-y-3">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder={t('searchProducts')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-sm"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-600"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </form>

                        <Link 
                            to="/products" 
                            className="block px-4 py-3 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-all duration-200"
                        >
                            {t('products')}
                        </Link>
                        <Link 
                            to="/about" 
                            className="block px-4 py-3 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-all duration-200"
                        >
                            {t('about')}
                        </Link>
                        
                        {user ? (
                            <>
                                <Link 
                                    to="/dashboard" 
                                    className="block px-4 py-3 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-all duration-200"
                                >
                                    {t('dashboard')}
                                </Link>
                                <Link 
                                    to="/edit-profile" 
                                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-all duration-200"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-500">
                                        {user.photo ? (
                                            <img
                                                src={user.photo.startsWith('http') ? user.photo : `http://localhost:5000/${user.photo}`}
                                                alt={user.full_name || 'User'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">
                                                    {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <span>{t('editProfile')}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all duration-200"
                                >
                                    {t('logout')}
                                </button>
                            </>
                        ) : (
                            <Link 
                                to="/login" 
                                className="block px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium text-center transition-all duration-200"
                            >
                                {t('login')}
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
