import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) { removeFromCart(itemId); return; }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const totalItems    = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice    = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const kitchenId     = cart[0]?.kitchenId || cart[0]?.kitchen_id || null;

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart,
      updateQuantity, clearCart,
      totalItems, totalPrice, kitchenId,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}