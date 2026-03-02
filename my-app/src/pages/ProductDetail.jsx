import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api";

function ProductDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
            navigate('/login');
            return;
        }

        // Fetch product details
        setLoading(true);
        API.get(`/products/${productId}`)
            .then(res => {
                setProduct(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching product:", err);
                setError(err?.response?.data?.message || 'Failed to load product details');
                setLoading(false);
            });
    }, [productId, navigate]);

    const handleAddToCart = () => {
        // Cart functionality would go here
        alert(`Added ${quantity} ${product.product_name} to cart!`);
    };

    const handleContactFarmer = () => {
        // Contact functionality would go here
        alert(`Contact ${product.farmer_name} about ${product.product_name}`);
    };

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-16 w-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                    <p className="text-gray-700 font-semibold text-lg">Loading Product Details...</p>
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

    if (!product) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-gray-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary-500">🌾 Product Details</h1>
                        <p className="text-gray-300 text-lg mb-6">Premium quality from local farmers</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product Images */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                {product.image ? (
                                    <img 
                                        src={`http://localhost:4000/${product.image}`} 
                                        alt={product.product_name}
                                        className="w-full h-96 object-cover"
                                        onError={(e) => {
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="24"%3E🌾%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-96 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        <div className="text-8xl text-gray-300 dark:text-gray-600">🌾</div>
                                    </div>
                                )}
                                
                                {/* Stock Badge */}
                                <div className="absolute top-4 right-4">
                                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                                        product.quantity > 0 
                                            ? 'bg-primary-600 text-white' 
                                            : 'bg-red-500 text-white'
                                    }`}>
                                        {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of Stock'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{product.product_name}</h1>
                                <div className="flex items-center space-x-4 mb-4">
                                    <span className="inline-block bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full font-semibold">
                                        {product.category}
                                    </span>
                                    <div className="flex items-center">
                                        <span className="text-yellow-500">⭐</span>
                                        <span className="text-gray-600 dark:text-gray-400 ml-1">4.5 (23 reviews)</span>
                                    </div>
                                </div>
                                
                                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
                                    {product.description || 'Fresh, high-quality produce directly from the farm. Grown with care and harvested at peak freshness.'}
                                </p>

                                {/* Price and Quantity */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price per kg</label>
                                        <div className="text-3xl font-black text-primary-600">
                                            ${product.price}
                                            <span className="text-lg text-gray-500 dark:text-gray-400">/kg</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity (kg)</label>
                                        <div className="flex items-center space-x-3">
                                            <button 
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                -
                                            </button>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max={product.quantity}
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-20 h-10 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            />
                                            <button 
                                                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                                                className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Available: {product.quantity} kg
                                        </p>
                                    </div>
                                </div>

                                {/* Total Price */}
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Total Price:</span>
                                        <span className="text-2xl font-black text-primary-600">
                                            ${(product.price * quantity).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        disabled={product.quantity <= 0}
                                        onClick={handleAddToCart}
                                        className={`py-4 px-6 rounded-xl font-bold transition-all duration-200 ${
                                            product.quantity > 0
                                                ? 'bg-primary-600 text-white hover:bg-primary-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        🛒 Add to Cart
                                    </button>
                                    <button
                                        onClick={handleContactFarmer}
                                        className="py-4 px-6 rounded-xl font-bold bg-gray-800 text-white hover:bg-gray-900 transition-colors"
                                    >
                                        📞 Contact Farmer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Farmer Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">👨‍🌾 Farmer Information</h3>
                            <div className="flex items-center space-x-4 mb-4">
                                {product.farmer_photo ? (
                                    <img 
                                        src={`http://localhost:4000/${product.farmer_photo}`} 
                                        alt={product.farmer_name}
                                        className="w-16 h-16 rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        <span className="text-2xl">👨‍🌾</span>
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{product.farmer_name || 'Local Farmer'}</h4>
                                    <div className="flex items-center mt-1">
                                        <span className="text-yellow-500">⭐</span>
                                        <span className="text-gray-600 dark:text-gray-400 ml-1">4.8 rating</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <span className="mr-2">📍</span>
                                    <span>{product.location || 'Kigali, Rwanda'}</span>
                                </div>
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <span className="mr-2">📞</span>
                                    <span>{product.phone || '+250 788 123 456'}</span>
                                </div>
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <span className="mr-2">📧</span>
                                    <span>{product.email || 'farmer@farmerjoin.rw'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📍 Location</h3>
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🗺️</div>
                                    <p className="text-gray-600 dark:text-gray-400">{product.location || 'Kigali, Rwanda'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500">View on map</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Options */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📞 Contact Options</h3>
                            <div className="space-y-3">
                                <button className="w-full py-3 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-semibold">
                                    💬 Send Message
                                </button>
                                <button className="w-full py-3 px-4 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors font-semibold">
                                    📞 Call Farmer
                                </button>
                                <button className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold">
                                    📧 Send Email
                                </button>
                            </div>
                        </div>

                        {/* Similar Products */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🌾 Similar Products</h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">🍅</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">Fresh Tomatoes</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">$2.50/kg</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">🥬</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">Fresh Cabbage</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">$1.80/kg</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">🥕</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">Fresh Onions</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">$2.20/kg</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Stats */}
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
            </div>
        </div>
    );
}

export default ProductDetail;
