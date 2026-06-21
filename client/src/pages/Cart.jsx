import { Link, useNavigate } from 'react-router-dom';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, removeItem, updateQty, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="text-6xl mb-4">🛍️</div>
        <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
        <Link to="/" className="btn-primary">Ver productos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-28 sm:pt-16 lg:pt-24 pb-10">
      <h1 className="font-playfair text-2xl font-bold text-primary-dark mb-6">Mi Carrito</h1>

      <div className="space-y-4">
        {items.map(item => {
          const ck = item.cartKey ?? `${item.id}_`;
          return (
            <div key={ck} className="flex gap-4 bg-white rounded-2xl shadow-sm p-4">
              <img
                src={item.imagen_url || 'https://placehold.co/96x96/FCE4EC/C2185B?text=R'}
                alt={item.nombre}
                className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-dark">{item.nombre}</p>
                {item.variante_nombre && (
                  <p className="text-sm text-primary mt-0.5">Tono: {item.variante_nombre}</p>
                )}
                <p className="text-primary-dark font-bold mt-1">S/ {parseFloat(item.precio).toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => updateQty(ck, item.cantidad - 1)}
                    className="w-8 h-8 rounded-full border border-primary-light flex items-center justify-center text-primary-dark hover:bg-primary-light"
                  >−</button>
                  <span className="text-sm font-semibold w-8 text-center">{item.cantidad}</span>
                  <button
                    onClick={() => updateQty(ck, item.cantidad + 1)}
                    className="w-8 h-8 rounded-full border border-primary-light flex items-center justify-center text-primary-dark hover:bg-primary-light"
                  >+</button>
                  <button onClick={() => removeItem(ck)} className="ml-auto text-red-400 hover:text-red-600">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 space-y-4">
        <div className="flex justify-between font-semibold text-lg text-text-dark">
          <span>Subtotal</span>
          <span>S/ {total.toFixed(2)}</span>
        </div>
        <button onClick={() => navigate('/checkout')} className="btn-primary w-full py-3">
          Ir al Checkout
        </button>
      </div>
    </div>
  );
}
