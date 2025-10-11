import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  element?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div';
  stagger?: number;
  duration?: number;
}

const ScrollReveal = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
  element = 'h2',
  stagger = 0.05,
  duration = 1
}: ScrollRevealProps) => {
  const containerRef = useRef<HTMLElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="word" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    // Optimized single animation with reduced complexity
    const wordElements = el.querySelectorAll('.word');
    
    // Combined animation for better performance
    gsap.fromTo(
      wordElements,
      { 
        opacity: baseOpacity,
        y: 30,
        ...(enableBlur && { filter: `blur(${blurStrength}px)` })
      },
      {
        opacity: 1,
        y: 0,
        ...(enableBlur && { filter: 'blur(0px)' }),
        stagger: stagger * 0.5, // Reduced stagger for smoother animation
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom-=10%',
          end: 'bottom top+=10%',
          scrub: 1, // Smoother scrub
          refreshPriority: -1, // Lower priority for better performance
        }
      }
    );

    // Simplified container animation
    gsap.fromTo(
      el,
      { 
        scale: 0.95,
        ...(baseRotation > 0 && { rotate: baseRotation * 0.5 }) // Reduced rotation
      },
      {
        scale: 1,
        ...(baseRotation > 0 && { rotate: 0 }),
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom-=10%',
          end: 'bottom top+=10%',
          scrub: 1,
          refreshPriority: -1,
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, blurStrength, stagger]);

  const Element = element;

  return (
    <Element ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
      <span className={`scroll-reveal-text ${textClassName}`}>{splitText}</span>
    </Element>
  );
};

export default ScrollReveal;
