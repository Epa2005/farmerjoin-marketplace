import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SELECTED_FARMER':
      return {
        ...state,
        selectedFarmer: action.payload
      };
    
    case 'CLEAR_SELECTED_FARMER':
      return {
        ...state,
        selectedFarmer: null
      };

    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: action.payload.quantity }]
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], selectedFarmer: null });

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      dispatch({ type: 'LOAD_CART', payload: JSON.parse(savedCart) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = async (product, quantity = 1) => {
    // Check if product has sufficient stock (handle missing/undefined quantity)
    const availableStock = product.quantity || 0;
    if (availableStock < quantity) {
      throw new Error(`Insufficient stock. Only ${availableStock} items available.`);
    }
    
    try {
      // Call backend to add to cart and reduce stock
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to add items to cart');
      }

      const response = await fetch('http://localhost:5000/buyer/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product.product_id || product.id,
          quantity: quantity
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add to cart');
      }

      console.log('Cart addition response:', data);
      
      // Add to local state
      dispatch({ 
        type: 'ADD_TO_CART', 
        payload: { 
          ...product, 
          quantity,
          farmerName: product.farmer_name || 'Local Farmer',
          farmerId: product.farmer_id
        } 
      });
      
      return data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      // Find the item to get its quantity
      const item = state.items.find(item => (item.product_id || item.id) === productId);
      
      if (item) {
        // Call backend to remove from cart and restore stock
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(`http://localhost:5000/buyer/cart/product/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            console.error('Failed to remove from cart backend');
          } else {
            const data = await response.json();
            console.log('Cart removal response:', data);
          }
        }
      }
      
      // Remove from local state
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Still remove from local state even if backend fails
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const setSelectedFarmer = (farmer) => {
    dispatch({ type: 'SET_SELECTED_FARMER', payload: farmer });
  };

  const clearSelectedFarmer = () => {
    dispatch({ type: 'CLEAR_SELECTED_FARMER' });
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    items: state.items,
    selectedFarmer: state.selectedFarmer,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setSelectedFarmer,
    clearSelectedFarmer,
    getCartTotal,
    getCartItemsCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
