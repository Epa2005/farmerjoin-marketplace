import { useState, useRef, useEffect } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

function AddProduct() {
    const navigate = useNavigate();
    const { t, language, changeLanguage } = useTranslation();
    const fileInputRef = useRef(null);
    
    const [product, setProduct] = useState({
        product_name: "",
        category: "grains",
        price: "",
        quantity: ""
    });
    
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [farmerStock, setFarmerStock] = useState([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showStockDetails, setShowStockDetails] = useState(false);
    const [addedProduct, setAddedProduct] = useState(null);

    const categories = [
        { name: t('vegetables'), value: "vegetables" },
        { name: t('fruits'), value: "fruits" },
        { name: t('grains'), value: "grains" },
        { name: t('livestock'), value: "livestock" },
        { name: t('tools'), value: "tools" }
    ];

    // Fetch farmer's current stock
    useEffect(() => {
        const fetchFarmerStock = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            try {
                const response = await API.get('/farmer/products', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Stock data from API:', response.data);
                console.log('First item structure:', response.data?.[0]);
                setFarmerStock(response.data || []);
            } catch (err) {
                console.error('Error fetching farmer stock:', err);
                console.error('Error response:', err?.response);
            }
        };
        
        fetchFarmerStock();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleContinueAdding = () => {
        setShowConfirmDialog(false);
        // Reset form for new product
        setProduct({
            product_name: "",
            category: "grains",
            price: "",
            quantity: ""
        });
        setImage(null);
        setSuccess(false);
        setError("");
        setAddedProduct(null);
    };

    const handleReturnToDashboard = () => {
        setShowConfirmDialog(false);
        navigate('/farmer-dashboard');
    };

    const handleViewStockDetails = () => {
        setShowConfirmDialog(false);
        setShowStockDetails(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false); // Clear previous success message

        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login first to add products');
            setLoading(false);
            return;
        }

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('product_name', product.product_name.trim());
            formData.append('category', (product.category || 'grains').toLowerCase());
            formData.append('price', String(Number(product.price)));
            formData.append('quantity', String(parseInt(product.quantity, 10)));
            
            // Don't send price_per_quantity - backend might not support it
            // if (product.price_per_quantity) {
            //     formData.append('price_per_quantity', product.price_per_quantity);
            // }
            
            if (image) {
                formData.append('image', image);
            }

            console.log('Submitting product data:', {
                product_name: product.product_name,
                category: product.category,
                price: product.price,
                quantity: product.quantity,
                hasImage: !!image
            });

            const response = await API.post("/farmer/products", formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Product added successfully:', response.data);
            const createdProduct = response?.data?.product || response?.data;
            setSuccess(true);
            setLoading(false);
            setAddedProduct(createdProduct);
            
            // Update stock display immediately with the newly added product
            if (createdProduct) {
                console.log('Adding product to stock display:', createdProduct);
                console.log('Current stock before update:', farmerStock);
                setFarmerStock(prev => {
                    console.log('Updating stock with new product:', createdProduct);
                    const newStock = [createdProduct, ...prev];
                    console.log('New stock after update:', newStock);
                    return newStock;
                });
            }
            
            // Show confirmation dialog after 1 second
            setTimeout(() => {
                setShowConfirmDialog(true);
            }, 1000);

        } catch (err) {
            console.error('Error adding product:', err);
            console.error('Error response:', err?.response);
            console.error('Error data:', err?.response?.data);
            const backendMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.response?.data?.details;
            setError(backendMessage || err?.message || "Failed to add product");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Farmer Stock Display */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span>warehouse</span>
                                Your Current Stock
                            </h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {farmerStock && farmerStock.length > 0 ? (
                                    farmerStock.map((item, index) => {
                                        console.log(`Rendering stock item ${index}:`, item);
                                        return (
                                            <div key={item.product_id || Math.random()} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                            {item.product_name || item.name || 'Unnamed Product'}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {item.category || 'Uncategorized'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                                            {item.quantity || item.stock || 0} {item.quantity ? 'kg' : ''}
                                                        </p>
                                                        <p className="text-xs text-gray-500">units</p>
                                                    </div>
                                                </div>
                                                {item.price && (
                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                                        <span className="text-xs text-gray-500">Total Price:</span>
                                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                            {item.price} RWF
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Product Image in Stock */}
                                                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                    {item.image_url || item.image ? (
                                                        <img
                                                            src={`http://localhost:5000/${item.image_url || item.image}`}
                                                            alt={item.product_name || item.name || 'Product'}
                                                            className="w-16 h-16 object-cover rounded-lg mx-auto"
                                                            onError={(e) => {
                                                                console.error('Image load error:', e);
                                                                console.log('Failed image URL:', `http://localhost:5000/${item.image_url || item.image}`);
                                                                console.log('Product data:', item);
                                                                e.target.style.display = 'none';
                                                            }}
                                                            onLoad={() => {
                                                                console.log('Image loaded successfully for:', item.product_name);
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                                                            <span className="text-2xl text-gray-400">🌾</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8">
                                        <span className="text-4xl mb-2 block">warehouse</span>
                                        <p className="text-gray-500 dark:text-gray-400">No products in stock</p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500">Add your first product to get started</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Add Product Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-2xl p-8 border border-emerald-100 dark:border-emerald-900">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                        {t('addProduct', 'Add New Product')}
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {t('fillProductDetails', 'Fill in the details below to add a product to your inventory')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Language Selector */}
                                    <div className="relative">
                                        <select
                                            value={language}
                                            onChange={(e) => changeLanguage(e.target.value)}
                                            className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                        >
                                            <option value="en">🇬🇧 EN</option>
                                            <option value="rw">🇷 RW</option>
                                            <option value="fr">🇫🇷 FR</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <Link
                                        to="/farmer-dashboard"
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-105"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        {t('backToDashboard', 'Back to Dashboard')}
                                    </Link>
                                </div>
                            </div>

                            {success && (
                                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-pulse">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">check-circle</span>
                                        <span className="font-semibold">Product added successfully! You can view it in your stock display.</span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">alert-circle</span>
                                        <span className="font-semibold">{error}</span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Product Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Product Name *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="product_name"
                                            value={product.product_name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                                            placeholder="Enter product name"
                                        />
                                        <span className="absolute right-3 top-3 text-gray-400">package</span>
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="category"
                                            value={product.category}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-all duration-300 appearance-none"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.value} value={cat.value}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="absolute right-3 top-3 text-gray-400">chevron-down</span>
                                    </div>
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Price (RWF) *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="price"
                                            value={product.price}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                                            placeholder="Enter price"
                                        />
                                        <span className="absolute right-3 top-3 text-gray-400">frw</span>
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Quantity (kg) *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={product.quantity}
                                            onChange={handleInputChange}
                                            required
                                            min="1"
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                                            placeholder="Enter quantity"
                                        />
                                        <span className="absolute right-3 top-3 text-gray-400">scale</span>
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Product Image (Optional)
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300">
                                        <div className="flex items-center justify-center">
                                            <div className="text-center">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                    className="hidden"
                                                    id="image-upload"
                                                />
                                                <label
                                                    htmlFor="image-upload"
                                                    className="cursor-pointer flex flex-col items-center"
                                                >
                                                    <span className="text-4xl text-gray-400 mb-2">upload</span>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {image ? image.name : 'Click to upload product image'}
                                                    </p>
                                                </label>
                                            </div>
                                        </div>
                                        {image && (
                                            <div className="mt-4 flex justify-center">
                                                <div className="relative group">
                                                    <img
                                                        src={URL.createObjectURL(image)}
                                                        alt="Preview"
                                                        className="h-32 w-32 object-cover rounded-lg border-2 border-emerald-200 group-hover:border-emerald-400 transition-all duration-300 shadow-lg"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-300 flex items-center justify-center">
                                                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl">
                                                            eye
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end space-x-4 pt-4">
                                    <Link
                                        to="/dashboard"
                                        className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 font-medium"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="animate-spin">loader</span>
                                                Adding Product...
                                            </>
                                        ) : (
                                            <>
                                                <span>Add Product</span>
                                                
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && addedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl text-emerald-600 dark:text-emerald-400">check-circle</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Product Added Successfully!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                <span className="font-semibold">{addedProduct.product_name}</span> has been added to your inventory.
                            </p>
                            
                            {/* Product Details */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Product Name</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{addedProduct.product_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{addedProduct.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Quantity</p>
                                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">{addedProduct.quantity} units</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{addedProduct.price} RWF</p>
                                    </div>
                                    {addedProduct.price_per_quantity && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Price per Quantity</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{addedProduct.price_per_quantity} RWF/kg</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Product Preview */}
                                {addedProduct.image_url && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Product Image</p>
                                        <img
                                            src={`http://localhost:5000/${addedProduct.image_url}`}
                                            alt={addedProduct.product_name}
                                            className="w-24 h-24 object-cover rounded-lg mx-auto border-2 border-emerald-200"
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={handleContinueAdding}
                                    className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>plus</span>
                                    Continue Adding Products
                                </button>
                                
                            </div>
                        </div>
                    </div>
                </div>
            )}

           
        </div>
    );
}

export default AddProduct;
