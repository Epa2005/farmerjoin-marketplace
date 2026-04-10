import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ProductCard3D = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const cardRef = useRef(null);
  const { addToCart } = useCart();

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
      // Success feedback could be added here
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <div className="group relative">
      {/* 3D Card Container */}
      <div
        ref={cardRef}
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.1s ease-out'
        }}
      >
        <Link
          to={`/product/${product.product_id}`}
          className="block"
        >
          <div className={`
            relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden
            shadow-xl hover:shadow-2xl transition-all duration-300
            border border-gray-200 dark:border-gray-700
            ${isHovered ? 'transform scale-105' : ''}
          `}>
            {/* Product Image with 3D Effect */}
            <div className="relative h-48 overflow-hidden">
              {product.image ? (
                <img
                  src={`http://localhost:5000/${product.image}`}
                  alt={product.product_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="24"%3Egrass%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-6xl text-primary-400">grass</span>
                </div>
              )}
              
              {/* 3D Overlay Effect */}
              <div className={`
                absolute inset-0 bg-gradient-to-t from-black/50 to-transparent
                transition-opacity duration-300
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `}></div>
              
              {/* Stock Badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className={`
                  px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm
                  ${product.quantity > 0 
                    ? 'bg-green-500/90 text-white' 
                    : 'bg-red-500/90 text-white'
                  }
                `}>
                  {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of Stock'}
                </span>
              </div>
              
              {/* Quick View Button */}
              <div className={`
                absolute top-3 left-3 z-10
                transition-all duration-300 transform
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
              `}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Quick view functionality
                  }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-700 dark:text-gray-300">eye</span>
                </button>
              </div>
              
              {/* Floating Action Buttons */}
              <div className={`
                absolute bottom-3 right-3 z-10 flex space-x-2
                transition-all duration-300 transform
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
              `}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Wishlist functionality
                  }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-red-500">heart</span>
                </button>
              </div>
            </div>
            
            {/* Product Info */}
            <div className="p-4">
              {/* Category Badge */}
              <div className="mb-2">
                <span className="badge badge-info text-xs">
                  {product.category}
                </span>
              </div>
              
              {/* Product Name */}
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {product.product_name}
              </h3>
              
              {/* Farmer Info */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">F</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {product.farmer_name || 'Local Farmer'}
                </span>
              </div>
              
              {/* Rating */}
              <div className="flex items-center space-x-1 mb-3">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      star
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">(4.5)</span>
              </div>
              
              {/* Price and Add to Cart */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-primary-600">
                    ${parseFloat(product.price || 0).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/kg</span>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={product.quantity <= 0}
                  className={`
                    px-4 py-2 rounded-xl font-semibold transition-all duration-300
                    transform hover:scale-105 active:scale-95
                    ${product.quantity > 0
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      {/* 3D Shadow Effect */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          transform: `translateZ(-20px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d'
        }}
      ></div>
    </div>
  );
};

export default ProductCard3D;
