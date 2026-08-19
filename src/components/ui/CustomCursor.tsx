import React, { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX - 10}px`;
        cursorRef.current.style.top = `${e.clientY - 10}px`;
      }
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX - 2}px`;
        dotRef.current.style.top = `${e.clientY - 2}px`;
      }
    };

    const enter = () => {
      if (cursorRef.current) cursorRef.current.style.transform = 'scale(1.8)';
    };

    const leave = () => {
      if (cursorRef.current) cursorRef.current.style.transform = 'scale(1)';
    };

    window.addEventListener('mousemove', move);

    // Add hover listeners to interactive elements
    const addHoverListeners = () => {
      document.querySelectorAll('button, a, input, textarea, [role="button"]').forEach(el => {
        el.addEventListener('mouseenter', enter);
        el.addEventListener('mouseleave', leave);
      });
    };

    // Initial setup
    addHoverListeners();

    // Re-add listeners when DOM changes (for dynamic content)
    const observer = new MutationObserver(() => {
      addHoverListeners();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', move);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Outer ring */}
      <div
        ref={cursorRef}
        style={{
          width: 20,
          height: 20,
          border: '1.5px solid rgba(255,255,255,0.6)',
          borderRadius: '50%',
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 99999,
          transition: 'transform 150ms cubic-bezier(0.4,0,0.2,1)',
          mixBlendMode: 'difference',
          display: 'none',
        }}
      />
      {/* Center dot */}
      <div
        ref={dotRef}
        style={{
          width: 4,
          height: 4,
          background: 'rgba(255,255,255,0.8)',
          borderRadius: '50%',
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 99999,
          display: 'none',
        }}
      />
    </>
  );
}
