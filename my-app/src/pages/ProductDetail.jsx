import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import API from "../api";
import { useTranslation } from "../hooks/useTranslation";
import { useCart } from "../context/CartContext";

function ProductDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showFullImage, setShowFullImage] = useState(false);

    useEffect(() => {
        // Fetch product details
        setLoading(true);
        API.get(`/products/${productId}`)
            .then(res => {
                setProduct(res.data);
                // Use selected image from navigation state if available, otherwise use product image
                setSelectedImage(location.state?.selectedImage || res.data.image);
                // Fetch related products from the same farmer
                if (res.data.farmer_id) {
                    fetchRelatedProducts(res.data.farmer_id, productId);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching product:", err);
                setError(err?.response?.data?.message || 'Failed to load product details');
                setLoading(false);
            });
    }, [productId, location.state]);

    const fetchRelatedProducts = async (farmerId, currentProductId) => {
        try {
            const response = await API.get(`/products?farmer_id=${farmerId}`);
            // Filter out the current product and limit to 4 products
            const filtered = response.data
                .filter(p => p.product_id !== parseInt(currentProductId))
                .slice(0, 4);
            setRelatedProducts(filtered);
        } catch (error) {
            console.error('Error fetching related products:', error);
        }
    };

    const handleAddToCart = async () => {
        if (!product || product.quantity <= 0) return;

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to add items to cart');
            navigate('/login');
            return;
        }

        setAddingToCart(true);
        try {
            await addToCart(product, quantity);
            alert(`${t('addedToCart') || 'Added'} ${quantity} ${product.product_name} ${t('toCart') || 'to cart'}!`);
        } catch (error) {
            alert(error.message || t('addToCartError') || 'Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleContactFarmer = () => {
        // Contact functionality would go here
        alert(`Contact ${product.farmer_name} about ${product.product_name}`);
    };

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-emerald-50 to-teal-50 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="animate-spin h-20 w-20 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-6"></div>
                    <p className="text-gray-700 font-semibold text-lg">{t('loadingProductDetails') || 'Loading Product Details...'}</p>
                    <p className="text-gray-600 text-sm mt-2">{t('connectingLocalFarmers') || 'Connecting you with local farmers'}</p>
                </div>
            </div>
        );
    }

    // Error screen
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-emerald-50 to-teal-50 flex items-center justify-center">
                <div className="text-center glass p-8 rounded-3xl max-w-md animate-fade-in">
                    <div className="text-error-500 text-6xl mb-4">grass</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('oopsSomethingWrong') || 'Oops! Something went wrong'}</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="btn-primary"
                    >
                        {t('tryAgain') || 'Try Again'}
                    </button>
                </div>
            </div>
        );
    }

    if (!product) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
            {/* Modern Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                                <span className="text-4xl">??</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-100">
                            {t('productDetails') || 'Product Details'}
                        </h1>
                        <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                            {t('premiumQualityLocal') || 'Premium quality from local farmers'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <nav className="flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 text-sm">
                        <li><Link to="/" className="text-emerald-600 hover:text-emerald-800 font-medium">{t('home') || 'Home'}</Link></li>
                        <li><span className="text-gray-400">/</span></li>
                        <li><Link to="/products" className="text-emerald-600 hover:text-emerald-800 font-medium">{t('products') || 'Products'}</Link></li>
                        <li><span className="text-gray-400">/</span></li>
                        <li className="text-gray-600 font-medium">{product.product_name}</li>
                    </ol>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Product Images */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Product Images Gallery */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            {/* Main Image */}
                            <div className="relative group">
                                <div 
                                    className="w-full aspect-square overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-700"
                                    onClick={() => setShowFullImage(true)}
                                >
                                    {selectedImage ? (
                                        <img 
                                            src={selectedImage.startsWith('http') ? selectedImage : `http://localhost:5000/${selectedImage}`}
                                            alt={product.product_name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onLoad={(e) => {
                                                console.log('Main image loaded successfully:', product.product_name);
                                            }}
                                            onError={(e) => {
                                                console.error('Main image load error:', selectedImage);
                                                // Try alternative URL patterns
                                                const alternatives = [
                                                    `http://localhost:5000/uploads/products/${selectedImage.split('/').pop()}`,
                                                    `http://localhost:5000/uploads/${selectedImage}`,
                                                    selectedImage
                                                ];
                                                let tried = 0;
                                                const tryNext = () => {
                                                    if (tried < alternatives.length) {
                                                        e.target.src = alternatives[tried];
                                                        tried++;
                                                    } else {
                                                        // Show fallback
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/20 dark:to-cyan-900/20 flex items-center justify-center"><span class="text-6xl">🌾</span></div>';
                                                    }
                                                };
                                                tryNext();
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/20 dark:to-cyan-900/20 flex items-center justify-center">
                                            <span className="text-6xl">🌾</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                    🔍 Zoom
                                </div>
                            </div>

                            {/* Thumbnail Gallery */}
                            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex gap-2 overflow-x-auto">
                                    {product.image && (
                                        <div
                                            onClick={() => setSelectedImage(product.image)}
                                            className={`flex-shrink-0 w-16 h-16 rounded cursor-pointer border-2 transition-all bg-gray-100 dark:bg-gray-700 ${
                                                selectedImage === product.image
                                                    ? 'border-emerald-500 shadow-md'
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-emerald-300'
                                            }`}
                                        >
                                            <img
                                                src={product.image.startsWith('http') ? product.image : `http://localhost:5000/${product.image}`}
                                                alt="Main"
                                                className="w-full h-full object-cover rounded"
                                                onLoad={() => console.log('Thumbnail loaded:', product.product_name)}
                                                onError={(e) => {
                                                    const alternatives = [
                                                        `http://localhost:5000/uploads/products/${product.image.split('/').pop()}`,
                                                        `http://localhost:5000/uploads/${product.image}`,
                                                        product.image
                                                    ];
                                                    let tried = 0;
                                                    const tryNext = () => {
                                                        if (tried < alternatives.length) {
                                                            e.target.src = alternatives[tried];
                                                            tried++;
                                                        } else {
                                                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-xl">🌾</span></div>';
                                                        }
                                                    };
                                                    tryNext();
                                                }}
                                            />
                                        </div>
                                    )}
                                    {relatedProducts.slice(0, 4).map((relatedProduct) => (
                                        relatedProduct.image && (
                                            <div
                                                key={relatedProduct.product_id}
                                                onClick={() => setSelectedImage(relatedProduct.image)}
                                                className={`flex-shrink-0 w-16 h-16 rounded cursor-pointer border-2 transition-all bg-gray-100 dark:bg-gray-700 ${
                                                    selectedImage === relatedProduct.image
                                                        ? 'border-emerald-500 shadow-md'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-emerald-300'
                                                }`}
                                            >
                                                <img
                                                    src={relatedProduct.image.startsWith('http') ? relatedProduct.image : `http://localhost:5000/${relatedProduct.image}`}
                                                    alt={relatedProduct.product_name}
                                                    className="w-full h-full object-cover rounded"
                                                    onError={(e) => {
                                                        const alternatives = [
                                                            `http://localhost:5000/uploads/products/${relatedProduct.image.split('/').pop()}`,
                                                            `http://localhost:5000/uploads/${relatedProduct.image}`,
                                                            relatedProduct.image
                                                        ];
                                                        let tried = 0;
                                                        const tryNext = () => {
                                                            if (tried < alternatives.length) {
                                                                e.target.src = alternatives[tried];
                                                                tried++;
                                                            } else {
                                                                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-xl">🌾</span></div>';
                                                            }
                                                        };
                                                        tryNext();
                                                    }}
                                                />
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Full Image Modal */}
                        {showFullImage && selectedImage && (
                            <div
                                className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                                onClick={() => setShowFullImage(false)}
                            >
                                <img
                                    src={selectedImage.startsWith('http') ? selectedImage : `http://localhost:5000/${selectedImage}`}
                                    alt={product.product_name}
                                    className="max-w-full max-h-full object-contain"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={() => setShowFullImage(false)}
                                    className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Product Details */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Product Title */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{product.product_name}</h1>
                                    <div className="flex items-center space-x-3">
                                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-1 rounded-full font-semibold">
                                            {product.category}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400 text-sm">|</span>
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <span className="text-yellow-500 mr-1">⭐</span>
                                            <span>4.5 (23 reviews)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    product.quantity > 0 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                    {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of Stock'}
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                                {product.description || 'Fresh, high-quality produce directly from the farm. Grown with care and harvested at peak freshness.'}
                            </p>

                            {/* Price Section */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 mb-4">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                        RWF {parseFloat(product.price || 0).toLocaleString()}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">per unit</span>
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity:</span>
                                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                                    <button 
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-300 dark:border-gray-600"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max={product.quantity}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-16 h-10 text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-none focus:outline-none"
                                    />
                                    <button 
                                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                                        className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-l border-gray-300 dark:border-gray-600"
                                    >
                                        +
                                    </button>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Available: {product.quantity}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    disabled={product.quantity <= 0 || addingToCart}
                                    onClick={handleAddToCart}
                                    className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                                        product.quantity > 0 && !addingToCart
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                                </button>
                                <Link
                                    to="/cart"
                                    className="py-3 px-6 rounded-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 text-center transition-colors shadow-lg"
                                >
                                    View Cart
                                </Link>
                            </div>
                        </div>

                        {/* Supplier Information */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <span className="text-xl mr-2">👨‍🌾</span>
                                Supplier Information
                            </h3>
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                    {product.farmer_name ? product.farmer_name.charAt(0).toUpperCase() : 'F'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        {product.farmer_name || 'Local Farmer'}
                                    </h4>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        {product.farmer_email && (
                                            <div className="flex items-center">
                                                <span className="mr-2">📧</span>
                                                <span>{product.farmer_email}</span>
                                            </div>
                                        )}
                                        {product.farmer_phone && (
                                            <div className="flex items-center">
                                                <span className="mr-2">📞</span>
                                                <span>{product.farmer_phone}</span>
                                            </div>
                                        )}
                                        {product.farm_location && (
                                            <div className="flex items-center">
                                                <span className="mr-2">📍</span>
                                                <span>{product.farm_location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Related Products from Same Farmer */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                More from {product.farmer_name || 'This Farmer'}
                            </h3>
                            {relatedProducts.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {relatedProducts.map((relatedProduct) => (
                                        <Link
                                            key={relatedProduct.product_id}
                                            to={`/products/${relatedProduct.product_id}`}
                                            className="group"
                                        >
                                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                                {relatedProduct.image ? (
                                                    <img
                                                        src={relatedProduct.image.startsWith('http') ? relatedProduct.image : `http://localhost:5000/${relatedProduct.image}`}
                                                        alt={relatedProduct.product_name}
                                                        className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<div class="w-full h-24 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><span class="text-2xl">🌾</span></div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                        <span className="text-2xl">🌾</span>
                                                    </div>
                                                )}
                                                <div className="p-3">
                                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{relatedProduct.product_name}</h4>
                                                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">RWF {relatedProduct.price}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No other products from this farmer</p>
                            )}
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
        </div>
    );
}

export default ProductDetail;
