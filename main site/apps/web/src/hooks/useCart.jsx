import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { formatCurrency } from '@/api/EcommerceApi';

const CartContext = createContext();

const CART_STORAGE_KEY = 'e-commerce-cart';

// Checkout rejects a cart that holds a booking alongside anything else, so bookings
// stay out of the cart entirely and go straight to checkout via BookingSlotPicker.
const isBookingItem = (item) => item?.product?.type?.value === 'booking';

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);

      return storedCart ? JSON.parse(storedCart).filter(item => !isBookingItem(item)) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product, variant, quantity, availableQuantity) => {
    return new Promise((resolve, reject) => {
      if (isBookingItem({ product })) {
        reject(new Error('Appointments are booked directly at checkout, not through the cart.'));
        return;
      }

      if (variant.manage_inventory) {
        const existingItem = cartItems.find(item => item.variant.id === variant.id);
        const currentCartQuantity = existingItem ? existingItem.quantity : 0;
        if ((currentCartQuantity + quantity) > availableQuantity) {
          const error = new Error(`Not enough stock for ${product.title} (${variant.title}). Only ${availableQuantity} left.`);
          reject(error);
          return;
        }
      }

      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.variant.id === variant.id);
        if (existingItem) {
          return prevItems.map(item =>
            item.variant.id === variant.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prevItems, { product, variant, quantity }];
      });
      resolve();
    });
  }, [cartItems]);

  const removeFromCart = useCallback((variantId) => {
    setCartItems(prevItems => prevItems.filter(item => item.variant.id !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId, quantity) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.variant.id === variantId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return formatCurrency(cartItems.reduce((total, item) => {
      const price = item.variant.sale_price_in_cents ?? item.variant.price_in_cents;
      return total + price * item.quantity;
    }, 0), cartItems[0].variant.currency_info);
  }, [cartItems]);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
};