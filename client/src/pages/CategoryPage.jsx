import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'default';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const disponible = searchParams.get('disponible') || '';

  const [priceRange, setPriceRange] = useState([minPrice || 0, maxPrice || 500]);

  useEffect(() => {
    api.get(`/categories/${slug}`).then(r => setCategory(r.data)).catch(() => {});
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    const params = { categoria: slug, page, sort, limit: 12 };
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (disponible) params.disponible = disponible;

    api.get('/products', { params })
      .then(r => {
        setProducts(r.data.products);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .finally(() => setLoading(false));
  }, [slug, page, sort, minPrice, maxPrice, disponible]);

  const setParam = (key, value) => {
    const sp = new URLSearchParams(searchParams);
    if (value) sp.set(key, value); else sp.delete(key);
    sp.set('page', '1');
    setSearchParams(sp);
  };

  const applyPrice = () => {
    const sp = new URLSearchParams(searchParams);
    sp.set('min_price', priceRange[0]);
    sp.set('max_price', priceRange[1]);
    sp.set('page', '1');
    setSearchParams(sp);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary">Inicio</Link>
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-text-dark font-medium">{category?.nombre || slug}</span>
      </nav>

      {/* Encabezado: título + contador/orden en la misma fila en sm+, apilados en mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-dark">
          {category?.nombre || 'Categoría'}
        </h1>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-gray-500">{total} productos</span>
          <select
            value={sort}
            onChange={e => setParam('sort', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            <option value="default">Relevancia</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
            <option value="nuevos">Más nuevos</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-28">
            <h3 className="font-semibold text-primary-dark mb-4">Filtros</h3>

            {/* Price range */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-600 mb-3">Precio (S/)</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={e => setPriceRange([e.target.value, priceRange[1]])}
                  placeholder="Min"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], e.target.value])}
                  placeholder="Max"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <button onClick={applyPrice} className="w-full btn-primary text-sm py-2">
                Aplicar
              </button>
            </div>

            {/* Availability */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Disponibilidad</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={disponible === 'true'}
                  onChange={e => setParam('disponible', e.target.checked ? 'true' : '')}
                  className="accent-primary"
                />
                Solo disponibles
              </label>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">

          {loading ? <LoadingSpinner fullPage /> : products.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-4">🔍</div>
              <p>No hay productos en esta categoría</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setParam('page', p)}
                      className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                        p === page ? 'bg-primary text-white' : 'bg-white border border-gray-200 hover:border-primary text-text-dark'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
