import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api';
import { useCart } from '../context/CartContext';
import { useNewTranslation } from '../hooks/useNewTranslation';

const FarmerProfile = () => {
  const { t } = useNewTranslation();
  const { farmerId } = useParams();
  const { addToCart } = useCart();
  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [reviews, setReviews] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchFarmerData();
  }, [farmerId]);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      
      // Fetch farmer details with products
      const farmerRes = await API.get(`/farmers/${farmerId}`);
      const farmerData = farmerRes.data;
      
      setFarmer(farmerData);
      
      // Check if this is the user's own profile (you'd need to implement proper auth)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      setIsOwnProfile(currentUser.user_id === farmerData.user_id);
      
      // Extract products from the response
      setProducts(farmerData.products || []);
      
      // Fetch farmer reviews (this endpoint might need to be created)
      try {
        const reviewsRes = await API.get(`/reviews?farmer_id=${farmerId}`);
        setReviews(reviewsRes.data || []);
      } catch (reviewErr) {
        console.log('Reviews endpoint not available, using empty array');
        setReviews([]);
      }
      
    } catch (error) {
      console.error('Error fetching farmer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const cartProduct = {
      id: product.product_id,
      name: product.product_name,
      price: parseFloat(product.price),
      image: product.image,
      farmerName: farmer.full_name,
      quantity: 1 // Default quantity
    };
    
    addToCart(cartProduct);
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getSeasonalProducts = () => {
    const currentMonth = new Date().getMonth() + 1;
    const seasonalProducts = {
      1: ['winter vegetables', 'root vegetables', 'citrus'], // January
      2: ['winter vegetables', 'root vegetables', 'citrus'], // February
      3: ['spring vegetables', 'leafy greens', 'early herbs'], // March
      4: ['spring vegetables', 'leafy greens', 'radishes'], // April
      5: ['spring vegetables', 'berries', 'early summer'], // May
      6: ['summer vegetables', 'berries', 'stone fruits'], // June
      7: ['summer vegetables', 'tomatoes', 'peppers'], // July
      8: ['summer vegetables', 'tomatoes', 'corn'], // August
      9: ['fall vegetables', 'apples', 'grapes'], // September
      10: ['fall vegetables', 'pumpkins', 'squash'], // October
      11: ['fall vegetables', 'root vegetables', 'late harvest'], // November
      12: ['winter vegetables', 'root vegetables', 'citrus'] // December
    };
    
    return seasonalProducts[currentMonth] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="animate-spin h-12 w-12 border-b-2 border-green-600 rounded-full"></div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t('farmerNotFound') || 'Farmer Not Found'}</h2>
            <Link
              to="/products"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {t('browseProducts') || 'Browse Products'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Farmer Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            
            {/* Farmer Photo */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden">
                {farmer.profile_photo ? (
                  <img
                    src={farmer.profile_photo}
                    alt={farmer.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Farmer Info */}
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{farmer.full_name}</h1>
              <p className="text-lg text-gray-600 mb-4">{farmer.farm_name}</p>
              
              {/* Rating */}
              <div className="flex items-center justify-center md:justify-start mb-4">
                <div className="flex items-center">
                  <span className="text-yellow-500">
                    {'★'.repeat(Math.floor(calculateAverageRating()))}
                    {'☆'.repeat(5 - Math.floor(calculateAverageRating()))}
                  </span>
                  <span className="ml-2 text-gray-600">
                    {calculateAverageRating()} ({reviews.length} reviews)
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                {farmer.certifications?.map(cert => (
                  <span key={cert} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {cert}
                  </span>
                ))}
                {farmer.is_organic && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {t('organicCertified') || 'Organic Certified'}
                  </span>
                )}
                {farmer.years_farming && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {farmer.years_farming}+ {t('yearsExperience') || 'Years Experience'}
                  </span>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center justify-center md:justify-start text-gray-600 mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {farmer.location || t('locationNotSpecified') || 'Location not specified'}
              </div>

              {/* Bio */}
              <p className="text-gray-700 leading-relaxed">
                {farmer.bio || t('passionateFarmerBio') || 'Passionate farmer committed to providing fresh, high-quality produce to the local community.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              {isOwnProfile ? (
                <Link
                  to={`/edit-profile/${farmerId}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors text-center"
                >
                  Edit Profile
                </Link>
              ) : (
                <>
                  <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                    Contact Farmer
                  </button>
                  <button className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors">
                    Follow Farm
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Seasonal Calendar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🌱 What's in Season Now</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {getSeasonalProducts().map((item, index) => (
              <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <span className="text-green-800 font-medium text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Products ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'about'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                About Farm
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
                    <p className="text-gray-500">This farmer hasn't listed any products yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                      <div key={product.product_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="h-32 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                          {product.image ? (
                            <img
                              src={`http://localhost:4000/${product.image}`}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "/images/placeholder.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">{product.product_name}</h3>
                        <p className="text-green-600 font-bold mb-2">${product.price}/{product.unit || 'unit'}</p>
                        <p className="text-sm text-gray-600 mb-4">Quantity: {product.quantity} available</p>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-500">Be the first to review this farmer!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800">{review.customer_name}</span>
                            <span className="ml-2 text-yellow-500">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Farm Story</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {farmer.farm_story || farmer.bio || 'Our farm is dedicated to sustainable agriculture and providing the freshest, highest-quality produce to our local community. We believe in farming practices that are good for the earth, good for our customers, and good for future generations.'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Farming Practices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Sustainable farming methods</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">No harmful pesticides</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Water conservation</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Soil health focus</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700">{farmer.email || 'contact@farm.com'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-gray-700">{farmer.phone || '+1 (555) 123-4567'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerProfile;
