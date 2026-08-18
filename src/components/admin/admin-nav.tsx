'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/usuarios', label: 'Usuários' },
];

/** Menu de navegação da área admin. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '3px solid #020617',
        paddingBottom: 12,
        flexWrap: 'wrap',
      }}
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '8px 14px',
              textDecoration: 'none',
              border: '2px solid #020617',
              background: active ? '#ccff00' : '#ffffff',
              color: '#020617',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}