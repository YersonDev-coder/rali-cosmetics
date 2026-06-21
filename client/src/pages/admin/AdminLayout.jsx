import { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Squares2X2Icon, ShoppingBagIcon, TagIcon, ClipboardDocumentListIcon,
  Bars3Icon, XMarkIcon, ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin', icon: Squares2X2Icon, label: 'Dashboard', exact: true },
  { to: '/admin/productos', icon: ShoppingBagIcon, label: 'Productos' },
  { to: '/admin/categorias', icon: TagIcon, label: 'Categorías' },
  { to: '/admin/pedidos', icon: ClipboardDocumentListIcon, label: 'Pedidos' },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <LoadingSpinner fullPage />;
  if (!user || user.rol !== 'admin') return <Navigate to="/login" />;

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-primary-dark text-white ${mobile ? 'w-64' : 'w-64'}`}>
      <div className="p-6 border-b border-primary-700">
        <Link to="/" className="font-playfair text-xl font-bold">RALI Cosmetics</Link>
        <p className="text-primary-200 text-xs mt-1">Panel de Administración</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to) && to !== '/admin';
          const isExact = to === '/admin' && location.pathname === '/admin';
          const isActive = isExact || (!exact && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                isActive ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-primary-700">
        <div className="text-primary-200 text-sm mb-3">
          <p className="font-semibold text-white">{user.nombre}</p>
          <p className="text-xs">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-primary-200 hover:text-white transition-colors w-full"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full z-50 lg:hidden flex">
            <Sidebar mobile />
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-white">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <span className="font-playfair font-bold text-primary-dark">Panel Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
