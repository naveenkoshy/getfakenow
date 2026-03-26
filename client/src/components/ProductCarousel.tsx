import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProduct {
  slug: string;
  name: string;
  image: string;
  price: number;
}

interface ProductCarouselProps {
  products: CarouselProduct[];
  badge?: string;
}

export function ProductCarousel({ products, badge }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeGroup, setActiveGroup] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragThreshold = 5;
  const hasDragged = useRef(false);

  // Card width + gap
  const cardWidth = 236; // 220px card + 16px gap

  // How many groups of cards we have
  const visibleCards = typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 5;
  const totalGroups = Math.ceil(products.length / visibleCards);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);

    // Calculate active group based on scroll position
    const groupWidth = visibleCards * cardWidth;
    const currentGroup = Math.round(el.scrollLeft / groupWidth);
    setActiveGroup(Math.min(currentGroup, totalGroups - 1));
  }, [visibleCards, totalGroups]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scrollTo = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = visibleCards * cardWidth;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const scrollToGroup = (group: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const groupWidth = visibleCards * cardWidth;
    el.scrollTo({
      left: group * groupWidth,
      behavior: 'smooth',
    });
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasDragged.current = false;
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = x - startX;
    if (Math.abs(walk) > dragThreshold) {
      hasDragged.current = true;
    }
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="relative group/carousel">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scrollTo('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-black/80 -ml-2"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scrollTo('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-black/80 -mr-2"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {products.map((product) => (
          <Link
            key={product.slug}
            href={`/product/${product.slug}`}
            className="group flex-shrink-0 w-[170px] md:w-[220px] snap-start select-none"
            onClick={handleClick}
            draggable={false}
          >
            <div className="aspect-[3/4] bg-gray-800 overflow-hidden relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                loading="lazy"
                draggable={false}
              />
              {badge && (
                <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold tracking-wider px-2 py-0.5">
                  {badge}
                </span>
              )}
            </div>
            <div className="pt-3">
              <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-red-500 transition-colors truncate">
                {product.name}
              </h3>
              <span className="text-sm font-bold text-gray-300 mt-1 block">
                RM {product.price}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Dot Indicators */}
      {totalGroups > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: totalGroups }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToGroup(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeGroup
                  ? 'w-6 bg-red-500'
                  : 'w-1.5 bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to group ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
