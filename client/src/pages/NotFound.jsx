import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-background">
      <div className="text-8xl font-playfair font-bold text-primary-light mb-2">404</div>
      <h1 className="font-playfair text-2xl font-bold text-primary-dark mb-3">Página no encontrada</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Ups, la página que buscas no existe o fue movida. Regresa al inicio y sigue explorando.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link to="/" className="btn-primary">Ir al inicio</Link>
        <a
          href="https://wa.me/51983573536"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
        >
          Contactar soporte
        </a>
      </div>
    </div>
  );
}
