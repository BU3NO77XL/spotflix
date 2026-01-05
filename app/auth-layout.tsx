'use client';

import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#121212]">
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f1f1f',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </div>
  );
}