import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const DISTRITOS = [
  'Huánuco', 'Amarilis', 'Pillco Marca', 'Chinchao', 'Churubamba', 'Margos',
  'Quisqui', 'San Francisco de Cayran', 'San Pedro de Chaulán', 'Santa María del Valle',
  'Yarumayo', 'Pinra',
];

const TIENDA_DIRECCION = 'Ubinas Mz. G1 Lt. 17, Amarilis 10003, Perú';
const TIENDA_MAPS_Q = 'Ubinas+Mz.+G1+Lt.+17,+Amarilis+10003,+Peru';
const HUANUCO_MAPS_Q = 'Hu%C3%A1nuco,+Peru';

const STEPS = ['Entrega', 'Pago'];

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [entrega, setEntrega] = useState({ tipo: 'delivery', direccion: '', referencia: '', distrito: '' });
  const [pago, setPago] = useState({ metodo: 'yape', comprobante: null });
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="font-playfair text-xl font-bold text-primary-dark mb-3">Debes iniciar sesión para comprar</h2>
        <Link to="/login" className="btn-primary">Iniciar sesión</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🛍️</div>
        <h2 className="font-playfair text-xl font-bold text-primary-dark mb-3">Tu carrito está vacío</h2>
        <Link to="/" className="btn-primary">Seguir comprando</Link>
      </div>
    );
  }

  const costo_delivery = entrega.tipo === 'delivery' ? 5 : 0;
  const totalFinal = total + costo_delivery;

  const submitOrder = async () => {
    if (entrega.tipo === 'delivery' && (!entrega.direccion || !entrega.distrito)) {
      return toast.error('Completa los datos de entrega');
    }
    if ((pago.metodo === 'yape' || pago.metodo === 'plin') && !pago.comprobante) {
      return toast.error('Sube el comprobante de pago');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('tipo_entrega', entrega.tipo);
      formData.append('direccion_entrega', entrega.direccion || '');
      formData.append('distrito', entrega.distrito || '');
      formData.append('metodo_pago', pago.metodo);
      formData.append('subtotal', total.toFixed(2));
      formData.append('costo_delivery', costo_delivery.toFixed(2));
      formData.append('total', totalFinal.toFixed(2));
      formData.append('items', JSON.stringify(items.map(i => ({ id: i.id, cantidad: i.cantidad, precio: i.precio }))));
      if (pago.comprobante) formData.append('comprobante', pago.comprobante);

      const res = await api.post('/orders', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      clearCart();
      toast.success('¡Pedido realizado con éxito!');
      navigate('/pedido-confirmado', { state: { pedidoId: res.data.id, metodoPago: res.data.metodo_pago } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-playfair text-2xl font-bold text-primary-dark mb-8 text-center">Checkout</h1>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex flex-col items-center ${i <= step ? 'text-primary' : 'text-gray-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${i < step ? 'bg-primary border-primary text-white' : i === step ? 'border-primary text-primary' : 'border-gray-300 text-gray-300'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs mt-1 font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mx-2 ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Steps content */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          {/* Step 0: Entrega */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg text-primary-dark mb-4">Método de entrega</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'delivery', label: 'Delivery a domicilio', sub: 'S/ 5.00', icon: '🛵' },
                  { value: 'recojo', label: 'Recojo en tienda', sub: 'Gratis', icon: '🏪' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setEntrega({ ...entrega, tipo: opt.value })}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${entrega.tipo === opt.value ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-primary-light'}`}
                  >
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <div className="text-sm font-semibold text-text-dark">{opt.label}</div>
                    <div className="text-sm text-primary font-bold">{opt.sub}</div>
                  </button>
                ))}
              </div>

              {entrega.tipo === 'delivery' ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                    <input
                      type="text"
                      value={entrega.direccion}
                      onChange={e => setEntrega({ ...entrega, direccion: e.target.value })}
                      placeholder="Jr. Ejemplo 123"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                    <input
                      type="text"
                      value={entrega.referencia}
                      onChange={e => setEntrega({ ...entrega, referencia: e.target.value })}
                      placeholder="Cerca al mercado, color azul..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distrito *</label>
                    <select
                      value={entrega.distrito}
                      onChange={e => setEntrega({ ...entrega, distrito: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">Selecciona distrito</option>
                      {DISTRITOS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <p className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                      Zona de cobertura — Huánuco
                    </p>
                    <iframe
                      src={`https://www.google.com/maps?q=${HUANUCO_MAPS_Q}&output=embed`}
                      width="100%"
                      height="240"
                      style={{ border: 0, display: 'block' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Zona de delivery en Huánuco"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="bg-primary-light rounded-xl p-4 text-sm text-text-dark">
                    <p className="font-semibold text-base mb-1">📍 Dirección de la tienda</p>
                    <p className="mb-3">{TIENDA_DIRECCION}</p>
                    <div className="flex items-start gap-2 mb-3">
                      <Clock size={15} className="text-primary mt-0.5 flex-shrink-0" />
                      <ul className="text-gray-600 space-y-0.5 text-xs leading-relaxed">
                        <li><span className="font-medium text-text-dark">Lun – Vie:</span> 3:00 p.m. – 8:00 p.m.</li>
                        <li><span className="font-medium text-text-dark">Sábados:</span> 3:00 p.m. – 7:00 p.m.</li>
                        <li><span className="font-medium text-text-dark">Domingos:</span> Cerrado</li>
                      </ul>
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${TIENDA_MAPS_Q}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                    >
                      Ver en Google Maps →
                    </a>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <iframe
                      src={`https://www.google.com/maps?q=${TIENDA_MAPS_Q}&output=embed`}
                      width="100%"
                      height="260"
                      style={{ border: 0, display: 'block' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicación RALI Cosmetics"
                    />
                  </div>
                </div>
              )}

              <button onClick={() => setStep(1)} className="btn-primary w-full mt-4 py-3">
                Continuar al pago →
              </button>
            </div>
          )}

          {/* Step 1: Pago */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg text-primary-dark mb-4">Método de pago</h2>
              <div className="space-y-2">
                {[
                  { value: 'yape', label: 'Yape', icon: '💜' },
                  { value: 'plin', label: 'Plin', icon: '💙' },
                  ...(entrega.tipo === 'recojo' ? [{ value: 'contra_entrega', label: 'Pago contra entrega', icon: '💵' }] : []),
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPago({ ...pago, metodo: opt.value })}
                    className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-colors ${pago.metodo === opt.value ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-primary-light'}`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-semibold text-text-dark">{opt.label}</span>
                    {pago.metodo === opt.value && <span className="ml-auto text-primary">✓</span>}
                  </button>
                ))}
              </div>

              {(pago.metodo === 'yape' || pago.metodo === 'plin') && (
                <div className="bg-primary-light rounded-xl p-5 text-center space-y-3">
                  <p className="font-semibold text-primary-dark">{pago.metodo === 'yape' ? 'Yape' : 'Plin'} al número:</p>
                  <p className="text-2xl font-bold text-primary-dark">+51 983 573 536</p>
                  <p className="text-lg font-bold text-primary">Monto exacto: S/ {totalFinal.toFixed(2)}</p>
                  <div className="text-8xl">📱</div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subir comprobante *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setPago({ ...pago, comprobante: e.target.files[0] })}
                      className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary file:text-white hover:file:bg-primary-dark"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-outline flex-1 py-3">← Volver</button>
                <button
                  onClick={submitOrder}
                  disabled={loading}
                  className="btn-primary flex-1 py-3 disabled:opacity-60"
                >
                  {loading ? 'Procesando...' : 'Confirmar pedido'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-5 h-fit">
          <h3 className="font-semibold text-primary-dark mb-4">Resumen</h3>
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.id} className="flex gap-2 text-sm">
                <img src={item.imagen_url || 'https://placehold.co/48x48/FCE4EC/C2185B?text=R'} alt={item.nombre}
                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-2">{item.nombre}</p>
                  <p className="text-gray-500">x{item.cantidad}</p>
                </div>
                <p className="font-semibold whitespace-nowrap">S/ {(parseFloat(item.precio) * item.cantidad).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-primary-light pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>S/ {total.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{costo_delivery === 0 ? 'Gratis' : `S/ ${costo_delivery.toFixed(2)}`}</span></div>
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span><span className="text-primary-dark">S/ {totalFinal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
