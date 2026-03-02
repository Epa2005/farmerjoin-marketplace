import { useEffect, useState } from "react";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";

function Products() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check authentication on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
            navigate('/login');
            return;
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
                setError('Failed to fetch products');
                setLoading(false);
            });
    }, [navigate]);

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-16 w-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                    <p className="text-gray-700 font-semibold text-lg">Loading Fresh Products...</p>
                    <p className="text-gray-600 text-sm mt-2">Connecting you with local farmers</p>
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
            {/* Header Section */}
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
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Products</p>
                                <p className="text-3xl font-black text-primary-600">{products.length}</p>
                            </div>
                            <div className="text-4xl opacity-80">📦</div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Available Now</p>
                                <p className="text-3xl font-black text-primary-600">{products.filter(p => p.quantity > 0).length}</p>
                            </div>
                            <div className="text-4xl opacity-80">✅</div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Categories</p>
                                <p className="text-3xl font-black text-primary-600">{new Set(products.map(p => p.category)).size}</p>
                            </div>
                            <div className="text-4xl opacity-80">🏷️</div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Avg Price</p>
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
                    <div className="text-center py-20">
                        <div className="text-8xl mb-6">🌾</div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">No Products Available</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">Check back later for fresh farm products!</p>
                        <Link 
                            to="/add-product"
                            className="bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors font-black text-lg inline-flex items-center shadow-xl hover:shadow-2xl transform hover:scale-105"
                        >
                            <span className="mr-2">➕</span> Add First Product
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div key={product.product_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700">
                                {/* Product Image */}
                                <Link to={`/products/${product.product_id}`} className="block">
                                    <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                                        {product.image ? (
                                            <img 
                                                src={`http://localhost:4000/${product.image}`} 
                                                alt={product.product_name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="text-6xl text-gray-300 dark:text-gray-600">🌾</div>
                                            </div>
                                        )}
                                        
                                        {/* Stock Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                product.quantity > 0 
                                                    ? 'bg-primary-600 text-white' 
                                                    : 'bg-red-500 text-white'
                                            }`}>
                                                {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>

                                {/* Product Info */}
                                <div className="p-6">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-primary-500 transition-colors">
                                            {product.product_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                            🧑‍🌾 {product.full_name || 'Local Farmer'}
                                        </p>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="inline-block bg-primary-100 text-primary-700 text-xs px-3 py-1 rounded-full font-semibold border border-gray-200 dark:border-gray-600">
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
                                        className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 ${
                                            product.quantity > 0
                                                ? 'bg-primary-600 text-white hover:bg-primary-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {product.quantity > 0 ? '🛒 Add to Cart' : '❌ Out of Stock'}
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
