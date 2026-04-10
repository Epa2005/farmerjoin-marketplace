import { useEffect, useState } from "react";
import API from "../api";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useNewTranslation } from "../hooks/useNewTranslation";
import { useDatabaseTranslation } from "../hooks/useDatabaseTranslation";
import { useCart } from "../context/CartContext";

function Products() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useNewTranslation();
    const { useTranslatedProducts } = useDatabaseTranslation();
    const { selectedFarmer, setSelectedFarmer, clearSelectedFarmer } = useCart();
    const [products, setProducts] = useState([]);
    const translatedProducts = useTranslatedProducts(products);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [farmers, setFarmers] = useState([]);
    const [showFarmerSelector, setShowFarmerSelector] = useState(false);

    // Check authentication on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
            navigate('/login');
            return;
        }

        // Check if farmer was passed from BuyerDashboard
        if (location.state?.selectedFarmer) {
            setSelectedFarmer(location.state.selectedFarmer);
        }
        
        // Only fetch products if authenticated
        setLoading(true);
        API.get("/products")
            .then(res => {
                console.log('Products fetched:', res.data);
                setProducts(res.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setError(t('failedFetchProducts'));
                setLoading(false);
            });

        // Fetch available farmers
        API.get("/buyer/farmers")
            .then(res => {
                console.log('Farmers fetched:', res.data);
                setFarmers(res.data || []);
            })
            .catch(err => {
                console.error("Farmers fetch error:", err);
            });
    }, [navigate, location.state]);

    // Handler functions
    const handleFarmerSelection = (farmer) => {
        setSelectedFarmer(farmer);
        setShowFarmerSelector(false);
        // Filter products by selected farmer
        API.get(`/products?farmer_id=${farmer.user_id}`)
            .then(res => {
                setProducts(res.data || []);
            })
            .catch(err => {
                console.error("Filtered products error:", err);
            });
    };

    const clearFarmerSelection = () => {
        clearSelectedFarmer();
        // Show all products again
        API.get("/products")
            .then(res => {
                setProducts(res.data || []);
            })
            .catch(err => {
                console.error("All products error:", err);
            });
    };

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-16 w-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                    <p className="text-gray-700 font-semibold text-lg">{t('loadingProducts')}</p>
                    <p className="text-gray-600 text-sm mt-2">{t('connectingFarmers')}</p>
                </div>
            </div>
        );
    }

    // Error screen
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
                    <div className="text-red-500 text-6xl mb-4">🌾</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Farmer Selection Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {selectedFarmer ? '📍 Selected Farmer' : '👨‍🌾 Select Nearest Farmer'}
                            </h2>
                            {selectedFarmer && (
                                <div className="flex items-center space-x-3 bg-green-50 px-4 py-2 rounded-lg">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {selectedFarmer.full_name?.charAt(0) || 'F'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{selectedFarmer.full_name}</p>
                                        <p className="text-sm text-gray-600">{selectedFarmer.location || 'Location not specified'}</p>
                                    </div>
                                    <button
                                        onClick={clearFarmerSelection}
                                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>
                        {!selectedFarmer && (
                            <button
                                onClick={() => setShowFarmerSelector(!showFarmerSelector)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                            >
                                {showFarmerSelector ? 'Hide Farmers' : 'Show Farmers'}
                            </button>
                        )}
                    </div>

                    {/* Farmer Selector Modal */}
                    {showFarmerSelector && !selectedFarmer && (
                        <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                            <h3 className="font-medium text-gray-900 mb-3">Available Farmers Near You</h3>
                            {farmers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {farmers.map((farmer) => (
                                        <div
                                            key={farmer.user_id}
                                            onClick={() => handleFarmerSelection(farmer)}
                                            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {farmer.full_name?.charAt(0) || 'F'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{farmer.full_name}</p>
                                                    <p className="text-sm text-gray-600">{farmer.location || 'Location not specified'}</p>
                                                    <p className="text-xs text-emerald-600">📍 {farmer.distance || 'Near you'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No farmers available at the moment</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-gray-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary-500">🌾 Fresh Marketplace</h1>
                        <p className="text-gray-300 text-lg mb-6">Discover premium products directly from local farmers</p>
                        <div className="flex justify-center items-center space-x-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary-500">{products.length}</div>
                                <div className="text-gray-400 text-sm">Products</div>
                            </div>
                            <div className="w-px h-8 bg-gray-600"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary-500">{new Set(products.map(p => p.full_name)).size}</div>
                                <div className="text-gray-400 text-sm">Farmers</div>
                            </div>
                            <div className="w-px h-8 bg-gray-600"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary-500">{new Set(products.map(p => p.category)).size}</div>
                                <div className="text-gray-400 text-sm">Categories</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{t('totalProducts')}</p>
                                <p className="text-3xl font-black text-primary-600">{products.length}</p>
                            </div>
                            <div className="text-4xl opacity-80">📦</div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{t('available')}</p>
                                <p className="text-3xl font-black text-primary-600">{products.filter(p => p.quantity > 0).length}</p>
                            </div>
                            <div className="text-4xl opacity-80">✅</div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{t('categories')}</p>
                                <p className="text-3xl font-black text-primary-600">{new Set(products.map(p => p.category)).size}</p>
                            </div>
                            <div className="text-4xl opacity-80">🏷️</div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{t('avgPrice')}</p>
                                <p className="text-3xl font-black text-primary-600">
                                    ${products.length > 0 ? Math.round(products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / products.length) : 0}
                                </p>
                            </div>
                            <div className="text-4xl opacity-80">💰</div>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                {products.length === 0 ? (
                    <div className="text-center py-20 animate-fade-in">
                        <div className="text-8xl mb-6 animate-float">🌾</div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">{t('noProductsFound')}</h3>
                        <p className="text-gray-600 text-lg mb-8">{t('checkBackLater')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product, index) => (
                            <div 
                                key={product.product_id} 
                                className="card card-hover animate-slide-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Product Image */}
                                <Link to={`/products/${product.product_id}`} className="block">
                                    <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl overflow-hidden">
                                        {product.image || product.image_url ? (
                                            <img 
                                                src={`http://localhost:5000/${product.image || product.image_url}`} 
                                                alt={product.product_name}
                                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    console.error('Image load error in Products:', e);
                                                    console.log('Failed image URL:', `http://localhost:5000/${product.image || product.image_url}`);
                                                    console.log('Product data:', product);
                                                    e.target.style.display = 'none';
                                                }}
                                                onLoad={() => {
                                                    console.log('Image loaded successfully in Products for:', product.product_name);
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="text-7xl text-gray-300">🌾</div>
                                            </div>
                                        )}
                                        
                                        {/* Stock Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span className={`badge ${
                                                product.quantity > 0 
                                                    ? 'badge-success' 
                                                    : 'badge-error'
                                            }`}>
                                                {product.quantity > 0 ? `${product.quantity} ${t('inStock')}` : t('outOfStock')}
                                            </span>
                                        </div>
                                        
                                        {/* Quick View Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <span className="text-white font-semibold">View Details →</span>
                                        </div>
                                    </div>
                                </Link>

                                {/* Product Info */}
                                <div className="p-5">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-primary-600 transition-colors line-clamp-1">
                                            {product.product_name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-3 flex items-center">
                                            <span className="mr-1">🧑‍🌾</span>
                                            {product.full_name || 'Local Farmer'}
                                        </p>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="badge badge-info">
                                                {product.category}
                                            </span>
                                            <span className="text-2xl font-black text-primary-600">
                                                ${product.price}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        disabled={product.quantity <= 0}
                                        className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                                            product.quantity > 0
                                                ? 'btn-primary'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {product.quantity > 0 ? `🛒 ${t('addToCart')}` : `❌ ${t('outOfStock')}`}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Stats */}
                {products.length > 0 && (
                    <div className="mt-12 bg-gray-800 rounded-xl p-8 text-white text-center shadow-xl">
                        <h3 className="text-2xl font-bold mb-4 text-primary-500">🌱 Supporting Local Farmers</h3>
                        <p className="text-gray-300 mb-6">Every purchase directly supports local farmers and their families</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="text-3xl font-bold mb-2 text-primary-500">🚚</div>
                                <p className="text-gray-400">Fast Delivery</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-2 text-primary-500">🌿</div>
                                <p className="text-gray-400">100% Fresh</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-2 text-primary-500">💚</div>
                                <p className="text-gray-400">Sustainable Farming</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Products;
