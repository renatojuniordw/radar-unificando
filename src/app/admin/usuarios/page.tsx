import { requireAdminPage } from '@/lib/api/admin-page-guard';
import { getAdminUsers } from '@/lib/core/admin/admin-users';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { UsersTable } from '@/components/admin/users-table';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  // Guarda na própria página (antes de qualquer fetch) — o layout não impede a
  // renderização da página no payload do 404.
  await requireAdminPage();

  const users = await getAdminUsers();

  return (
    <>
      <SectionEyebrow mb={1}>Painel Admin</SectionEyebrow>
      <h1
        style={{
          fontSize: '1.6rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: '#020617',
          margin: '0 0 24px',
        }}
      >
        Usuários cadastrados
      </h1>

      <UsersTable users={users} />
    </>
  );
}