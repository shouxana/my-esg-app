'use client';

import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMainDashboard = pathname === '/dashboard';

  return (
    <div className="flex-1">
      {children}
    </div>
  );
}