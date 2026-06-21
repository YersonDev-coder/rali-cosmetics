import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '', direccion: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register(form);
      toast.success(data.mensaje || '¡Cuenta creada con éxito! Revisa tu correo.');
      navigate('/verificar-email', { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '', required = true) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        type={type}
        required={required}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary text-sm"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="font-playfair text-2xl font-bold text-primary-dark text-center mb-2">Crear cuenta</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Únete a RALI Cosmetics</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('nombre', 'Nombre completo', 'text', 'Tu nombre completo')}
          {field('email', 'Email', 'email', 'tu@email.com')}
          {field('password', 'Contraseña', 'password', '••••••••')}
          {field('telefono', 'Teléfono', 'tel', '+51 999 999 999', false)}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (Huánuco)</label>
            <textarea
              value={form.direccion}
              onChange={e => setForm({ ...form, direccion: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary text-sm resize-none"
              placeholder="Jr. Ejemplo 123, Huánuco"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-60">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
