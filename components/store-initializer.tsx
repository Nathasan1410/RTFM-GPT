"use client";

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';

export function StoreInitializer() {
  const initialized = useRef(false);
  const initialize = useAppStore((state) => state.initialize);

  useEffect(() => {
    if (!initialized.current) {
      initialize();
      initialized.current = true;
    }
  }, [initialize]);

  return null;
}
