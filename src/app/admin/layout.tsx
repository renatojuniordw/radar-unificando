import type { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { AdminNav } from '@/components/admin/admin-nav';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  // Não-admin recebe 404 — não revela que a área existe
  if ((session.user as { role?: string }).role !== 'admin') notFound();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 64px' }}>
      <AdminNav />
      {children}
    </div>
  );
}