import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';

export default function CartSidebar() {
  const { items, open, setOpen, removeItem, updateQty, total } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setOpen(false);
    navigate('/checkout');
  };

  return createPortal(
    <>
      {/* Overlay — cubre toda la pantalla por debajo del drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer — empieza justo debajo del header fijo, llega hasta el fondo */}
      <div
        className={`fixed top-28 sm:top-16 lg:top-24 right-0 h-[calc(100vh-7rem)] sm:h-[calc(100vh-4rem)] lg:h-[calc(100vh-6rem)] w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary-light">
          <h2 className="font-playfair text-xl font-bold text-primary-dark">Mi Carrito</h2>
          <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-primary-dark">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-6xl mb-4">🛍️</div>
            <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
            <button onClick={() => setOpen(false)} className="btn-primary">
              Ver productos
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.imagen_url || 'https://placehold.co/80x80/FCE4EC/C2185B?text=R'}
                    alt={item.nombre}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-dark line-clamp-2">{item.nombre}</p>
                    <p className="text-primary-dark font-bold text-sm mt-1">
                      S/ {parseFloat(item.precio).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.id, item.cantidad - 1)}
                        className="w-7 h-7 rounded-full border border-primary-light flex items-center justify-center text-primary-dark hover:bg-primary-light"
                      >−</button>
                      <span className="text-sm font-semibold w-6 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => updateQty(item.id, item.cantidad + 1)}
                        className="w-7 h-7 rounded-full border border-primary-light flex items-center justify-center text-primary-dark hover:bg-primary-light"
                      >+</button>
                      <button onClick={() => removeItem(item.id)} className="ml-auto text-red-400 hover:text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-primary-light px-5 py-4 space-y-3">
              <div className="flex justify-between font-semibold text-text-dark">
                <span>Subtotal</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
              <button onClick={handleCheckout} className="btn-primary w-full text-center">
                Ir al Checkout
              </button>
              <Link
                to="/carrito"
                onClick={() => setOpen(false)}
                className="block text-center text-sm text-primary hover:underline"
              >
                Ver carrito completo
              </Link>
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  );
}
