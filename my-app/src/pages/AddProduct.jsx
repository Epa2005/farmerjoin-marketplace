import { useState, useRef, useEffect } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";

function AddProduct() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    const [product, setProduct] = useState({
        product_name: "",
        category: "",
        subcategory: "",
        description: "",
        tags: [],
        regular_price: "",
        discount_price: "",
        price_per: "kg",
        bulk_pricing: [],
        stock: "",
        stock_alert: "",
        harvest_date: "",
        expiry_date: "",
        province: "",
        district: "",
        delivery_option: "pickup",
        delivery_fee: "",
        delivery_time: "",
        min_order_quantity: "",
        status: "draft"
    });
    
    const [images, setImages] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [suggestedCategory, setSuggestedCategory] = useState("");
    const [showBulkPricing, setShowBulkPricing] = useState(false);

    const categories = [
        { name: "Vegetables", subcategories: ["Tomatoes", "Carrots", "Cabbage", "Onions", "Peppers", "Leafy Greens"] },
        { name: "Fruits", subcategories: ["Bananas", "Mangoes", "Pineapples", "Papayas", "Avocados", "Apples"] },
        { name: "Grains", subcategories: ["Rice", "Maize", "Beans", "Wheat", "Sorghum", "Millet"] },
        { name: "Livestock", subcategories: ["Cattle", "Goats", "Sheep", "Poultry", "Pigs", "Rabbits"] },
        { name: "Tools", subcategories: ["Hand Tools", "Machinery", "Irrigation", "Fencing", "Storage"] }
    ];

    const rwandaProvinces = [
        "Kigali", "Northern", "Southern", "Eastern", "Western"
    ];

    const availableTags = ["organic", "fresh", "local", "premium", "seasonal", "farm-fresh", "natural", "sustainable"];

    // Auto category suggestion
    useEffect(() => {
        if (product.product_name.length > 2) {
            const name = product.product_name.toLowerCase();
            if (name.includes('tomato') || name.includes('carrot') || name.includes('cabbage')) {
                setSuggestedCategory("Vegetables");
            } else if (name.includes('banana') || name.includes('mango') || name.includes('apple')) {
                setSuggestedCategory("Fruits");
            } else if (name.includes('rice') || name.includes('maize') || name.includes('bean')) {
                setSuggestedCategory("Grains");
            } else {
                setSuggestedCategory("");
            }
        }
    }, [product.product_name]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFiles = (files) => {
        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
            return isValidType && isValidSize;
        });

        if (validFiles.length !== files.length) {
            setError("Some files were invalid. Please only upload JPG/PNG images under 5MB.");
        }

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, { file, preview: reader.result, id: Date.now() + Math.random() }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const addBulkPricingTier = () => {
        setProduct(prev => ({
            ...prev,
            bulk_pricing: [...prev.bulk_pricing, { min_quantity: "", max_quantity: "", price: "" }]
        }));
    };

    const updateBulkPricing = (index, field, value) => {
        setProduct(prev => ({
            ...prev,
            bulk_pricing: prev.bulk_pricing.map((tier, i) => 
                i === index ? { ...tier, [field]: value } : tier
            )
        }));
    };

    const removeBulkPricing = (index) => {
        setProduct(prev => ({
            ...prev,
            bulk_pricing: prev.bulk_pricing.filter((_, i) => i !== index)
        }));
    };

    const toggleTag = (tag) => {
        setProduct(prev => ({
            ...prev,
            tags: prev.tags.includes(tag) 
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const calculateTotalPrice = () => {
        const quantity = parseInt(product.min_order_quantity) || 1;
        const price = parseFloat(product.discount_price || product.regular_price) || 0;
        return (quantity * price).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const formData = new FormData();
            
            // Basic product info - match backend expectations
            formData.append('product_name', product.product_name);
            formData.append('category', product.category);
            formData.append('price', product.regular_price); // Use regular_price as main price
            formData.append('quantity', product.stock || product.min_order_quantity || 1);
            
            // Add first image if available
            if (images.length > 0) {
                formData.append('image', images[0].file);
            }

            const response = await API.post("/products/add", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/products'); // Navigate to products page to see the new product
            }, 2000);

        } catch (err) {
            console.error('Error adding product:', err);
            setError(err?.response?.data?.message || "Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">🌾 Add New Product</h1>
                    <p className="text-gray-600">List your agricultural products for buyers to discover</p>
                </div>

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
                        ✅ Product added successfully! Redirecting to dashboard...
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 1️⃣ Product Image Upload */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">📸 Product Images</h2>
                        
                        <div className="mb-4">
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                    dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-gray-400'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className="space-y-4">
                                    <div className="text-4xl">📤</div>
                                    <div>
                                        <p className="text-lg font-medium text-gray-900">Drag & Drop your images here</p>
                                        <p className="text-sm text-gray-500">or click to browse</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        Choose Files
                                    </button>
                                    <p className="text-xs text-gray-500">JPG, PNG, WebP • Max 5MB per image • Multiple images allowed</p>
                                </div>
                            </div>
                        </div>

                        {/* Image Preview */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={image.preview}
                                            alt="Product preview"
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(image.id)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2️⃣ Product Information */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Product Information</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={product.product_name}
                                    onChange={(e) => setProduct({...product, product_name: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., Fresh Tomatoes"
                                />
                                {suggestedCategory && (
                                    <p className="text-sm text-emerald-600 mt-1">💡 Suggested category: {suggestedCategory}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <select
                                    required
                                    value={product.category}
                                    onChange={(e) => setProduct({...product, category: e.target.value, subcategory: ""})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {product.category && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                                    <select
                                        value={product.subcategory}
                                        onChange={(e) => setProduct({...product, subcategory: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Select Subcategory</option>
                                        {categories.find(cat => cat.name === product.category)?.subcategories.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    rows={4}
                                    value={product.description}
                                    onChange={(e) => setProduct({...product, description: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Describe your product quality, growing methods, taste, etc."
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                            product.tags.includes(tag)
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3️⃣ Advanced Pricing System */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Pricing Information</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Regular Price (RWF) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={product.regular_price}
                                    onChange={(e) => setProduct({...product, regular_price: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Price (RWF)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={product.discount_price}
                                    onChange={(e) => setProduct({...product, discount_price: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="450"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price Per</label>
                                <select
                                    value={product.price_per}
                                    onChange={(e) => setProduct({...product, price_per: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="kg">Kilogram (kg)</option>
                                    <option value="ton">Ton</option>
                                    <option value="piece">Piece</option>
                                    <option value="basket">Basket</option>
                                    <option value="bag">Bag</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={product.min_order_quantity}
                                    onChange={(e) => setProduct({...product, min_order_quantity: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="1"
                                />
                                {product.min_order_quantity && product.regular_price && (
                                    <p className="text-sm text-emerald-600 mt-1">
                                        💰 Total: {calculateTotalPrice()} RWF
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Bulk Pricing */}
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Bulk Pricing Tiers</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowBulkPricing(!showBulkPricing)}
                                    className="text-emerald-600 hover:text-emerald-700 text-sm"
                                >
                                    {showBulkPricing ? 'Hide' : 'Show'} Bulk Pricing
                                </button>
                            </div>

                            {showBulkPricing && (
                                <div className="space-y-3">
                                    {product.bulk_pricing.map((tier, index) => (
                                        <div key={index} className="flex gap-3 items-center">
                                            <input
                                                type="number"
                                                placeholder="Min qty"
                                                value={tier.min_quantity}
                                                onChange={(e) => updateBulkPricing(index, 'min_quantity', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Max qty"
                                                value={tier.max_quantity}
                                                onChange={(e) => updateBulkPricing(index, 'max_quantity', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={tier.price}
                                                onChange={(e) => updateBulkPricing(index, 'price', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeBulkPricing(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addBulkPricingTier}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        ➕ Add Pricing Tier
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4️⃣ Inventory Management */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">📦 Inventory Management</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Available Stock *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={product.stock}
                                    onChange={(e) => setProduct({...product, stock: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Alert Level</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={product.stock_alert}
                                    onChange={(e) => setProduct({...product, stock_alert: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="10"
                                />
                                <p className="text-xs text-gray-500 mt-1">Get notified when stock reaches this level</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Harvest Date</label>
                                <input
                                    type="date"
                                    value={product.harvest_date}
                                    onChange={(e) => setProduct({...product, harvest_date: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date (if applicable)</label>
                                <input
                                    type="date"
                                    value={product.expiry_date}
                                    onChange={(e) => setProduct({...product, expiry_date: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5️⃣ Location & Delivery */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">🚚 Location & Delivery</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                                <select
                                    required
                                    value={product.province}
                                    onChange={(e) => setProduct({...product, province: e.target.value, district: ""})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select Province</option>
                                    {rwandaProvinces.map(province => (
                                        <option key={province} value={province}>{province}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                                <input
                                    type="text"
                                    value={product.district}
                                    onChange={(e) => setProduct({...product, district: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., Gasabo, Nyagatare"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Option</label>
                                <select
                                    value={product.delivery_option}
                                    onChange={(e) => setProduct({...product, delivery_option: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="pickup">Pickup Only</option>
                                    <option value="delivery">Delivery Available</option>
                                    <option value="both">Both Pickup & Delivery</option>
                                </select>
                            </div>

                            {(product.delivery_option === 'delivery' || product.delivery_option === 'both') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee (RWF)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={product.delivery_fee}
                                            onChange={(e) => setProduct({...product, delivery_fee: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="1000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Time</label>
                                        <input
                                            type="text"
                                            value={product.delivery_time}
                                            onChange={(e) => setProduct({...product, delivery_time: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="e.g., 2-3 business days"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 6️⃣ Product Status */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">⭐ Product Status</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="status"
                                    value="draft"
                                    checked={product.status === 'draft'}
                                    onChange={(e) => setProduct({...product, status: e.target.value})}
                                    className="text-emerald-600"
                                />
                                <div>
                                    <p className="font-medium">📝 Draft</p>
                                    <p className="text-sm text-gray-500">Save and finish later</p>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="status"
                                    value="pending"
                                    checked={product.status === 'pending'}
                                    onChange={(e) => setProduct({...product, status: e.target.value})}
                                    className="text-emerald-600"
                                />
                                <div>
                                    <p className="font-medium">⏳ Pending Approval</p>
                                    <p className="text-sm text-gray-500">Submit for admin review</p>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="status"
                                    value="published"
                                    checked={product.status === 'published'}
                                    onChange={(e) => setProduct({...product, status: e.target.value})}
                                    className="text-emerald-600"
                                />
                                <div>
                                    <p className="font-medium">🚀 Published</p>
                                    <p className="text-sm text-gray-500">Make live immediately</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-between items-center">
                        <Link
                            to="/dashboard"
                            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            ❌ Cancel
                        </Link>
                        
                        <div className="space-x-4">
                            <button
                                type="button"
                                onClick={() => setProduct({...product, status: 'draft'})}
                                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                💾 Save Draft
                            </button>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? '⏳ Adding Product...' : '🚀 Add Product'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddProduct;
