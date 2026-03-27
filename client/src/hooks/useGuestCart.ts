import { useState, useEffect } from 'react';

export interface GuestCartItem {
  productId: number;
  quantity: number;
  size: string;
  color: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
}

const GUEST_CART_KEY = 'guest_cart';

export function useGuestCart() {
  const [items, setItems] = useState<GuestCartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse guest cart:', e);
        localStorage.removeItem(GUEST_CART_KEY);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<GuestCartItem, 'quantity'> & { quantity?: number }) => {
    setItems(current => {
      // Check if item with same product, size, and color already exists
      const existingIndex = current.findIndex(
        i => i.productId === item.productId && i.size === item.size && i.color === item.color
      );

      if (existingIndex >= 0) {
        // Update quantity
        const updated = [...current];
        updated[existingIndex].quantity += item.quantity || 1;
        return updated;
      } else {
        // Add new item
        return [...current, { ...item, quantity: item.quantity || 1 }];
      }
    });
  };

  const updateQuantity = (productId: number, size: string, color: string, quantity: number) => {
    setItems(current => {
      if (quantity === 0) {
        // Remove item
        return current.filter(
          i => !(i.productId === productId && i.size === size && i.color === color)
        );
      } else {
        // Update quantity
        return current.map(i =>
          i.productId === productId && i.size === size && i.color === color
            ? { ...i, quantity }
            : i
        );
      }
    });
  };

  const removeItem = (productId: number, size: string, color: string) => {
    setItems(current =>
      current.filter(i => !(i.productId === productId && i.size === size && i.color === color))
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(GUEST_CART_KEY);
  };

  const getCart = () => items;

  const getItemCount = () => items.reduce((sum, item) => sum + item.quantity, 0);

  const getTotal = () => items.reduce((sum, item) => sum + (item.productPrice || 0) * item.quantity, 0);

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getCart,
    getItemCount,
    getTotal,
  };
}
