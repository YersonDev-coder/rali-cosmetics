import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TopProductsCarousel from '../components/ui/TopProductsCarousel';

const SLIDES = [
  {
    title: 'Maquillaje que te hace brillar',
    subtitle: 'Productos originales para cada look',
    cta: 'Ver colección',
    link: '/categoria/bases',
    bg: 'from-primary-400 to-primary-600',
  },
  {
    title: 'Labiales que enamoran',
    subtitle: 'Los mejores tonos de la temporada',
    cta: 'Ver labiales',
    link: '/categoria/labiales',
    bg: 'from-primary-500 to-primary-700',
  },
  {
    title: 'Cuidado de piel premium',
    subtitle: 'Rutinas para una piel radiante',
    cta: 'Descubrir',
    link: '/categoria/cuidado-piel',
    bg: 'from-primary-300 to-primary-500',
  },
];

const WHY_US = [
  { icon: '🚀', title: 'Envío rápido', desc: 'Delivery en todo Huánuco por solo S/ 5.00' },
  { icon: '✨', title: 'Productos originales', desc: 'Solo marcas certificadas y de calidad' },
  { icon: '🔒', title: 'Pago seguro', desc: 'Paga con Yape, Plin o contra entrega' },
];

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [categories, setCategories] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/products/bestsellers'),
      api.get('/products/new'),
    ]).then(([cats, best, news]) => {
      setCategories(cats.data);
      setBestsellers(best.data);
      setNewProducts(news.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const goPrev = () => { clearInterval(timerRef.current); setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length); };
  const goNext = () => { clearInterval(timerRef.current); setSlide(s => (s + 1) % SLIDES.length); };

  return (
    <div>
      {/* Más vendidos */}
      <TopProductsCarousel />

      {/* Hero Slider */}
      <div className="relative h-72 sm:h-96 lg:h-[500px] overflow-hidden">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 bg-gradient-to-br ${s.bg} flex items-center justify-center transition-opacity duration-700 ${i === slide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="text-center text-white px-4">
              <h2 className="font-playfair text-3xl sm:text-5xl font-bold mb-3 drop-shadow-lg">{s.title}</h2>
              <p className="text-lg sm:text-xl mb-6 text-primary-100">{s.subtitle}</p>
              <Link to={s.link} className="bg-white text-primary-dark font-bold px-8 py-3 rounded-full hover:bg-primary-50 transition-colors text-lg shadow-lg">
                {s.cta}
              </Link>
            </div>
          </div>
        ))}
        <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 text-white transition-colors">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 text-white transition-colors">
          <ChevronRightIcon className="w-6 h-6" />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === slide ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* Categorías destacadas */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark mb-8 text-center">Categorías Destacadas</h2>
        {loading ? <LoadingSpinner fullPage /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/categoria/${cat.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-square bg-primary-light hover:shadow-lg transition-shadow"
              >
                {cat.imagen_url ? (
                  <img src={cat.imagen_url} alt={cat.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">💄</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-3 left-3 right-3 text-white font-semibold text-sm sm:text-base drop-shadow">
                  {cat.nombre}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Novedades */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark mb-8 text-center">Novedades</h2>
        {loading ? <LoadingSpinner fullPage /> : newProducts.length === 0 ? (
          <p className="text-center text-gray-500">Próximamente productos disponibles</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {newProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Banner WhatsApp */}
      <section className="bg-green-500 py-10 text-white text-center">
        <p className="text-xl sm:text-2xl font-bold mb-3">¿Tienes alguna consulta?</p>
        <p className="text-green-100 mb-5">Escríbenos por WhatsApp y te respondemos al instante</p>
        <a
          href="https://wa.me/51983573536?text=Hola%2C%20me%20interesa%20conocer%20más%20sobre%20sus%20productos"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-green-600 font-bold px-8 py-3 rounded-full hover:bg-green-50 transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Escribir al WhatsApp
        </a>
      </section>

      {/* ¿Por qué elegirnos? */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark mb-10 text-center">¿Por qué elegirnos?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {WHY_US.map(item => (
            <div key={item.title} className="text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold text-primary-dark mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Texto SEO local */}
      <section className="max-w-4xl mx-auto px-4 pb-16 text-center">
        <p className="text-gray-400 text-sm leading-relaxed">
          Maquillaje Huánuco, tienda de maquillaje Huánuco, base de maquillaje, dónde comprar
          maquillaje en Huánuco, maquillaje delivery Huánuco, comprar maquillaje por WhatsApp
          Huánuco, ofertas de maquillaje Huánuco, base de maquillaje barata.
        </p>
      </section>
    </div>
  );
}
