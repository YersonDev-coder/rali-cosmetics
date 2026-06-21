import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MagnifyingGlassIcon, ShoppingBagIcon, UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { name: 'Bases', slug: 'bases' },
  { name: 'Polvos', slug: 'polvos-traslucidos' },
  { name: 'Rímel', slug: 'rimel' },
  { name: 'Labiales', slug: 'labiales' },
  { name: 'Delineadores', slug: 'delineadores' },
  { name: 'Cuidado de Piel', slug: 'cuidado-piel' },
  { name: 'Brochas', slug: 'brochas' },
  { name: 'Accesorios', slug: 'accesorios' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { count, setOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [search, setSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(!isHome);
  const menuRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const debounceRef = useRef(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const dentroDesktop = desktopSearchRef.current && desktopSearchRef.current.contains(e.target);
      const dentroMobile = mobileSearchRef.current && mobileSearchRef.current.contains(e.target);
      if (!dentroDesktop && !dentroMobile) setMostrarSugerencias(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMostrarSugerencias(false);
  }, [location]);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const check = () => setScrolled(window.scrollY > window.innerHeight * 0.85);
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [isHome]);

  const handleSearchChange = (e) => {
    const valor = e.target.value;
    setSearch(valor);
    clearTimeout(debounceRef.current);
    if (valor.trim().length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await api.get('/products/suggestions', { params: { q: valor } });
        setSugerencias(r.data);
        setMostrarSugerencias(r.data.length > 0);
      } catch {
        // falla silenciosamente — la búsqueda principal sigue disponible
      }
    }, 300);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setMostrarSugerencias(false);
    if (search.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    toast.success('Sesión cerrada');
    navigate('/');
  };

  return (
    <header
      className="bg-white shadow-sm"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transform: scrolled ? 'translateY(0)' : 'translateY(-100%)',
        opacity: scrolled ? 1 : 0,
        transition: 'transform 400ms ease-out, opacity 400ms ease-out',
      }}
    >
      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Mobile menu button */}
        <button className="lg:hidden text-primary-dark" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <span className="font-playfair text-xl sm:text-2xl font-bold text-primary-dark tracking-wide">
            RALI Cosmetics
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden sm:flex">
          <div ref={desktopSearchRef} className="relative w-full">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={(e) => e.key === 'Escape' && setMostrarSugerencias(false)}
              onFocus={() => sugerencias.length > 0 && setMostrarSugerencias(true)}
              placeholder="Buscar productos..."
              className="w-full border-2 border-primary-light rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            {mostrarSugerencias && sugerencias.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-primary-light z-50 overflow-hidden">
                {sugerencias.map(prod => (
                  <button
                    key={prod.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigate(`/producto/${prod.id}`);
                      setSearch('');
                      setMostrarSugerencias(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-primary-light text-left transition-colors"
                  >
                    {prod.imagen_url ? (
                      <img src={prod.imagen_url} alt={prod.nombre} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary-light flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-dark truncate">{prod.nombre}</p>
                      <p className="text-xs text-primary font-semibold">S/ {Number(prod.precio).toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Icons */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Wishlist */}
          {user && (
            <Link to="/perfil?tab=deseos" className="text-primary-dark hover:text-primary transition-colors hidden sm:block">
              <HeartIcon className="w-6 h-6" />
            </Link>
          )}

          {/* Account */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="text-primary-dark hover:text-primary transition-colors"
            >
              <UserIcon className="w-6 h-6" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-primary-light py-2 z-50">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-primary-light">
                      <p className="text-sm font-semibold text-text-dark truncate">{user.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {user.rol === 'admin' && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-primary-light text-primary-dark">
                        Panel Admin
                      </Link>
                    )}
                    <Link to="/perfil" onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-primary-light text-primary-dark">
                      Mi perfil
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-primary-light text-primary-dark">
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-primary-light text-primary-dark">
                      Iniciar sesión
                    </Link>
                    <Link to="/registro" onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-primary-light text-primary-dark">
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <button
            onClick={() => setOpen(true)}
            className="relative text-primary-dark hover:text-primary transition-colors"
          >
            <ShoppingBagIcon className="w-6 h-6" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={handleSearch} className="sm:hidden px-4 pb-3">
        <div ref={mobileSearchRef} className="relative">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            onKeyDown={(e) => e.key === 'Escape' && setMostrarSugerencias(false)}
            onFocus={() => sugerencias.length > 0 && setMostrarSugerencias(true)}
            placeholder="Buscar productos..."
            className="w-full border-2 border-primary-light rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
          {mostrarSugerencias && sugerencias.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-primary-light z-50 overflow-hidden">
              {sugerencias.map(prod => (
                <button
                  key={prod.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigate(`/producto/${prod.id}`);
                    setSearch('');
                    setMostrarSugerencias(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-primary-light text-left transition-colors"
                >
                  {prod.imagen_url ? (
                    <img src={prod.imagen_url} alt={prod.nombre} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary-light flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-dark truncate">{prod.nombre}</p>
                    <p className="text-xs text-primary font-semibold">S/ {Number(prod.precio).toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* Category navbar */}
      <nav className="hidden lg:block border-t border-primary-light bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <li key={cat.slug}>
                <Link
                  to={`/categoria/${cat.slug}`}
                  className="block px-3 py-3 text-sm font-medium text-text-dark hover:text-primary hover:border-b-2 hover:border-primary transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-primary-light">
          <nav className="px-4 py-2">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                to={`/categoria/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 border-b border-primary-light text-sm font-medium text-text-dark hover:text-primary"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
