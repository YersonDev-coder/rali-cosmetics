import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PasswordInput from '../components/ui/PasswordInput';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [emailNoVerificado, setEmailNoVerificado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEmailNoVerificado(false);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Bienvenida, ${data.user.nombre}!`);
      navigate(data.user.rol === 'admin' ? '/admin' : '/');
    } catch (err) {
      if (err.response?.data?.emailNoVerificado) {
        setEmailNoVerificado(true);
      } else {
        toast.error(err.response?.data?.error || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="font-playfair text-2xl font-bold text-primary-dark text-center mb-2">Iniciar sesión</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Accede a tu cuenta RALI Cosmetics</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary text-sm"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <PasswordInput
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-60">
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        {emailNoVerificado && (
          <p className="text-center text-sm text-amber-600 bg-amber-50 rounded-xl p-3 mt-4">
            Verifica tu correo primero.{' '}
            <Link to="/verificar-email" state={{ email: form.email }} className="font-semibold hover:underline">
              Ir a verificar
            </Link>
          </p>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-primary font-semibold hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
