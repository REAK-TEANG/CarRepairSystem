import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

export function FadeIn({ children, delay = 0, duration = 400, className = "", style = {} }) {
  const el = useRef(null);
  
  useEffect(() => {
    animate(el.current, {
      opacity: [0, 1],
      y: [10, 0],
      duration: duration,
      delay: delay,
      ease: 'outExpo'
    });
  }, [delay, duration]);
  
  return (
    <div ref={el} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </div>
  );
}

export function StaggerGroup({ children, staggerDelay = 50, duration = 400, className = "", elementType = "div", delay = 0 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && containerRef.current.children.length > 0) {
      animate(containerRef.current.children, {
        opacity: [0, 1],
        y: [15, 0],
        duration: duration,
        delay: stagger(staggerDelay, { start: delay }),
        ease: 'outExpo'
      });
    }
  }, [staggerDelay, duration, delay, children]);

  const Tag = elementType;

  return (
    <Tag ref={containerRef} className={className}>
      {children}
    </Tag>
  );
}

export function Pulse({ children, duration = 1200, className = "" }) {
  const el = useRef(null);
  
  useEffect(() => {
    animate(el.current, {
      opacity: [0.3, 1],
      duration: duration,
      alternate: true,
      loop: true,
      ease: 'inOutQuad'
    });
  }, [duration]);
  
  return (
    <div ref={el} className={className}>
      {children}
    </div>
  );
}

export function Spin({ children, duration = 1000, className = "" }) {
  const el = useRef(null);
  
  useEffect(() => {
    animate(el.current, {
      rotate: [0, 360],
      duration: duration,
      loop: true,
      ease: 'linear'
    });
  }, [duration]);
  
  return (
    <div ref={el} className={`inline-block ${className}`}>
      {children}
    </div>
  );
}

export function ScaleIn({ children, delay = 0, duration = 400, className = "" }) {
  const el = useRef(null);
  
  useEffect(() => {
    animate(el.current, {
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: duration,
      delay: delay,
      ease: 'outBack'
    });
  }, [delay, duration]);
  
  return (
    <div ref={el} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
