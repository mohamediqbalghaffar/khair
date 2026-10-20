import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useHaptics } from '../../utils/useHaptics';

export interface MobileKpiCarouselProps {
  children: React.ReactNode;
  desktopGridClassName?: string;
  className?: string;
  breakpoint?: 'sm' | 'md' | 'lg';
}

/**
 * Mobile Touch-Swipe KPI Carousel powered by Embla Carousel with native Kurdish RTL support.
 * On desktop (>= breakpoint), renders children in standard CSS grid.
 * On mobile (< breakpoint), enables smooth fluid swiping with snap points and active indicators.
 */
export const MobileKpiCarousel: React.FC<MobileKpiCarouselProps> = ({
  children,
  desktopGridClassName = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6',
  className = '',
  breakpoint = 'md',
}) => {
  const haptics = useHaptics();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: 'rtl',
    align: 'start',
    containScroll: 'trimSnaps',
    loop: false,
    dragFree: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const items = React.Children.toArray(children);
  const isInitialMount = React.useRef(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const newIdx = emblaApi.selectedScrollSnap();
    setSelectedIndex(newIdx);
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    haptics.selection();
  }, [emblaApi, haptics]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = (index: number) => {
    if (!emblaApi) return;
    haptics.light();
    emblaApi.scrollTo(index);
  };

  const scrollPrev = () => {
    if (!emblaApi) return;
    haptics.light();
    emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (!emblaApi) return;
    haptics.light();
    emblaApi.scrollNext();
  };

  // Define breakpoint visibility classes
  const mobileClass = breakpoint === 'lg' ? 'block lg:hidden' : breakpoint === 'md' ? 'block md:hidden' : 'block sm:hidden';
  const desktopClass = breakpoint === 'lg' ? 'hidden lg:grid' : breakpoint === 'md' ? 'hidden md:grid' : 'hidden sm:grid';

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Multi-column Grid (>= breakpoint) */}
      <div className={`${desktopClass} ${desktopGridClassName.replace(/grid\b/, '').trim()}`}>
        {children}
      </div>

      {/* Mobile Embla Touch Carousel (< breakpoint) */}
      <div
        className={`${mobileClass} relative`}
        role="region"
        aria-roledescription="carousel"
        aria-label="پوختەی ئامارە سەرەکییەکان"
      >
        {/* Swipe hint & slide indicators header */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>پوختەی ئامارەکان (دەست بنێ بۆ گۆڕین)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              {selectedIndex + 1} / {items.length}
            </span>
            {/* RTL Chevrons: in RTL, right is previous, left is next */}
            <button
              type="button"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="کارتی پێشوو"
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-50 transition-all touch-manipulation active:scale-95"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="کارتی داهاتوو"
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-50 transition-all touch-manipulation active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Embla Viewport */}
        <div ref={emblaRef} className="overflow-hidden cursor-grab active:cursor-grabbing rounded-3xl" dir="rtl">
          <div className="flex -ms-3 touch-pan-y">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex-[0_0_88%] min-w-0 ps-3 transition-opacity duration-200"
                style={{ opacity: selectedIndex === idx ? 1 : 0.85 }}
              >
                <div className="h-full">
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        {scrollSnaps.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 pt-1">
            {scrollSnaps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollTo(idx)}
                aria-label={`کارتی ژمارە ${idx + 1}`}
                aria-current={selectedIndex === idx ? 'true' : undefined}
                className={`h-2 rounded-full transition-all duration-300 touch-manipulation ${
                  selectedIndex === idx
                    ? 'w-6 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-xs'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileKpiCarousel;
