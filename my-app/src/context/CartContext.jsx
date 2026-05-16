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
      const existingItem = state.items.find(item =>
        String(item.id) === String(action.payload.id) ||
        String(item.product_id) === String(action.payload.id)
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            (String(item.id) === String(action.payload.id) || String(item.product_id) === String(action.payload.id))
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
        items: state.items.filter(item =>
          String(item.id) !== String(action.payload) &&
          String(item.product_id) !== String(action.payload)
        )
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          (String(item.id) === String(action.payload.id) || String(item.product_id) === String(action.payload.id))
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

  // Fetch cart from backend on mount if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCart();
    }
  }, []);

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/buyer/cart', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const cartData = await response.json();
        console.log('Fetched cart from backend:', cartData);
        // Transform backend cart data to frontend format
        const transformedItems = cartData.map(item => ({
          id: item.product_id,
          product_id: item.product_id,
          name: item.product_name,
          price: item.price_at_time || item.price,
          quantity: item.quantity,
          image: item.image,
          farmerName: item.farmer_name || 'Local Farmer',
          farmerId: item.farmer_id || item.buyer_id
        }));
        dispatch({ type: 'LOAD_CART', payload: transformedItems });
      }
    } catch (error) {
      console.error('Error fetching cart from backend:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = async (product, quantity = 1) => {
    // Check if product has sufficient stock (handle missing/undefined quantity)
    const availableStock = product.quantity || 0;
    if (availableStock < quantity) {
      throw new Error(`Insufficient stock. Only ${availableStock} items available.`);
    }

    console.log('addToCart called with product:', product, 'quantity:', quantity);

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
        // Handle 401 Unauthorized or invalid token errors
        if (response.status === 401 || data.message?.toLowerCase().includes('invalid token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || 'Failed to add to cart');
      }

      console.log('Cart addition response:', data);

      // Update local state based on backend response
      const productId = product.product_id || product.id;

      // Check if item already exists in cart (using string comparison for type safety)
      const existingItem = state.items.find(item =>
        String(item.id) === String(productId) || String(item.product_id) === String(productId)
      );

      console.log('Existing item check:', productId, 'found:', !!existingItem);

      if (existingItem) {
        // Item exists - update quantity
        const newQuantity = data.quantity || (existingItem.quantity + quantity);
        console.log('Updating quantity for existing item:', productId, 'new quantity:', newQuantity);
        dispatch({
          type: 'UPDATE_QUANTITY',
          payload: { id: productId, quantity: newQuantity }
        });
      } else {
        // New item - add to cart
        console.log('Adding new item to cart:', productId);
        dispatch({
          type: 'ADD_TO_CART',
          payload: {
            ...product,
            id: productId,
            quantity: data.quantity || quantity,
            farmerName: product.farmer_name || 'Local Farmer',
            farmerId: product.farmer_id
          }
        });
      }

      // Refresh cart from backend to ensure consistency
      await fetchCart();

      console.log('Cart items after dispatch:', state.items);
      return data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      // Find the item to get its quantity
      const item = state.items.find(item =>
        String(item.product_id) === String(productId) || String(item.id) === String(productId)
      );
      
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

  const clearCart = async () => {
    try {
      // Call backend to clear cart
      const token = localStorage.getItem('token');
      console.log('Token for clear cart:', token ? 'exists' : 'missing');
      if (token) {
        const response = await fetch('http://localhost:5000/buyer/cart/clear', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to clear cart from backend:', response.status, errorData);
        } else {
          console.log('Cart cleared from backend');
        }
      } else {
        console.warn('No token found, clearing local cart only');
      }

      // Clear local state
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Still clear local state even if backend fails
      dispatch({ type: 'CLEAR_CART' });
    }
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
