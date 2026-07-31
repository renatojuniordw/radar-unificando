'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!session?.user) {
    return (
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
          padding: '6px 14px',
          textDecoration: 'none',
          fontFamily: 'ui-monospace, monospace',
          boxShadow: '2px 2px 0px #000',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        ENTRAR
      </Link>
    );
  }

  const userInitial = session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U';
  const displayName = session.user.name || session.user.email?.split('@')[0] || 'Usuário';

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: isOpen ? '#1e293b' : '#0f172a',
          color: '#ffffff',
          border: isOpen ? '2px solid #ccff00' : '2px solid #334155',
          padding: '4px 10px 4px 6px',
          cursor: 'pointer',
          fontFamily: 'ui-monospace, monospace',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
      >
        {/* Avatar Circle with Online Badge */}
        <div style={{ position: 'relative', width: 26, height: 26 }}>
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={displayName}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid #ccff00',
              }}
            />
          ) : (
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: '#ccff00',
                color: '#020617',
                fontWeight: 900,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {userInitial}
            </div>
          )}
          {/* Status Indicator */}
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 8,
              height: 8,
              backgroundColor: '#00ff66',
              borderRadius: '50%',
              border: '1.5px solid #020617',
            }}
          />
        </div>

        {/* User Info Label */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#f8fafc',
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </span>

        <ChevronDown
          size={14}
          style={{
            color: isOpen ? '#ccff00' : '#94a3b8',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 240,
            backgroundColor: '#0f172a',
            border: '2px solid #ccff00',
            boxShadow: '6px 6px 0px #000',
            zIndex: 200,
            padding: '12px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header info inside dropdown */}
          <div
            style={{
              paddingBottom: 10,
              marginBottom: 10,
              borderBottom: '1px solid #1e293b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#ccff00',
                  color: '#020617',
                  fontWeight: 900,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {userInitial}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {session.user.name || 'Usuário'}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: '#94a3b8',
                    fontFamily: 'ui-monospace, monospace',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {session.user.email}
                </p>
              </div>
            </div>

            {/* Status Chip */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'rgba(204, 255, 0, 0.1)',
                border: '1px solid rgba(204, 255, 0, 0.3)',
                padding: '2px 6px',
                fontSize: 9,
                fontWeight: 800,
                color: '#ccff00',
                fontFamily: 'ui-monospace, monospace',
                textTransform: 'uppercase',
                marginTop: 4,
              }}
            >
              <ShieldCheck size={10} />
              <span>Conectado</span>
            </div>
          </div>

          {/* Menu Links/Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Link
              href="/perfil"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                color: '#f8fafc',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'ui-monospace, monospace',
                textDecoration: 'none',
                backgroundColor: '#1e293b',
                border: '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ccff00';
                e.currentTarget.style.color = '#020617';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e293b';
                e.currentTarget.style.color = '#f8fafc';
              }}
            >
              <User size={14} />
              <span>MEU PERFIL</span>
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                color: '#ff4d4d',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'ui-monospace, monospace',
                textTransform: 'uppercase',
                backgroundColor: 'rgba(255, 77, 77, 0.08)',
                border: '1px solid rgba(255, 77, 77, 0.2)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ff4d4d';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.08)';
                e.currentTarget.style.color = '#ff4d4d';
              }}
            >
              <LogOut size={14} />
              <span>SAIR DA CONTA</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
