'use client';

import { useEffect } from 'react';

export default function ConsoleFilter() {
  useEffect(() => {
    const originalLog = console.log.bind(console);
    const originalInfo = console.info.bind(console);
    const originalWarn = console.warn.bind(console);
    const originalDebug = console.debug.bind(console);

    const filter = (fn: typeof console.log, ...args: unknown[]) => {
      const first = typeof args[0] === 'string' ? args[0] : '';
      if (first.startsWith('[Fast Refresh]') || first.startsWith('[HMR]')) return;
      fn(...args);
    };

    console.log = (...args) => filter(originalLog, ...args);
    console.info = (...args) => filter(originalInfo, ...args);
    console.warn = (...args) => filter(originalWarn, ...args);
    console.debug = (...args) => filter(originalDebug, ...args);

    return () => {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.debug = originalDebug;
    };
  }, []);

  return null;
}
