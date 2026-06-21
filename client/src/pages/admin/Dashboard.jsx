import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ESTADO_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  verificado: 'bg-blue-100 text-blue-700',
  en_camino: 'bg-purple-100 text-purple-700',
  entregado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
};
const ESTADO_LABELS = { pendiente: 'Pendiente', verificado: 'Verificado', en_camino: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  const cards = [
    { label: 'Pedidos hoy', value: data.pedidosHoy, icon: '📦', color: 'bg-blue-50 text-blue-700' },
    { label: 'Pendientes', value: data.pendientes, icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Agotados', value: data.agotados, icon: '❌', color: 'bg-red-50 text-red-700' },
    { label: 'Ingresos del mes', value: `S/ ${parseFloat(data.ingresosMes).toFixed(2)}`, icon: '💰', color: 'bg-green-50 text-green-700' },
  ];

  return (
    <div>
      <h1 className="font-playfair text-2xl font-bold text-primary-dark mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className={`rounded-2xl p-5 ${card.color} shadow-sm`}>
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm mt-1 opacity-80">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Últimos pedidos</h2>
          <Link to="/admin/pedidos" className="text-sm text-primary hover:underline">Ver todos</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Cliente', 'Total', 'Estado', 'Fecha'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.ultimosPedidos.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">#{order.id}</td>
                  <td className="px-4 py-3 text-sm">{order.cliente_nombre || '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold">S/ {parseFloat(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge-estado ${ESTADO_COLORS[order.estado] || 'bg-gray-100 text-gray-600'}`}>
                      {ESTADO_LABELS[order.estado] || order.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('es-PE')}
                  </td>
                </tr>
              ))}
              {data.ultimosPedidos.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin pedidos aún</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
