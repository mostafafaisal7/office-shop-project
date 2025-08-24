import { Metadata } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Dashboard - OFFICE SHOP',
  description: 'Manage your projects, orders, and account settings',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {children}
      </div>
    </ProtectedRoute>
  );
}
