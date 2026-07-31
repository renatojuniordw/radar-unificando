'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();

  return (
    <header
      style={{
        backgroundColor: '#020617',
        borderBottom: '4px solid #ccff00',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 56 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                backgroundColor: '#ccff00',
                color: '#020617',
                fontWeight: 900,
                fontSize: '0.8rem',
                letterSpacing: '-0.02em',
                border: '2px solid #020617',
                boxShadow: '3px 3px 0px #fff',
                padding: '4px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              RADAR
            </span>
            <span
              style={{
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                fontSize: '1rem',
                whiteSpace: 'nowrap',
              }}
            >
              UNIFICANDO
            </span>
          </Link>

          {session && (
            <nav style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
              {[
                { href: '/perfil', label: 'PERFIL' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    color: '#94a3b8',
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: 'none',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '4px 8px',
                    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div style={{ flexGrow: 1 }} />

          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#64748b', fontSize: 11, fontWeight: 700, fontFamily: 'ui-monospace, monospace', display: 'none' }} className="md:inline">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                style={{
                  backgroundColor: '#ccff00',
                  color: '#020617',
                  border: '2px solid #020617',
                  fontWeight: 900,
                  fontSize: 11,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                SAIR
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              style={{
                backgroundColor: '#ccff00',
                color: '#020617',
                border: '2px solid #020617',
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '6px 12px',
                textDecoration: 'none',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              ENTRAR
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
