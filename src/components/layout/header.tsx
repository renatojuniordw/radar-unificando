'use client';

import Link from 'next/link';
import { UserMenu } from './user-menu';

export function Header() {
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

          <div style={{ flexGrow: 1 }} />

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
