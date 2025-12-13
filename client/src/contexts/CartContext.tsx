import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  slug: string;
  color?: string;
  size?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "fake_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const utils = trpc.useUtils();

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setLocalCart(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
  }, []);

  // Sync to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localCart));
  }, [localCart]);

  // Database cart for logged-in users
  const { data: dbCart } = trpc.cart.get.useQuery(undefined, {
    enabled: !!user,
  });

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
  });

  const updateCartMutation = trpc.cart.update.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
  });

  const removeFromCartMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
  });

  const clearCartMutation = trpc.cart.clear.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
  });

  // Use database cart for logged-in users, localStorage for guests
  const items = user && dbCart ? dbCart.items.map(item => ({
    productId: item.productId,
    name: item.product?.name || "",
    price: item.product?.price || 0,
    quantity: item.quantity,
    imageUrl: item.product?.imageUrl || null,
    slug: item.product?.slug || "",
    color: item.color || undefined,
    size: item.size || undefined,
  })) : localCart;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const quantity = item.quantity || 1;

    if (user) {
      // Add to database
      addToCartMutation.mutate({
        productId: item.productId,
        quantity,
        color: item.color as any,
        size: item.size as any,
      });
    } else {
      // Add to localStorage
      setLocalCart(prev => {
        const existing = prev.find(i => i.productId === item.productId);
        if (existing) {
          return prev.map(i =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [...prev, { ...item, quantity }];
      });
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    if (user) {
      updateCartMutation.mutate({ productId, quantity });
    } else {
      setLocalCart(prev =>
        prev.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeItem = (productId: number) => {
    if (user) {
      removeFromCartMutation.mutate({ id: productId });
    } else {
      setLocalCart(prev => prev.filter(item => item.productId !== productId));
    }
  };

  const clearCart = () => {
    if (user) {
      clearCartMutation.mutate();
    } else {
      setLocalCart([]);
    }
  };

  const isLoading =
    addToCartMutation.isPending ||
    updateCartMutation.isPending ||
    removeFromCartMutation.isPending ||
    clearCartMutation.isPending;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
