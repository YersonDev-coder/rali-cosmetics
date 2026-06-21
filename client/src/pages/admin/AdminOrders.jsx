import { useState, useEffect } from 'react';
import { EyeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ESTADOS = ['pendiente', 'verificado', 'en_camino', 'entregado', 'cancelado'];
const ESTADO_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  verificado: 'bg-blue-100 text-blue-700',
  en_camino: 'bg-purple-100 text-purple-700',
  entregado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
};
const ESTADO_LABELS = { pendiente: 'Pendiente', verificado: 'Verificado', en_camino: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado' };
const METODO_LABELS = { yape: 'Yape', plin: 'Plin', contra_entrega: 'Contra entrega' };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = (estado = '') => {
    setLoading(true);
    api.get('/admin/orders', { params: { estado, limit: 50 } })
      .then(r => setOrders(r.data.orders))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filterEstado); }, [filterEstado]);

  const openDetail = async (order) => {
    setSelected(order);
    setLoadingDetail(true);
    setDetail(null);
    api.get(`/admin/orders/${order.id}`).then(r => setDetail(r.data)).finally(() => setLoadingDetail(false));
  };

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

  const changeEstado = async (orderId, estado) => {
    try {
      await api.put(`/admin/orders/${orderId}/estado`, { estado });
      toast.success('Estado actualizado');
      load(filterEstado);
      if (detail?.id === orderId) setDetail(prev => ({ ...prev, estado }));
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  return (
    <div>
      <h1 className="font-playfair text-2xl font-bold text-primary-dark mb-6">Pedidos</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterEstado('')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!filterEstado ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}
        >
          Todos
        </button>
        {ESTADOS.map(e => (
          <button
            key={e}
            onClick={() => setFilterEstado(e)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterEstado === e ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}
          >
            {ESTADO_LABELS[e]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? <LoadingSpinner fullPage /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Cliente', 'Total', 'Entrega', 'Pago', 'Estado', 'Fecha', 'Ver'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">#{order.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium">{order.cliente_nombre || '—'}</p>
                      <p className="text-gray-400 text-xs">{order.cliente_email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">S/ {parseFloat(order.total).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm capitalize">{order.tipo_entrega}</td>
                    <td className="px-4 py-3 text-sm">{METODO_LABELS[order.metodo_pago] || order.metodo_pago}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.estado}
                        onChange={e => changeEstado(order.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-primary ${ESTADO_COLORS[order.estado] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(order)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Sin pedidos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-playfair text-xl font-bold text-primary-dark mb-4">Pedido #{selected.id}</h2>

            {loadingDetail ? <LoadingSpinner fullPage /> : detail && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs mb-1">Cliente</p>
                    <p className="font-semibold">{detail.cliente_nombre}</p>
                    <p className="text-gray-500">{detail.cliente_email}</p>
                    <p className="text-gray-500">{detail.cliente_telefono}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs mb-1">Entrega</p>
                    <p className="font-semibold capitalize">{detail.tipo_entrega}</p>
                    {detail.direccion_entrega && <p className="text-gray-500">{detail.direccion_entrega}, {detail.distrito}</p>}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-2">Productos</p>
                  {detail.items?.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      {item.imagen_url && <img src={item.imagen_url} alt={item.nombre} className="w-10 h-10 object-cover rounded" />}
                      <div className="flex-1">
                        <p>{item.nombre}</p>
                        <p className="text-gray-500">x{item.cantidad} — S/ {parseFloat(item.precio_unitario).toFixed(2)} c/u</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>S/ {parseFloat(detail.subtotal).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>S/ {parseFloat(detail.costo_delivery).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold"><span>Total</span><span>S/ {parseFloat(detail.total).toFixed(2)}</span></div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Pago:</span>
                  <span className="font-medium">{METODO_LABELS[detail.metodo_pago] || detail.metodo_pago}</span>
                </div>

                {detail.comprobante_url && (
                  <div>
                    <p className="text-gray-500 mb-2">Comprobante:</p>
                    <a href={detail.comprobante_url} target="_blank" rel="noopener noreferrer">
                      <img src={detail.comprobante_url} alt="comprobante" className="w-full rounded-xl max-h-48 object-contain border" />
                    </a>
                  </div>
                )}

                {detail.numero_boleta && (
                  <div className="flex items-center justify-between bg-primary-light rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-500">Boleta generada</p>
                      <p className="font-semibold text-primary-dark text-sm">{detail.numero_boleta}</p>
                    </div>
                    <button
                      onClick={() => descargarBoleta(detail.id, detail.numero_boleta)}
                      className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-primary-dark transition-colors"
                    >
                      ↓ Descargar boleta
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Cambiar estado</p>
                    <select
                      value={detail.estado}
                      onChange={e => changeEstado(detail.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                    >
                      {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
                    </select>
                  </div>
                  {detail.cliente_telefono && (
                    <a
                      href={`https://wa.me/${detail.cliente_telefono.replace(/\D/g, '')}?text=Hola%20${detail.cliente_nombre}%2C%20te%20contactamos%20sobre%20tu%20pedido%20%23${detail.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>

                <button onClick={() => setSelected(null)} className="btn-outline w-full mt-2 py-2.5">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
