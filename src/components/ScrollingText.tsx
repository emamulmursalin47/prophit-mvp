import { useEffect, useRef, useState } from 'react';

interface ScrollingTextProps {
  text: string;
  className?: string;
}

const ScrollingText = ({ text, className = '' }: ScrollingTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        const needsScroll = textWidth > containerWidth;
        
        setShouldScroll(needsScroll);
        
        if (needsScroll) {
          // Calculate exact distance needed to show hidden text
          const distance = textWidth - containerWidth;
          setScrollDistance(distance);
        }
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${
          shouldScroll ? 'animate-scroll-exact' : ''
        }`}
        style={{
          '--scroll-distance': shouldScroll ? `-${scrollDistance}px` : '0px'
        } as React.CSSProperties}
      >
        {text}
      </span>
    </div>
  );
};

export default ScrollingText;
