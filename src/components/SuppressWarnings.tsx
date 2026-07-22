'use client';

import { useEffect } from 'react';

export default function SuppressWarnings() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args: unknown[]) => {
      const msg = args[0];
      if (typeof msg === 'string' && msg.includes('THREE.Clock')) return;
      originalWarn.apply(console, args);
    };

    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      if (msg.includes('Context Lost')) return;
      if (msg.includes('GLTFLoader') && msg.includes('texture')) return;
      originalError.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return null;
}
