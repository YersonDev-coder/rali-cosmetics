import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const CART_KEY = 'rali_cart';

function getCartKey(item) {
  return item.cartKey ?? `${item.id}_`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY)) || [];
      return stored.map(i => ({ ...i, cartKey: i.cartKey ?? `${i.id}_` }));
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, cantidad = 1, variante = null) => {
    const cartKey = `${product.id}_${variante?.id ?? ''}`;
    const maxStock = variante ? variante.stock : product.stock;
    setItems(prev => {
      const exists = prev.find(i => getCartKey(i) === cartKey);
      if (exists) {
        return prev.map(i => getCartKey(i) === cartKey
          ? { ...i, cantidad: Math.min(i.cantidad + cantidad, maxStock) }
          : i
        );
      }
      return [...prev, {
        ...product,
        cartKey,
        variante_id: variante?.id ?? null,
        variante_nombre: variante?.nombre ?? null,
        stock: maxStock,
      }];
    });
    const label = variante ? `${product.nombre} — ${variante.nombre}` : product.nombre;
    toast.success(`${label} agregado al carrito`);
    setOpen(true);
  };

  const removeItem = (cartKey) => {
    setItems(prev => prev.filter(i => getCartKey(i) !== cartKey));
  };

  const updateQty = (cartKey, cantidad) => {
    if (cantidad < 1) return removeItem(cartKey);
    setItems(prev => prev.map(i => getCartKey(i) === cartKey ? { ...i, cantidad } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((acc, i) => acc + parseFloat(i.precio) * i.cantidad, 0);
  const count = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
