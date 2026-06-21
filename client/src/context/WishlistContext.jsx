import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

const WL_KEY = 'rali_wishlist';

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (user) {
      api.get('/wishlist/ids').then(res => setIds(res.data)).catch(() => {});
    } else {
      try {
        setIds(JSON.parse(localStorage.getItem(WL_KEY)) || []);
      } catch {
        setIds([]);
      }
    }
  }, [user]);

  const toggle = async (product) => {
    const inList = ids.includes(product.id);
    if (user) {
      if (inList) {
        await api.delete(`/wishlist/${product.id}`);
        setIds(prev => prev.filter(id => id !== product.id));
        toast.success('Eliminado de lista de deseos');
      } else {
        await api.post(`/wishlist/${product.id}`);
        setIds(prev => [...prev, product.id]);
        toast.success('Agregado a lista de deseos');
      }
    } else {
      const next = inList ? ids.filter(id => id !== product.id) : [...ids, product.id];
      setIds(next);
      localStorage.setItem(WL_KEY, JSON.stringify(next));
      toast.success(inList ? 'Eliminado de lista de deseos' : 'Agregado a lista de deseos');
    }
  };

  const isInWishlist = (id) => ids.includes(id);

  return (
    <WishlistContext.Provider value={{ ids, toggle, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
