import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const PRODUCTS = [
  {
    src: '/productos/top1_base_liquida.png',
    nombre: 'Base Líquida Best Skin Ever',
    bg: '#D81B60',
    panel: '#C2185B',
  },
  {
    src: '/productos/top2_corrector.png',
    nombre: 'Corrector Maybelline',
    bg: '#AD1457',
    panel: '#C2185B',
  },
  {
    src: '/productos/top3_brocha_dior.png',
    nombre: 'Brocha Dior',
    bg: '#880E4F',
    panel: '#AD1457',
  },
  {
    src: '/productos/top4_labial.png',
    nombre: 'Labial Nude Premium',
    bg: '#C2185B',
    panel: '#D81B60',
  },
];

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`;

function getCardStyle(role, isMobile) {
  const base = {
    position: 'absolute',
    aspectRatio: '0.6 / 1',
    transition:
      'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1), bottom 650ms cubic-bezier(0.4,0,0.2,1), height 650ms cubic-bezier(0.4,0,0.2,1)',
    willChange: 'transform, filter, opacity',
  };

  if (role === 'center') {
    return {
      ...base,
      left: '50%',
      bottom: isMobile ? '22%' : 0,
      height: isMobile ? '60%' : '92%',
      transform: `translateX(-50%) scale(${isMobile ? 1.25 : 1.68})`,
      filter: 'none',
      opacity: 1,
      zIndex: 20,
    };
  }
  if (role === 'left') {
    return {
      ...base,
      left: isMobile ? '20%' : '30%',
      bottom: isMobile ? '32%' : '12%',
      height: isMobile ? '16%' : '28%',
      transform: 'translateX(-50%) scale(1)',
      filter: 'blur(2px)',
      opacity: 0.85,
      zIndex: 10,
    };
  }
  if (role === 'right') {
    return {
      ...base,
      left: isMobile ? '80%' : '70%',
      bottom: isMobile ? '32%' : '12%',
      height: isMobile ? '16%' : '28%',
      transform: 'translateX(-50%) scale(1)',
      filter: 'blur(2px)',
      opacity: 0.85,
      zIndex: 10,
    };
  }
  // back
  return {
    ...base,
    left: '50%',
    bottom: isMobile ? '32%' : '12%',
    height: isMobile ? '13%' : '22%',
    transform: 'translateX(-50%) scale(1)',
    filter: 'blur(4px)',
    opacity: 1,
    zIndex: 5,
  };
}

export default function TopProductsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const isSnapping = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    PRODUCTS.forEach((p) => {
      const img = new Image();
      img.src = p.src;
    });
  }, []);

  useEffect(() => {
    let timeout = null;
    const handleScroll = () => {
      if (isSnapping.current) return;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const y = window.scrollY;
        if (y > 0 && y < window.innerHeight) {
          isSnapping.current = true;
          window.scrollTo({
            top: y < window.innerHeight * 0.3 ? 0 : window.innerHeight,
            behavior: 'smooth',
          });
          setTimeout(() => { isSnapping.current = false; }, 800);
        }
      }, 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  const navigate = useCallback(
    (direction) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setActiveIndex((prev) =>
        direction === 'next' ? (prev + 1) % 4 : (prev + 3) % 4
      );
      setTimeout(() => setIsAnimating(false), 650);
    },
    [isAnimating]
  );

  const handleItemClick = useCallback(
    (clickedIndex) => {
      if (isAnimating || clickedIndex === activeIndex) return;
      const leftIndex = (activeIndex + 3) % 4;
      const rightIndex = (activeIndex + 1) % 4;
      setIsAnimating(true);
      if (clickedIndex === leftIndex) {
        setActiveIndex((prev) => (prev + 3) % 4);
      } else if (clickedIndex === rightIndex) {
        setActiveIndex((prev) => (prev + 1) % 4);
      } else {
        setActiveIndex((prev) => (prev + 2) % 4);
      }
      setTimeout(() => setIsAnimating(false), 650);
    },
    [isAnimating, activeIndex]
  );

  const center = activeIndex;
  const left = (activeIndex + 3) % 4;
  const right = (activeIndex + 1) % 4;
  const back = (activeIndex + 2) % 4;

  function getRole(index) {
    if (index === center) return 'center';
    if (index === left) return 'left';
    if (index === right) return 'right';
    return 'back';
  }

  return (
    <div
      style={{
        backgroundColor: PRODUCTS[activeIndex].bg,
        transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        height: '100vh',
      }}
    >
      {/* Grain overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 50,
          opacity: 0.4,
          backgroundImage: GRAIN_SVG,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Ghost text */}
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          top: '18%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 'clamp(90px, 28vw, 380px)',
            fontWeight: 900,
            color: 'white',
            opacity: 0.18,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          RALI COSMETICS
        </span>
      </div>

      {/* Brand label top-left */}
      <div
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: isMobile ? '1rem' : '2rem',
          zIndex: 60,
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          color: 'white',
          opacity: 0.9,
          letterSpacing: '0.18em',
        }}
      >
        MÁS VENDIDOS
      </div>

      {/* Carousel cards */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        {PRODUCTS.map((product, index) => {
          const role = getRole(index);
          const isCenter = role === 'center';
          return (
            <div
              key={index}
              style={{
                ...getCardStyle(role, isMobile),
                cursor: isCenter ? 'default' : 'pointer',
              }}
              onClick={isCenter ? undefined : () => handleItemClick(index)}
            >
              <img
                src={product.src}
                alt={product.nombre}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'bottom center',
                  display: 'block',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom-left: text + nav buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? '1.5rem' : '5rem',
          left: isMobile ? '1rem' : '6rem',
          zIndex: 60,
          maxWidth: 320,
        }}
      >
        <p
          style={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            marginBottom: isMobile ? '0.5rem' : '0.75rem',
            fontSize: isMobile ? '1rem' : '1.375rem',
            color: 'white',
            opacity: 0.95,
          }}
        >
          MÁS VENDIDOS
        </p>
        {!isMobile && (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'white',
              opacity: 0.85,
              lineHeight: 1.6,
              marginBottom: '1.25rem',
            }}
          >
            Los favoritos de nuestras clientas en Huánuco. Calidad premium, precios
            justos, entrega rápida.
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[
            { dir: 'prev', Icon: ArrowLeft },
            { dir: 'next', Icon: ArrowRight },
          ].map(({ dir, Icon }) => (
            <button
              key={dir}
              onClick={() => navigate(dir)}
              style={{
                width: isMobile ? '3rem' : '4rem',
                height: isMobile ? '3rem' : '4rem',
                borderRadius: '9999px',
                background: 'transparent',
                border: '2px solid white',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 150ms, background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={26} strokeWidth={2.25} />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
