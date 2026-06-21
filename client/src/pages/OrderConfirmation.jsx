import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function OrderConfirmation() {
  const location = useLocation();
  const { pedidoId, metodoPago } = location.state || {};

  if (!pedidoId) return <Navigate to="/" />;

  const esYapePlin = metodoPago === 'yape' || metodoPago === 'plin';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto mb-4" />
        <h1 className="font-playfair text-2xl font-bold text-primary-dark mb-3">
          ¡Pedido #{pedidoId} recibido!
        </h1>
        <p className="text-gray-600 mb-8">
          {esYapePlin
            ? 'Estamos verificando tu pago Yape/Plin, te notificaremos por correo cuando sea confirmado.'
            : 'Tu pedido fue registrado correctamente. Pronto nos contactaremos contigo para coordinar la entrega.'}
        </p>
        <Link to="/" className="btn-primary inline-block py-3 px-8">Seguir comprando</Link>
        <Link
          to="/perfil?tab=pedidos"
          className="mt-3 inline-block py-3 px-8 rounded-full border-2 border-primary text-primary bg-white font-semibold hover:bg-primary hover:text-white transition-colors"
        >
          Ver estado de mi pedido
        </Link>
      </div>
    </div>
  );
}
