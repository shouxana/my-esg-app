'use client';

import React from 'react';
import MainApp from '@/components/MainApp';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <MainApp />
    </div>
  );
}