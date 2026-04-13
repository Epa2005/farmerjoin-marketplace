import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api';
import { useTranslation } from '../hooks/useTranslation';

const EditProduct = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    price: '',
    unit: '',
    category: '',
    stock_quantity: '',
    product_tags: []
  });

  const [productImage, setProductImage] = useState(null);
  const [currentImage, setCurrentImage] = useState('');

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const fetchProductData = async () => {
    try {
      const response = await API.get(`/products/${productId}`);
      const product = response.data;
      
      setFormData({
        product_name: product.product_name || '',
        description: product.description || '',
        price: product.price || '',
        unit: product.unit || '',
        category: product.category || '',
        stock_quantity: product.stock_quantity || '',
        product_tags: product.product_tags || []
      });
      
      setCurrentImage(product.image || '');
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await API.post('/products/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setCurrentImage(response.data.url);
      setProductImage(response.data.url);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        image: productImage || currentImage
      };

      await API.put(`/products/${productId}`, productData);
      alert('Product updated successfully!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      product_tags: prev.product_tags.includes(tag)
        ? prev.product_tags.filter(t => t !== tag)
        : [...prev.product_tags, tag]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-green-600 rounded-full"></div>
      </div>
    );
  }

  const availableTags = ['Organic', 'Non-GMO', 'Premium', 'Seasonal', 'Gluten-Free', 'Natural'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Product</h1>
            <p className="text-gray-600">Update your product information</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Product Image</label>
              <div className="flex items-center space-x-6">
                <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden">
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="product-image-upload"
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Change Image'}
                  </label>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter product name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select category</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="dairy">Dairy</option>
                  <option value="meat">Meat</option>
                  <option value="grains">Grains</option>
                  <option value="herbs">Herbs</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., kg, lb, bunch, piece"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Describe your product, growing methods, taste, etc..."
              />
            </div>

            {/* Product Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.product_tags.includes(tag)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="border border-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Update Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
