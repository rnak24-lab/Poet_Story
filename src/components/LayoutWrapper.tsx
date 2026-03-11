'use client';

import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/Toast';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="max-w-[430px] mx-auto min-h-screen bg-white shadow-lg relative">
        {children}
      </div>
    </ToastProvider>
  );
}
