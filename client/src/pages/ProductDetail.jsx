import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRightIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/related`),
    ]).then(([prod, rel]) => {
      setProduct(prod.data);
      setRelated(rel.data);
      setQty(1);
      if (prod.data.tiene_variantes && prod.data.variantes?.length > 0) {
        setVarianteSeleccionada(prod.data.variantes.find(v => v.stock > 0) ?? null);
      } else {
        setVarianteSeleccionada(null);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!product) return <div className="text-center py-20 text-gray-500">Producto no encontrado</div>;

  const inWishlist = isInWishlist(product.id);
  const waText = encodeURIComponent(`Hola! Me interesa el producto: ${product.nombre} (S/ ${product.precio}). ¿Está disponible?`);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-primary">Inicio</Link>
        <ChevronRightIcon className="w-4 h-4" />
        {product.categoria_slug && (
          <>
            <Link to={`/categoria/${product.categoria_slug}`} className="hover:text-primary">
              {product.categoria_nombre}
            </Link>
            <ChevronRightIcon className="w-4 h-4" />
          </>
        )}
        <span className="text-text-dark font-medium line-clamp-1">{product.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-primary-light">
          <img
            src={product.imagen_url || 'https://placehold.co/600x600/FCE4EC/C2185B?text=RALI'}
            alt={product.nombre}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.categoria_nombre && (
            <span className="text-sm text-primary font-medium mb-2">{product.categoria_nombre}</span>
          )}
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-text-dark mb-4">{product.nombre}</h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-primary-dark">S/ {parseFloat(product.precio).toFixed(2)}</span>
            {product.tiene_variantes ? (
              varianteSeleccionada
                ? varianteSeleccionada.stock === 0
                  ? <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full">Agotado</span>
                  : <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">En stock ({varianteSeleccionada.stock})</span>
                : null
            ) : product.stock === 0 ? (
              <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full">Agotado</span>
            ) : (
              <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">En stock ({product.stock})</span>
            )}
          </div>

          {product.descripcion && (
            <p className="text-gray-600 leading-relaxed mb-6">{product.descripcion}</p>
          )}

          {/* Selector de tonos/variantes */}
          {product.tiene_variantes && product.variantes?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Elige un tono:</p>
              {!varianteSeleccionada && (
                <p className="text-xs text-amber-600 mb-2">Selecciona un tono para agregar al carrito</p>
              )}
              <div className="flex flex-wrap gap-2">
                {product.variantes.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    disabled={v.stock === 0}
                    onClick={() => { if (v.stock > 0) { setVarianteSeleccionada(v); setQty(1); } }}
                    className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors
                      ${v.stock === 0
                        ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                        : varianteSeleccionada?.id === v.id
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 text-gray-700 hover:border-primary'
                      }`}
                  >
                    {v.nombre}
                    {v.stock === 0 && ' (agotado)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          {(product.tiene_variantes ? varianteSeleccionada && varianteSeleccionada.stock > 0 : product.stock > 0) && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-600">Cantidad:</span>
              <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-4 py-2 hover:bg-primary-light transition-colors"
                >−</button>
                <span className="px-4 py-2 font-semibold min-w-[3rem] text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(product.tiene_variantes ? varianteSeleccionada.stock : product.stock, q + 1))}
                  className="px-4 py-2 hover:bg-primary-light transition-colors"
                >+</button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={() => addItem(product, qty, varianteSeleccionada)}
              disabled={product.tiene_variantes ? !varianteSeleccionada || varianteSeleccionada.stock === 0 : product.stock === 0}
              className="flex-1 btn-primary text-base py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.tiene_variantes && !varianteSeleccionada ? 'Elige un tono primero' : 'Agregar al carrito'}
            </button>
            <button
              onClick={() => toggle(product)}
              className="flex items-center justify-center gap-2 btn-outline py-3 px-5"
            >
              {inWishlist ? <HeartSolid className="w-5 h-5 text-primary" /> : <HeartIcon className="w-5 h-5" />}
              <span className="hidden sm:inline">Deseos</span>
            </button>
          </div>

          <a
            href={`https://wa.me/51983573536?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Consultar por WhatsApp
          </a>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-primary-dark mb-6">Productos relacionados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
