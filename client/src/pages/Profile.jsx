import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ESTADO_COLORS = {
  pendiente: 'bg-gray-100 text-gray-700',
  verificado: 'bg-blue-100 text-blue-700',
  en_camino: 'bg-orange-100 text-orange-700',
  entregado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
  cancelado: 'bg-red-100 text-red-700',
};
const ESTADO_LABELS = {
  pendiente: 'Pendiente verificación',
  verificado: 'Verificado',
  en_camino: 'En camino',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'datos';

  const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '' });
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ nombre: user.nombre, telefono: user.telefono || '', direccion: user.direccion || '' });
  }, [user]);

  useEffect(() => {
    if (tab === 'pedidos') {
      setLoading(true);
      api.get('/pedidos/mis-pedidos').then(r => setOrders(r.data)).finally(() => setLoading(false));
    }
    if (tab === 'deseos') {
      setLoading(true);
      api.get('/wishlist').then(r => setWishlist(r.data)).finally(() => setLoading(false));
    }
  }, [tab]);

  if (!user) return <Navigate to="/login" />;

  const descargarBoleta = async (pedidoId, numeroBoleta) => {
    try {
      const response = await api.get(`/orders/${pedidoId}/boleta`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `boleta-${numeroBoleta}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar la boleta');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Datos actualizados');
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key: 'datos', label: 'Mis datos' },
    { key: 'pedidos', label: 'Mis pedidos' },
    { key: 'deseos', label: 'Lista de deseos' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-playfair text-2xl font-bold text-primary-dark mb-6">Mi perfil</h1>

      <div className="flex gap-2 border-b border-primary-light mb-8 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setSearchParams({ tab: t.key })}
            className={`px-5 py-2.5 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Mis datos */}
      {tab === 'datos' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={user.email} disabled
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <textarea
                value={form.direccion}
                onChange={e => setForm({ ...form, direccion: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary py-2.5 disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      )}

      {/* Mis pedidos */}
      {tab === 'pedidos' && (
        loading ? <LoadingSpinner fullPage /> :
        orders.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-3">📦</div>
            <p>Aún no tienes pedidos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-primary-dark">Pedido #{order.id}</p>
                    <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('es-PE', { dateStyle: 'long' })}</p>
                    {order.numero_boleta && (
                      <p className="text-xs text-gray-400 mt-0.5">Boleta {order.numero_boleta}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`badge-estado ${ESTADO_COLORS[order.estado] || 'bg-gray-100 text-gray-600'}`}>
                      {ESTADO_LABELS[order.estado] || order.estado}
                    </span>
                    <span className="font-bold text-primary-dark">S/ {parseFloat(order.total).toFixed(2)}</span>
                    {order.numero_boleta && (
                      <button
                        onClick={() => descargarBoleta(order.id, order.numero_boleta)}
                        className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mt-0.5"
                      >
                        ↓ Descargar boleta
                      </button>
                    )}
                  </div>
                </div>
                {order.items && (
                  <div className="space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-2 text-sm text-gray-600">
                        {item.imagen && <img src={item.imagen} alt={item.nombre} className="w-8 h-8 object-cover rounded" />}
                        <span>{item.cantidad}x {item.nombre}</span>
                        <span className="ml-auto">S/ {parseFloat(item.precio).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Lista de deseos */}
      {tab === 'deseos' && (
        loading ? <LoadingSpinner fullPage /> :
        wishlist.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-3">💕</div>
            <p>Tu lista de deseos está vacía</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlist.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )
      )}
    </div>
  );
}
