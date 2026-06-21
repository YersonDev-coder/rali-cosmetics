import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api.get('/products', { params: { search: q, limit: 24 } })
      .then(r => { setProducts(r.data.products); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-primary-dark mb-2">
        {q ? `Resultados para "${q}"` : 'Búsqueda'}
      </h1>
      {!loading && q && (
        <p className="text-gray-500 text-sm mb-6">{total} resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
      )}

      {loading ? <LoadingSpinner fullPage /> : products.length === 0 && q ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500 text-lg">No encontramos resultados para "{q}"</p>
          <p className="text-gray-400 text-sm mt-2">Intenta con otras palabras o revisa la ortografía</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
