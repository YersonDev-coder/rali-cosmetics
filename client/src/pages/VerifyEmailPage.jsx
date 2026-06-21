import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || new URLSearchParams(location.search).get('email') || '';

  const [email] = useState(emailFromState);
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  if (!email) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <p className="text-gray-600 mb-4">No se encontró un correo para verificar.</p>
          <Link to="/registro" className="text-primary font-semibold hover:underline">Volver a registro</Link>
        </div>
      </div>
    );
  }

  const handleVerificar = async (e) => {
    e.preventDefault();
    if (codigo.length !== 6) return toast.error('Ingresa los 6 dígitos del código');
    setLoading(true);
    try {
      await api.post('/auth/verificar-email', { email, codigo });
      toast.success('¡Email verificado correctamente!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al verificar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    setLoading(true);
    try {
      await api.post('/auth/reenviar-codigo', { email });
      toast.success('Código reenviado, revisa tu correo');
      setCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al reenviar el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="font-playfair text-2xl font-bold text-primary-dark text-center mb-2">Verifica tu correo</h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          Enviamos un código de 6 dígitos a <span className="font-semibold">{email}</span>
        </p>

        <form onSubmit={handleVerificar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de verificación</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-primary"
              placeholder="000000"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-60">
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>

        <button
          onClick={handleReenviar}
          disabled={loading || cooldown > 0}
          className="w-full text-center text-sm text-primary font-semibold mt-6 hover:underline disabled:opacity-50 disabled:hover:no-underline"
        >
          {cooldown > 0 ? `Reenviar código (${cooldown}s)` : 'Reenviar código'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-primary font-semibold hover:underline">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
