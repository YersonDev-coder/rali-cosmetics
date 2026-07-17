import { Link } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <Link to={`/producto/${product.id}`} className="block relative overflow-hidden aspect-square">
        <img
          src={product.imagen_url || 'https://placehold.co/300x300/FCE4EC/C2185B?text=RALI'}
          alt={`${product.nombre} - RALI Cosmetics Huánuco`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.stock === 0 && (
          <span className="absolute top-2 left-2 bg-gray-700 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Agotado
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggle(product); }}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:scale-110 transition-transform"
        >
          {inWishlist
            ? <HeartSolid className="w-5 h-5 text-primary" />
            : <HeartIcon className="w-5 h-5 text-gray-400 hover:text-primary" />
          }
        </button>
      </Link>
      <div className="p-3">
        <Link to={`/producto/${product.id}`}>
          <h3 className="text-sm font-medium text-text-dark hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.nombre}
          </h3>
        </Link>
        {product.categoria_nombre && (
          <p className="text-xs text-gray-400 mt-1">{product.categoria_nombre}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-primary-dark font-bold text-lg">
            S/ {parseFloat(product.precio).toFixed(2)}
          </span>
        </div>
        {product.tiene_variantes ? (
          product.stock === 0 ? (
            <button
              disabled
              className="w-full mt-2 flex items-center justify-center gap-2 btn-primary text-sm py-2 opacity-50 cursor-not-allowed"
            >
              <ShoppingBagIcon className="w-4 h-4" />
              Agotado
            </button>
          ) : (
            <Link
              to={`/producto/${product.id}`}
              className="w-full mt-2 flex items-center justify-center gap-2 btn-primary text-sm py-2"
            >
              <ShoppingBagIcon className="w-4 h-4" />
              Elegir tono
            </Link>
          )
        ) : (
          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="w-full mt-2 flex items-center justify-center gap-2 btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            {product.stock === 0 ? 'Agotado' : 'Agregar'}
          </button>
        )}
      </div>
    </div>
  );
}
